import { test, expect, type Page } from "@playwright/test";
import path from "path";

const CSV_FIXTURE = path.join(__dirname, "fixtures/orders.csv");

// --- Helpers ---

async function goToTransform(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Transform" }).click();
}

async function analyzeCSV(page: Page, connIndex: number) {
  // Find the Nth connection container.
  const connContainers = page.locator('div:has(> div > input[aria-label*="Label for connection"])');
  const conn = connContainers.nth(connIndex);

  await conn.locator('select[id*="type-select"]').selectOption("csv");
  await conn.locator('input[type="file"]').setInputFiles(CSV_FIXTURE);
  await expect(conn.locator("text=Analyzed")).toBeVisible({ timeout: 15_000 });
}

async function setRole(page: Page, connIndex: number, role: string) {
  const connContainers = page.locator('div:has(> div > input[aria-label*="Label for connection"])');
  await connContainers.nth(connIndex).locator('select[aria-label="Connection role"]').selectOption(role);
}

async function addConnection(page: Page) {
  await page.getByRole("button", { name: "+ Add Connection" }).click();
}

async function addStep(page: Page, type: string) {
  await page.getByRole("button", { name: `+ ${type}` }).click();
}

async function getContractJSON(page: Page): Promise<Record<string, unknown>> {
  const jsonToggle = page.getByRole("button", { name: /Raw JSON/ });
  await jsonToggle.scrollIntoViewIfNeeded();
  // Toggle open if closed, or close and reopen to refresh content.
  const expanded = await jsonToggle.getAttribute("aria-expanded");
  if (expanded === "true") {
    await jsonToggle.click(); // close
    await jsonToggle.click(); // reopen
  } else {
    await jsonToggle.click(); // open
  }
  const pre = page.locator("pre");
  await expect(pre).toBeVisible({ timeout: 5_000 });
  return JSON.parse((await pre.textContent())!);
}

// --- Tests ---

test.describe("Pipeline: basic flow", () => {
  test("CSV source + destination, add map step, generate mappings", async ({ page }) => {
    await goToTransform(page);

    // Analyze first connection as source.
    await analyzeCSV(page, 0);

    // Add a second connection as destination.
    await addConnection(page);
    await setRole(page, 1, "destination");
    await analyzeCSV(page, 1);

    // Add a map step.
    await addStep(page, "Map");

    // Click Generate (exact match to avoid matching "Generate Pipeline Plan").
    await page.getByRole("button", { name: "Generate", exact: true }).click();
    await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 15_000 });

    // Should have 5 mapped fields.
    const rows = page.locator("table tbody tr");
    expect(await rows.count()).toBe(5);
  });
});

test.describe("Pipeline: step types", () => {
  test("add all step types", async ({ page }) => {
    await goToTransform(page);
    await analyzeCSV(page, 0);
    await addConnection(page);
    await setRole(page, 1, "destination");
    await analyzeCSV(page, 1);

    for (const type of ["Map", "Send", "Label", "Classify", "Lookup", "Filter", "Merge"]) {
      await addStep(page, type);
    }

    const contract = await getContractJSON(page);
    const steps = contract.steps as { type: string }[];
    expect(steps.length).toBe(7);
    expect(steps.map((s) => s.type)).toEqual(["map", "send", "label", "classify", "lookup", "filter", "merge"]);
  });

  test("step removal", async ({ page }) => {
    await goToTransform(page);
    await analyzeCSV(page, 0);
    await addConnection(page);
    await setRole(page, 1, "destination");
    await analyzeCSV(page, 1);

    await addStep(page, "Map");
    await addStep(page, "Send");
    await addStep(page, "Label");

    let contract = await getContractJSON(page);
    expect((contract.steps as unknown[]).length).toBe(3);

    // Click the Remove button inside a step (not the connection Remove).
    // Steps have headers with step number + type label + Remove button.
    const stepHeaders = page.locator('.text-xs.font-semibold:has-text("Map")');
    const stepRemove = stepHeaders.first().locator('..').locator('..').locator('button:has-text("Remove")');
    await stepRemove.click();

    contract = await getContractJSON(page);
    expect((contract.steps as unknown[]).length).toBe(2);
  });
});

test.describe("Pipeline: connections", () => {
  test("connection role change", async ({ page }) => {
    await goToTransform(page);
    await analyzeCSV(page, 0);
    await setRole(page, 0, "both");

    // Add a step to get contract JSON.
    await addStep(page, "Map");

    const contract = await getContractJSON(page);
    expect(contract.sources).toBeTruthy();
    expect(contract.destinations).toBeTruthy();
    // With role "both", the same connection is both source and destination.
    const sourceKeys = Object.keys(contract.sources as Record<string, unknown>);
    const destKeys = Object.keys(contract.destinations as Record<string, unknown>);
    expect(sourceKeys.length).toBeGreaterThan(0);
    expect(destKeys.length).toBeGreaterThan(0);
    expect(sourceKeys[0]).toBe(destKeys[0]);
  });

  test("add connection creates new panel", async ({ page }) => {
    await goToTransform(page);
    await addConnection(page);

    const labels = page.locator('input[aria-label*="Label for connection"]');
    expect(await labels.count()).toBe(2);
  });
});

test.describe("Pipeline: contract output", () => {
  test("contract has correct pipeline structure", async ({ page }) => {
    await goToTransform(page);
    await analyzeCSV(page, 0);
    await addConnection(page);
    await setRole(page, 1, "destination");
    await analyzeCSV(page, 1);

    await addStep(page, "Map");
    await addStep(page, "Send");

    const contract = await getContractJSON(page);
    expect(contract.contract_type).toBe("pipeline");
    expect(contract.pipeline_id).toBe("draft");
    expect(contract.sources).toBeTruthy();
    expect(contract.destinations).toBeTruthy();
    expect(contract.steps).toBeDefined();

    const steps = contract.steps as { id: string; type: string; inputs: string[]; output: string }[];
    expect(steps.length).toBe(2);
    expect(steps[0].type).toBe("map");
    expect(steps[1].type).toBe("send");

    for (const step of steps) {
      expect(step.id).toBeTruthy();
      expect(Array.isArray(step.inputs)).toBe(true);
      expect(typeof step.output).toBe("string");
    }
  });
});

test.describe("Pipeline: error handling", () => {
  test("failed Supabase analysis shows error without crashing", async ({ page }) => {
    await goToTransform(page);

    // Select Supabase analyzer.
    const conn = page.locator('select[id*="conn"][id*="type-select"]').first();
    await conn.selectOption("supabase");

    // Submit with an invalid URL and key.
    const urlInput = page.locator('input[placeholder*="https://"]').first();
    await urlInput.fill("https://invalid.supabase.co");

    const keyInput = page.locator('input[type="password"]').first();
    await keyInput.fill("fake-key");

    await page.locator('button:has-text("Analyze")').first().click();

    // Should show an error message, NOT crash.
    // Wait for either an error message or the "Analyzed" state.
    const errorOrAnalyzed = await Promise.race([
      page.locator("text=analysis failed").waitFor({ timeout: 15_000 }).then(() => "error"),
      page.locator("text=API error").waitFor({ timeout: 15_000 }).then(() => "error"),
      page.locator("text=Analyzed").waitFor({ timeout: 15_000 }).then(() => "analyzed"),
    ]).catch(() => "timeout");

    // Should be an error, not a crash.
    expect(errorOrAnalyzed).toBe("error");

    // The page should still be functional -- no unhandled exception.
    // Verify we can still interact with the page.
    await expect(page.getByRole("button", { name: "+ Add Connection" })).toBeVisible();
  });

  test("page does not crash with malformed contract response", async ({ page }) => {
    // Intercept the analyze-supabase endpoint to return a malformed contract
    // with schemas: null (the exact bug scenario).
    await page.route("**/api/v1/analyze-supabase", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          contract_type: "destination",
          id: "bad-db",
          schemas: null,
        }),
      });
    });

    await goToTransform(page);

    const conn = page.locator('select[id*="conn"][id*="type-select"]').first();
    await conn.selectOption("supabase");

    const urlInput = page.locator('input[placeholder*="https://"]').first();
    await urlInput.fill("https://test.supabase.co");

    const keyInput = page.locator('input[type="password"]').first();
    await keyInput.fill("test-key");

    await page.locator('button:has-text("Analyze")').first().click();

    // Wait for the contract to be set (mocked response returns immediately).
    await page.waitForTimeout(1000);

    // The page should NOT have crashed -- verify we can still interact.
    await expect(page.getByRole("button", { name: "+ Add Connection" })).toBeVisible();

    // No unhandled errors should appear (the schemas: null contract is
    // treated as a SourceContract since Array.isArray(null) is false).
  });
});
