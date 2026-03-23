import { test, expect, type Locator, type Page } from "@playwright/test";

const PETSTORE_SPEC_URL = "https://petstore.swagger.io/v2/swagger.json";

// Helper: check a schema checkbox by its label text within a container.
// If the checkbox is already in the desired state, this is a no-op.
async function setSchemaChecked(
  container: Locator,
  schemaText: string,
  checked: boolean
) {
  // Use the font-mono span that contains the exact schema name to find
  // the right label, avoiding partial matches like "POST /pet" matching
  // "POST /pet/{petId}/uploadImage".
  const label = container.locator(
    `label:has(span.font-mono:text-is("${schemaText}"))`
  );
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

// Helper: get all visible schema labels in a container.
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
  test("Petstore: user fields should map from user endpoint, not pet", async ({
    page,
  }) => {
    await page.goto("/");

    // Switch to Transform tab.
    await page.getByRole("button", { name: "Transform" }).click();

    // --- Analyze source ---
    const grid = page.locator(".grid");
    const sourcePanel = grid.locator("> div").first();
    const destPanel = grid.locator("> div").nth(1);

    // Select API type on source side.
    await sourcePanel.locator('select[id*="type-select"]').selectOption("api");

    // Fill in the Petstore spec URL and analyze.
    await sourcePanel.locator("input[placeholder*='https://']").fill(PETSTORE_SPEC_URL);
    await sourcePanel.locator('button:has-text("Analyze")').click();

    // Wait for schema checkboxes to appear.
    await expect(sourcePanel.locator("text=Select schemas to use")).toBeVisible({ timeout: 30_000 });

    // Log available schemas for debugging.
    const sourceSchemas = await getSchemaLabels(sourcePanel);
    console.log("Source schemas:", sourceSchemas);

    // Check the 3 GET schemas we want as sources.
    // First, uncheck whatever was auto-selected (index 0).
    // We need to check our targets first to avoid "can't uncheck last" guard.
    await setSchemaChecked(sourcePanel, "GET /pet/{petId}", true);
    await setSchemaChecked(sourcePanel, "GET /store/order/{orderId}", true);
    await setSchemaChecked(sourcePanel, "GET /user/{username}", true);

    // Uncheck any schemas that aren't our 3 targets.
    const wantedSourceSchemas = new Set([
      "GET /pet/{petId}",
      "GET /store/order/{orderId}",
      "GET /user/{username}",
    ]);
    for (const schema of sourceSchemas) {
      if (!wantedSourceSchemas.has(schema)) {
        await setSchemaChecked(sourcePanel, schema, false);
      }
    }

    // --- Analyze destination ---
    await destPanel.locator('select[id*="type-select"]').selectOption("api");
    await destPanel.locator("input[placeholder*='https://']").fill(PETSTORE_SPEC_URL);
    await destPanel.locator('button:has-text("Analyze")').click();

    // Wait for schema checkboxes.
    await expect(destPanel.locator("text=Select schemas to use")).toBeVisible({ timeout: 30_000 });

    const destSchemas = await getSchemaLabels(destPanel);
    console.log("Destination schemas:", destSchemas);

    // Check only POST /user, uncheck everything else.
    await setSchemaChecked(destPanel, "POST /user", true);
    for (const schema of destSchemas) {
      if (schema !== "POST /user") {
        await setSchemaChecked(destPanel, schema, false);
      }
    }

    // --- Click the correct destination tab ---
    // There should be a tab for POST /user. If there are multiple dest
    // tabs, click the one containing "/user".
    const destTabs = page.locator('button:has-text("POST /user")');
    const tabCount = await destTabs.count();
    if (tabCount > 0) {
      // Click the tab button (not a checkbox).
      for (let i = 0; i < tabCount; i++) {
        const tab = destTabs.nth(i);
        const tagName = await tab.evaluate((el) => el.tagName);
        if (tagName === "BUTTON") {
          await tab.click();
          break;
        }
      }
    }

    // --- Generate mappings ---
    await page.getByRole("button", { name: "Generate" }).click();

    // Wait for mapping table rows to appear.
    await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 30_000 });

    // --- Assert: all mappings should come from the user endpoint ---
    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();
    console.log(`Mapping rows: ${rowCount}`);
    expect(rowCount).toBe(8); // User schema has 8 fields.

    const failures: string[] = [];

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);

      // Read the destination field name (first td).
      const destField = await row.locator("td").first().locator("span.font-mono").textContent();

      // Read the source select's selected option text.
      const sourceSelect = row.locator("select");
      if ((await sourceSelect.count()) === 0) continue;

      const selectedText = await sourceSelect.evaluate(
        (el: HTMLSelectElement) =>
          el.options[el.selectedIndex]?.textContent?.trim() ?? ""
      );

      console.log(`  ${destField} <- ${selectedText}`);

      // The source should be from GET /user/{username}, not GET /pet or GET /store.
      if (
        selectedText.includes("GET /pet") ||
        selectedText.includes("GET /store")
      ) {
        failures.push(
          `Field "${destField}" mapped to wrong source: "${selectedText}" (should be from GET /user/{username})`
        );
      }
    }

    if (failures.length > 0) {
      throw new Error(
        `Mapping source preference failed:\n${failures.join("\n")}`
      );
    }
  });
});
