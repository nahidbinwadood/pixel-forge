import { expect, test } from "@playwright/test";

test("pricing renders plans from config", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { name: /Simple pricing/ })).toBeVisible();
  // Plan names come straight from packages/shared/src/plans.ts.
  await expect(page.getByRole("heading", { name: "Plus", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pro", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Team", exact: true })).toBeVisible();
  // No Stripe keys in this environment, so paid plans fall back to the waitlist.
  await expect(page.getByRole("button", { name: "Join waitlist" }).first()).toBeVisible();
});

test("the waitlist form submits", async ({ page }) => {
  await page.goto("/pricing#waitlist");
  const waitlist = page.locator("#waitlist");
  const email = `e2e-waitlist-${Date.now()}@example.com`;
  await waitlist.getByLabel("Email").fill(email);
  await waitlist.getByRole("button", { name: "Join waitlist" }).click();
  await expect(page.getByText("You're on the list")).toBeVisible();
});

test("legal pages render", async ({ page }) => {
  for (const [path, heading] of [
    ["/terms", "Terms of Service"],
    ["/privacy", "Privacy Policy"],
    ["/cookies", "Cookie Policy"],
    ["/dmca", "DMCA & Copyright Policy"],
    ["/ai-policy", "AI Usage Policy"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  }
});

test("about and contact pages render", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("About");

  await page.goto("/contact");
  await expect(page.getByLabel("Name")).toBeVisible();
});

test("sitemap lists the public pages", async ({ page, baseURL }) => {
  const res = await page.request.get("/sitemap.xml");
  expect(res.ok()).toBe(true);
  const body = await res.text();
  expect(body).toContain(`${baseURL}/pricing`);
  expect(body).toContain(`${baseURL}/terms`);
});

test("robots.txt points at the sitemap", async ({ page, baseURL }) => {
  const res = await page.request.get("/robots.txt");
  expect(res.ok()).toBe(true);
  expect(await res.text()).toContain(`${baseURL}/sitemap.xml`);
});

test("security headers are present", async ({ page }) => {
  const res = await page.goto("/pricing");
  const headers = res?.headers() ?? {};
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["strict-transport-security"]).toBeTruthy();
});
