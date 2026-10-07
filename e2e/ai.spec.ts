import { expect, type Page, test } from "@playwright/test";

// Runs against AI_PROVIDER=mock (deterministic, offline). 1x1 white PNG for the background remover.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

// First dev-mode compile of each AI route is slow; the jobs themselves take well under a second (mock).
test.setTimeout(120_000);

async function signUp(page: Page) {
  const email = `e2e-ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Ada Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Correct-horse-9!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });
}

async function balance(page: Page): Promise<number> {
  const res = await page.request.get("/api/v1/credits");
  return ((await res.json()) as { balance: number }).balance;
}

test("generate images: credits decrease and a result is saved to the library", async ({ page }) => {
  await signUp(page);
  await page.getByRole("link", { name: /Try AI/ }).click();
  await expect(page).toHaveURL(/\/ai$/);
  await page.getByRole("link", { name: /Image generator/ }).click();

  await page.getByLabel("Prompt").fill("A ceramic mug on a sunny table");
  await page.getByRole("radio", { name: "2", exact: true }).click();
  await page.getByRole("button", { name: /Generate/ }).click();

  const downloads = page.getByRole("button", { name: "Download" });
  await expect(downloads).toHaveCount(2, { timeout: 30_000 });
  expect(await balance(page)).toBe(30 - 4);

  await page.getByRole("button", { name: "Save to library" }).first().click();
  await expect(page.getByText("Saved to your uploads")).toBeVisible();
  await page.goto("/uploads");
  await expect(page.getByRole("img", { name: /^ai-/ })).toBeVisible({ timeout: 15_000 });

  // History shows the run and its prompt.
  await page.goto("/ai/generate");
  await expect(page.getByText("A ceramic mug on a sunny table")).toBeVisible();
});

test("blocked prompt is refused without charging credits", async ({ page }) => {
  await signUp(page);
  await page.goto("/ai/generate");
  await page.getByLabel("Prompt").fill("nsfw poster");
  await page.getByRole("button", { name: /Generate/ }).click();
  await expect(page.getByText(/isn't allowed by our content policy/)).toBeVisible({ timeout: 15_000 });
  expect(await balance(page)).toBe(30);
});

test("write captions", async ({ page }) => {
  await signUp(page);
  await page.goto("/ai/write");
  await page.getByLabel("Topic").fill("Cold brew launch at our corner cafe");
  await page.getByRole("button", { name: /^Write/ }).click();
  await expect(page.getByRole("button", { name: "Copy" })).toHaveCount(3, { timeout: 30_000 });
  expect(await balance(page)).toBe(29);

  await page.goto("/ai/history");
  await expect(page.getByText("Spent: AI writer")).toBeVisible();
});

test("remove a background from a fresh upload", async ({ page }) => {
  await signUp(page);
  await page.goto("/ai/remove-background");
  await page.getByTestId("file-input").setInputFiles({ name: "dot.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByRole("radio", { name: "dot.png" })).toBeChecked({ timeout: 20_000 });
  await page.getByRole("button", { name: /Remove background/ }).click();
  await expect(page.getByRole("slider", { name: "Compare cut-out and original" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Download" })).toBeVisible();
  expect(await balance(page)).toBe(29);
});
