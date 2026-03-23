import { test, expect } from "@playwright/test";

test.describe("Pipeline tab", () => {
  test("can create a pipeline with source, mapping, and destination steps", async ({
    page,
  }) => {
    await page.goto("/");

    // Switch to Pipeline tab.
    await page.getByRole("button", { name: "Pipeline" }).click();

    // The canvas should be visible.
    await expect(page.locator(".react-flow")).toBeVisible({ timeout: 10_000 });

    // --- Add a Source step ---
    await page.getByRole("button", { name: "Source Load data from a file" }).click();

    // A node should appear on the canvas.
    await expect(page.locator(".react-flow__node")).toHaveCount(1, {
      timeout: 5_000,
    });

    // Click the node to open the editor.
    await page.locator(".react-flow__node").first().click();
    await expect(page.locator("text=Configure: source")).toBeVisible();

    // Fill in a contract reference.
    await page
      .locator('input[placeholder*="orders.csv"]')
      .fill("orders.csv");

    // --- Add a Mapping step ---
    await page.getByRole("button", { name: "Map Fields Transform fields" }).click();
    await expect(page.locator(".react-flow__node")).toHaveCount(2);

    // --- Add a Destination step ---
    await page.getByRole("button", { name: "Destination Write data to a target" }).click();
    await expect(page.locator(".react-flow__node")).toHaveCount(3);

    // Click the destination node and configure it.
    // The last node added is the destination.
    await page.locator(".react-flow__node").last().click();
    await expect(page.locator("text=Configure: destination")).toBeVisible();
    await page
      .locator('input[placeholder*="target-db"]')
      .fill("target-db");

    // --- Verify the pipeline JSON ---
    // Scroll down and toggle the Raw JSON section.
    const jsonToggle = page.getByRole("button", { name: /Raw JSON/ });
    await jsonToggle.scrollIntoViewIfNeeded();
    await jsonToggle.click();

    // Wait for the JSON pre block to be rendered.
    const jsonBlock = page.locator("pre");
    await expect(jsonBlock).toBeVisible({ timeout: 5_000 });

    const jsonText = await jsonBlock.textContent();
    expect(jsonText).toBeTruthy();

    const contract = JSON.parse(jsonText!);
    expect(contract.contract_type).toBe("pipeline");
    expect(contract.pipeline_id).toBe("draft");
    expect(contract.steps).toHaveLength(3);

    // Verify step types.
    const stepTypes = contract.steps.map(
      (s: { type: string }) => s.type
    );
    expect(stepTypes).toContain("source");
    expect(stepTypes).toContain("mapping");
    expect(stepTypes).toContain("destination");

    // Source step should have the contract_ref we entered.
    const srcStep = contract.steps.find(
      (s: { type: string }) => s.type === "source"
    );
    expect(srcStep.config.contract_ref).toBe("orders.csv");

    // Destination step should have the contract_ref we entered.
    const dstStep = contract.steps.find(
      (s: { type: string }) => s.type === "destination"
    );
    expect(dstStep.config.contract_ref).toBe("target-db");
  });

  test("verify pipeline reports issues for invalid pipeline", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Pipeline" }).click();

    // Add only a source step (no destination = invalid).
    await page.getByRole("button", { name: "Source Load data from a file" }).click();
    await expect(page.locator(".react-flow__node")).toHaveCount(1);

    // Configure it.
    await page.locator(".react-flow__node").first().click();
    await page
      .locator('input[placeholder*="orders.csv"]')
      .fill("data.csv");

    // Click Verify Pipeline.
    await page.getByRole("button", { name: "Verify Pipeline" }).click();

    // Should show validation errors.
    await expect(
      page.locator("text=Invalid Pipeline")
    ).toBeVisible({ timeout: 10_000 });

    // Should mention missing destination.
    await expect(
      page.locator("text=no destination steps")
    ).toBeVisible();
  });
});
