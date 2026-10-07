import { expect, type Page, test } from "@playwright/test";

async function signUp(page: Page) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Tem Plater");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Correct-horse-9!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 }); // first dev compile of /home is slow
  return email;
}

test("browse, search, filter templates and use one to open a design", async ({ page }) => {
  await signUp(page);
  await page.goto("/templates");

  // Browse: the seeded library renders as a grid of cards (each a button wrapping its preview image).
  const summerSale = page.getByRole("img", { name: "Summer Sale Post" });
  await expect(summerSale).toBeVisible({ timeout: 15_000 });

  // Search narrows the grid (debounced, server-ranked by full-text search).
  const search = page.getByRole("searchbox", { name: "Search templates" });
  await search.fill("discount");
  const discountBadge = page.getByRole("img", { name: "Discount Badge Post" });
  await expect(discountBadge).toBeVisible({ timeout: 10_000 });
  await expect(summerSale).toBeHidden();

  // Clearing the search and picking a category filters a different way. Wait for the debounced
  // clear to land in the URL before the next filter, so the two don't race each other.
  await search.fill("");
  await expect(page).not.toHaveURL(/q=/, { timeout: 5_000 });
  await page.getByRole("button", { name: "Business", exact: true }).click();
  await expect(page).toHaveURL(/category=business/);
  await expect(discountBadge).toBeHidden();
  const businessCard = page.getByRole("img", { name: "Modern Minimal Business Card" });
  await expect(businessCard).toBeVisible({ timeout: 10_000 });

  // The URL carries the filter, so it survives a reload (shareable, back/forward-friendly).
  await page.reload();
  await expect(page.getByRole("img", { name: "Modern Minimal Business Card" })).toBeVisible();

  // Open detail -> use template -> lands in the editor on a fresh project.
  await businessCard.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Modern Minimal Business Card")).toBeVisible();
  await dialog.getByRole("button", { name: "Use template" }).click();
  await expect(page).toHaveURL(/\/editor\/[^/]+$/, { timeout: 15_000 });

  // The use was recorded server-side (recents), proving the Project row behind the redirect is real.
  const recents = await page.request.get("/api/v1/recents?targetType=template");
  expect(recents.ok()).toBeTruthy();
  const body = (await recents.json()) as { items: { targetType: string; template: { title: string } | null }[] };
  expect(body.items[0]?.template?.title).toBe("Modern Minimal Business Card");
});

test("premium templates show a badge and stay usable for free users (PRD US7.3)", async ({ page }) => {
  await signUp(page);
  await page.goto("/templates?category=ecommerce");

  const premiumCard = page.locator("li", { hasText: "New Collection Banner" });
  await expect(premiumCard.getByText("Premium")).toBeVisible({ timeout: 15_000 });

  // Clicking the badge explains the gate without blocking "Use template" (PRD: free users can open
  // premium templates; only export quality is gated, which is outside this feature's scope).
  await premiumCard.getByText("Premium").click();
  // "Premium templates are free to open..." (the dialog's own body copy) also contains the substring
  // "Premium template", so match the heading specifically rather than any text in the dialog.
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Premium template" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("img", { name: "New Collection Banner" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Use template" }).click();
  await expect(page).toHaveURL(/\/editor\/[^/]+$/, { timeout: 15_000 });
});

test("API: unauthenticated use is rejected, browsing is public", async ({ request }) => {
  const list = await request.get("/api/v1/templates?limit=1");
  expect(list.ok()).toBeTruthy();

  const use = await request.post("/api/v1/templates/does-not-exist/use");
  expect(use.status()).toBe(401);
  expect(await use.json()).toEqual({ error: { code: "UNAUTHORIZED", message: "Sign in required" } });
});
