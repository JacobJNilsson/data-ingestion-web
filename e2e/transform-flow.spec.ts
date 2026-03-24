import { test, expect, type Locator, type Page } from "@playwright/test";
import path from "path";

const PETSTORE_SPEC_URL = "https://petstore.swagger.io/v2/swagger.json";
const CSV_FIXTURE = path.join(__dirname, "fixtures/orders.csv");

// --- Helpers ----------------------------------------------------------------

async function goToTransform(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Transform" }).click();
}

async function selectSourceType(page: Page, type: string) {
  const grid = page.locator(".grid");
  const sourcePanel = grid.locator("> div").first();
  await sourcePanel.locator('select[id*="type-select"]').selectOption(type);
}

async function selectDestType(page: Page, type: string) {
  const grid = page.locator(".grid");
  const destPanel = grid.locator("> div").nth(1);
  await destPanel.locator('select[id*="type-select"]').selectOption(type);
}

async function analyzeCSVSource(page: Page) {
  const grid = page.locator(".grid");
  const sourcePanel = grid.locator("> div").first();
  await sourcePanel.locator('select[id*="type-select"]').selectOption("csv");

  // Upload the CSV fixture.
  const fileInput = sourcePanel.locator('input[type="file"]');
  await fileInput.setInputFiles(CSV_FIXTURE);

  // Wait for analysis to complete.
  await expect(sourcePanel.locator("text=Analyzed")).toBeVisible({ timeout: 15_000 });
}

async function analyzeCSVDest(page: Page) {
  const grid = page.locator(".grid");
  const destPanel = grid.locator("> div").nth(1);
  await destPanel.locator('select[id*="type-select"]').selectOption("csv");
  const fileInput = destPanel.locator('input[type="file"]');
  await fileInput.setInputFiles(CSV_FIXTURE);
  await expect(destPanel.locator("text=Analyzed")).toBeVisible({ timeout: 15_000 });
}

async function analyzeAPISource(page: Page, specUrl: string) {
  const grid = page.locator(".grid");
  const sourcePanel = grid.locator("> div").first();
  await sourcePanel.locator('select[id*="type-select"]').selectOption("api");
  await sourcePanel.locator("input[placeholder*='https://']").fill(specUrl);
  await sourcePanel.locator('button:has-text("Analyze")').click();
  await expect(sourcePanel.locator("text=Select schemas to use")).toBeVisible({ timeout: 30_000 });
}

async function analyzeAPIDest(page: Page, specUrl: string) {
  const grid = page.locator(".grid");
  const destPanel = grid.locator("> div").nth(1);
  await destPanel.locator('select[id*="type-select"]').selectOption("api");
  await destPanel.locator("input[placeholder*='https://']").fill(specUrl);
  await destPanel.locator('button:has-text("Analyze")').click();
  await expect(destPanel.locator("text=Select schemas to use")).toBeVisible({ timeout: 30_000 });
}

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

async function addStep(page: Page, type: string) {
  await page.getByRole("button", { name: `+ ${type}` }).click();
}

async function getContractJSON(page: Page): Promise<Record<string, unknown>> {
  const jsonToggle = page.getByRole("button", { name: /Raw JSON/ });
  await jsonToggle.scrollIntoViewIfNeeded();
  if ((await jsonToggle.getAttribute("aria-expanded")) === "false") {
    await jsonToggle.click();
  }
  const pre = page.locator("pre");
  await expect(pre).toBeVisible({ timeout: 5_000 });
  const text = await pre.textContent();
  return JSON.parse(text!);
}

// --- Tests ------------------------------------------------------------------

test.describe("Transform flow: CSV source", () => {
  test("single source, single dest, generate mappings", async ({ page }) => {
    await goToTransform(page);

    // Analyze CSV as source.
    await analyzeCSVSource(page);

    // Use same CSV as destination (for testing purposes).
    const grid = page.locator(".grid");
    const destPanel = grid.locator("> div").nth(1);
    await destPanel.locator('select[id*="type-select"]').selectOption("csv");
    const fileInput = destPanel.locator('input[type="file"]');
    await fileInput.setInputFiles(CSV_FIXTURE);
    await expect(destPanel.locator("text=Analyzed")).toBeVisible({ timeout: 15_000 });

    // Add a mapping step.
    await addStep(page, "Mapping");

    // Click Generate.
    await page.getByRole("button", { name: "Generate" }).click();

    // Wait for mapping table.
    await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 15_000 });

    // Should have 5 fields mapped (order_id, customer_name, product, quantity, price).
    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    expect(count).toBe(5);

    // All should be field type (exact name match, same schema).
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const sourceSelect = row.locator("select");
      if ((await sourceSelect.count()) > 0) {
        const val = await sourceSelect.inputValue();
        expect(val).not.toBe("__unmapped__");
      }
    }
  });
});

test.describe("Transform flow: step types", () => {
  test("add all step types and verify they render", async ({ page }) => {
    await goToTransform(page);
    await analyzeCSVSource(page);
    // Also analyze destination so contract JSON is generated.
    await analyzeCSVDest(page);

    // Add one of each step type.
    await addStep(page, "Mapping");
    await addStep(page, "Manual Label");
    await addStep(page, "LLM Classify");
    await addStep(page, "Lookup");
    await addStep(page, "Capture Response");

    // Verify all 5 steps have headers visible.
    // The step headers show the type name in a semibold span.
    await expect(page.locator('.text-xs.font-semibold:has-text("Mapping")')).toBeVisible();
    await expect(page.locator('.text-xs.font-semibold:has-text("Manual Label")')).toBeVisible();
    await expect(page.locator('.text-xs.font-semibold:has-text("LLM Classify")')).toBeVisible();
    await expect(page.locator('.text-xs.font-semibold:has-text("Lookup")')).toBeVisible();
    await expect(page.locator('.text-xs.font-semibold:has-text("Capture Response")')).toBeVisible();

    // Verify step count in the contract JSON.
    const contract = await getContractJSON(page);
    const groups = contract.mapping_groups as { steps: unknown[] }[];
    expect(groups.length).toBe(1);
    expect(groups[0].steps.length).toBe(5);
  });

  test("step removal", async ({ page }) => {
    await goToTransform(page);
    await analyzeCSVSource(page);
    await analyzeCSVDest(page);

    await addStep(page, "Mapping");
    await addStep(page, "Manual Label");
    await addStep(page, "Lookup");

    // Should have 3 steps.
    let contract = await getContractJSON(page);
    let steps = (contract.mapping_groups as { steps: unknown[] }[])[0].steps;
    expect(steps.length).toBe(3);

    // Remove any step -- just click the first Remove button.
    await page.locator('button:has-text("Remove")').first().click();

    // Should have 2 steps now.
    contract = await getContractJSON(page);
    steps = (contract.mapping_groups as { steps: unknown[] }[])[0].steps;
    expect(steps.length).toBe(2);
  });
});

test.describe("Transform flow: input/output chaining", () => {
  test("manual label step has field dropdown from source", async ({ page }) => {
    await goToTransform(page);
    await analyzeCSVSource(page);
    await analyzeCSVDest(page);

    // Add a manual label step.
    await addStep(page, "Manual Label");

    // Select the source as input.
    const inputSelect = page.locator("select").filter({ hasText: "-- Select input --" }).first();
    await inputSelect.selectOption({ index: 1 }); // First source option.

    // The field dropdown should now have the CSV field names.
    const fieldSelect = page.locator("select").filter({ hasText: "-- Select field --" }).first();
    await expect(fieldSelect).toBeVisible();

    // Check that CSV fields are available.
    const options = await fieldSelect.locator("option").allTextContents();
    expect(options).toContain("order_id");
    expect(options).toContain("customer_name");
    expect(options).toContain("product");
  });

  test("step output_ref appears as input option for later steps", async ({ page }) => {
    await goToTransform(page);
    await analyzeCSVSource(page);
    await analyzeCSVDest(page);

    // Add a manual label step with output_ref.
    await addStep(page, "Manual Label");
    const outputInput = page.locator('input[placeholder*="manual_label_output"]');
    await outputInput.fill("labeled_orders");

    // Add a mapping step.
    await addStep(page, "Mapping");

    // The mapping step's input dropdown should contain "labeled_orders".
    const inputSelects = page.locator("select").filter({ hasText: "-- Select input --" });
    const mappingInput = inputSelects.last();
    const inputOptions = await mappingInput.locator("option").allTextContents();
    expect(inputOptions.join(",")).toContain("labeled_orders");
  });
});

test.describe("Transform flow: multi-destination", () => {
  test("add destination creates new tab", async ({ page }) => {
    await goToTransform(page);
    await analyzeCSVSource(page);

    // Analyze destination.
    await analyzeAPIDest(page, PETSTORE_SPEC_URL);

    // Check two schemas as destinations.
    const destPanel = page.locator(".grid > div").nth(1);
    await setSchemaChecked(destPanel, "POST /pet", true);
    await setSchemaChecked(destPanel, "POST /user", true);

    // Should have 2 destination tabs.
    const tabs = page.locator('button:has-text("POST /")');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(2);
  });
});

test.describe("Transform flow: contract JSON output", () => {
  test("contract has correct structure with steps", async ({ page }) => {
    await goToTransform(page);
    await analyzeCSVSource(page);
    await analyzeCSVDest(page);

    // Add steps.
    await addStep(page, "Manual Label");
    await addStep(page, "Mapping");

    // Set output_ref on step 1.
    const outputInput = page.locator('input[placeholder*="manual_label_output"]');
    await outputInput.fill("labeled");

    // Get contract JSON.
    const contract = await getContractJSON(page);

    expect(contract.contract_type).toBe("transformation");
    expect(contract.transformation_id).toBe("manual");
    expect(contract.source_refs).toBeDefined();
    expect(contract.destination_refs).toBeDefined();
    expect(contract.mapping_groups).toBeDefined();

    const groups = contract.mapping_groups as { destination_ref: string; steps: { id: string; type: string; input_ref: string; output_ref: string }[] }[];
    expect(groups.length).toBe(1);

    const steps = groups[0].steps;
    expect(steps.length).toBe(2);
    expect(steps[0].type).toBe("manual_label");
    expect(steps[0].output_ref).toBe("labeled");
    expect(steps[1].type).toBe("mapping");

    // Each step should have id, type, input_ref, output_ref.
    for (const step of steps) {
      expect(step.id).toBeTruthy();
      expect(step.type).toBeTruthy();
      expect(typeof step.input_ref).toBe("string");
      expect(typeof step.output_ref).toBe("string");
    }
  });
});

test.describe("Transform flow: add/remove sources", () => {
  test("add source creates new panel", async ({ page }) => {
    await goToTransform(page);
    await analyzeCSVSource(page);

    // Click + Add Source.
    await page.getByRole("button", { name: "+ Add Source" }).click();

    // Should now have 2 source panels (2 label inputs on the source side).
    const sourceLabels = page.locator(".grid > div").first().locator('input[aria-label*="Label for source"]');
    expect(await sourceLabels.count()).toBe(2);
  });
});
