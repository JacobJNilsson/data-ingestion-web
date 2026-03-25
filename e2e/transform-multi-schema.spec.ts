import { test, expect, type Locator } from "@playwright/test";

const PETSTORE_SPEC_URL = "https://petstore.swagger.io/v2/swagger.json";

async function setSchemaChecked(container: Locator, schemaText: string, checked: boolean) {
  const label = container.locator(`label:has(span.font-mono:text-is("${schemaText}"))`);
  await expect(label).toBeVisible({ timeout: 5000 });
  const checkbox = label.locator('input[type="checkbox"]');
  if (checked) {
    await checkbox.check();
  } else {
    if (await checkbox.isChecked()) {
      await checkbox.uncheck();
    }
  }
}

async function getSchemaLabels(container: Locator): Promise<string[]> {
  const labels = container.locator("label:has(input[type='checkbox']) span.font-mono");
  const count = await labels.count();
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push((await labels.nth(i).textContent()) ?? "");
  }
  return result;
}

test.describe("Multi-schema mapping", () => {
  test("Petstore: user fields should map from user endpoint, not pet", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Transform" }).click();

    // First connection: API source with Petstore spec.
    const connPanels = page.locator('select[id*="conn"][id*="type-select"]');
    await connPanels.first().selectOption("api");

    const specInputs = page.locator("input[placeholder*='https://']");
    await specInputs.first().fill(PETSTORE_SPEC_URL);
    await page.locator('button:has-text("Analyze")').first().click();

    await expect(page.locator("text=Select schemas to use").first()).toBeVisible({ timeout: 30_000 });

    // Find the first connection's panel area. Use the parent of the label input.
    const firstConnLabel = page.locator('input[aria-label*="Label for connection"]').first();
    const firstConn = firstConnLabel.locator('..').locator('..');
    const sourceSchemas = await getSchemaLabels(firstConn);
    console.log("Source schemas:", sourceSchemas);

    const wantedSourceSchemas = new Set(["GET /pet/{petId}", "GET /store/order/{orderId}", "GET /user/{username}"]);
    for (const schema of wantedSourceSchemas) {
      await setSchemaChecked(firstConn, schema, true);
    }
    for (const schema of sourceSchemas) {
      if (!wantedSourceSchemas.has(schema)) {
        await setSchemaChecked(firstConn, schema, false);
      }
    }

    // Second connection: API destination with same Petstore spec.
    await page.getByRole("button", { name: "+ Add Connection" }).click();

    // Find the second connection's container.
    const secondConnLabel = page.locator('input[aria-label*="Label for connection"]').nth(1);
    const secondConn = secondConnLabel.locator('..').locator('..');

    await secondConn.locator('select[aria-label="Connection role"]').selectOption("destination");
    await secondConn.locator('select[id*="type-select"]').selectOption("api");
    await secondConn.locator("input[placeholder*='https://']").fill(PETSTORE_SPEC_URL);
    await secondConn.locator('button:has-text("Analyze")').click();

    await expect(secondConn.locator("text=Select schemas to use")).toBeVisible({ timeout: 30_000 });
    const destSchemas = await getSchemaLabels(secondConn);
    console.log("Destination schemas:", destSchemas);

    await setSchemaChecked(secondConn, "POST /user", true);
    for (const schema of destSchemas) {
      if (schema !== "POST /user") {
        await setSchemaChecked(secondConn, schema, false);
      }
    }

    // Add a Mapping step.
    await page.getByRole("button", { name: "+ Map" }).click();

    // Generate.
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 30_000 });

    // Assert all fields come from user endpoint.
    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();
    console.log(`Mapping rows: ${rowCount}`);
    expect(rowCount).toBe(8);

    const failures: string[] = [];
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const sourceSelect = row.locator("select");
      if ((await sourceSelect.count()) === 0) continue;

      const selectedText = await sourceSelect.evaluate(
        (el: HTMLSelectElement) => el.options[el.selectedIndex]?.textContent?.trim() ?? ""
      );
      console.log(`  ${await row.locator("td").first().locator("span.font-mono").textContent()} <- ${selectedText}`);

      if (selectedText.includes(":") && (selectedText.includes("GET /pet") || selectedText.includes("GET /store"))) {
        failures.push(`Wrong source: "${selectedText}"`);
      }
    }

    if (failures.length > 0) {
      throw new Error(`Mapping source preference failed:\n${failures.join("\n")}`);
    }
  });
});
