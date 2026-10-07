import { expect, type Page, test } from "@playwright/test";

// 1x1 PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function signUp(page: Page) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Ada Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/home$/);
  return email;
}

test("signed-out users are sent to sign-in", async ({ page }) => {
  await page.goto("/uploads");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fuploads/);
});

test("sign up lands on home with free credits, sign out and back in", async ({ page }) => {
  const email = await signUp(page);
  await expect(page.getByRole("heading", { name: /Hi Ada/ })).toBeVisible();
  await expect(page.getByText("30 credits")).toBeVisible();

  // In dev mode the first click can land before hydration; retry opening until the menu shows.
  const signOut = page.getByRole("menuitem", { name: "Sign out" });
  await expect(async () => {
    await page.getByRole("button", { name: "Ada Tester" }).click();
    await expect(signOut).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await signOut.click();
  await expect(page).toHaveURL("/");

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("wrong-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();

  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
});

test("upload an image, see its thumbnail, delete it", async ({ page }) => {
  await signUp(page);
  await page.goto("/uploads");
  await expect(page.getByText("No uploads yet.")).toBeVisible();

  await page.getByTestId("file-input").setInputFiles({ name: "dot.png", mimeType: "image/png", buffer: PNG });
  const thumb = page.getByRole("img", { name: "dot.png" });
  await expect(thumb).toBeVisible({ timeout: 15_000 });
  await expect(thumb).toHaveJSProperty("complete", true);
  expect(await thumb.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Delete dot.png" }).click({ force: true });
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("No uploads yet.")).toBeVisible();
});

test("rejects a file that is not an image", async ({ page }) => {
  await signUp(page);
  await page.goto("/uploads");
  await expect(page.getByText("No uploads yet.")).toBeVisible();
  await page
    .getByTestId("file-input")
    .setInputFiles({ name: "notes.png", mimeType: "image/png", buffer: Buffer.from("definitely not a png") });
  // Passes the browser's type check, so the worker's magic-byte check must reject it.
  await expect(page.getByText("notes.png couldn't be uploaded: Unsupported file type")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("No uploads yet.")).toBeVisible();
});

test("non-admins get 404 for admin; settings exports data", async ({ page }) => {
  await signUp(page);
  const res = await page.goto("/admin");
  expect(res?.status()).toBe(404);

  await page.goto("/settings");
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download my data" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^pixelforge-export-.+\.json$/);
});

test("API rejects unauthenticated calls with the shared error shape", async ({ request }) => {
  const res = await request.post("/api/v1/uploads", { data: { filename: "a.png", mimeType: "image/png", bytes: 1 } });
  expect(res.status()).toBe(401);
  expect(await res.json()).toEqual({ error: { code: "UNAUTHORIZED", message: "Sign in required" } });
});
