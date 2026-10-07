import { expect, type Page, test } from "@playwright/test";

async function signUp(page: Page) {
  const email = `e2e-editor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Eda Editor");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Correct-horse-9!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });
}

interface SavedDoc {
  revision: number;
  document: { pages: Array<{ nodes: Array<{ type: string; text?: string; fill?: { color?: string } }> }> };
}

test("create a design, add text, recolor, undo/redo, persist, export PNG", async ({ page }) => {
  test.setTimeout(120_000);
  await signUp(page);

  // My Designs → New design (default preset: Instagram post) → editor.
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "No designs yet" })).toBeVisible();
  await page.getByTestId("new-design").first().click();
  await page.getByTestId("create-design").click();
  await expect(page).toHaveURL(/\/editor\/[a-z0-9]+$/, { timeout: 30_000 });
  const id = page.url().split("/").pop() ?? "";
  await expect(page.getByRole("application")).toBeVisible({ timeout: 30_000 });

  // Add a heading from the Text panel (open by default).
  await page.getByTestId("add-text-heading").click();
  const panel = page.getByTestId("properties-panel");
  await expect(panel.getByLabel("Text", { exact: true })).toHaveValue("Your headline");

  // Change its color.
  const hex = panel.getByLabel("Color hex");
  await hex.fill("#ff0000");
  await expect(panel.getByLabel("Color hex")).toHaveValue("#ff0000");

  // Undo → original ink color; redo → red again.
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(panel.getByLabel("Color hex")).toHaveValue("#10112a");
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(panel.getByLabel("Color hex")).toHaveValue("#ff0000");

  // Autosave lands, then a reload shows the same document.
  await expect(page.getByTestId("save-status")).toHaveText("Saved", { timeout: 15_000 });
  await page.reload();
  await expect(page.getByRole("application")).toBeVisible({ timeout: 30_000 });
  const res = await page.request.get(`/api/v1/projects/${id}`);
  expect(res.ok()).toBe(true);
  const saved = (await res.json()) as SavedDoc;
  const text = saved.document.pages[0]?.nodes.find((n) => n.type === "text");
  expect(text?.text).toBe("Your headline");
  expect(text?.fill?.color).toBe("#ff0000");

  // Export PNG → a download.
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await expect(page.getByTestId("export-estimate")).toHaveText(/\d+(\.\d+)? (B|KB|MB)/, { timeout: 15_000 });
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("export-download").click()]);
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
