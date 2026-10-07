import { execSync } from "node:child_process";
import { expect, test } from "@playwright/test";

function sql(query: string) {
  execSync("docker compose exec -T postgres psql -U pixelforge", {
    input: query,
    stdio: ["pipe", "ignore", "inherit"],
  });
}

test("admin can grant credits, manage a flag, and see system health", async ({ page }) => {
  const email = `admin-e2e-${Date.now()}@example.com`;
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Grace Admin");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/home$/);
  sql(`UPDATE "User" SET role = 'admin' WHERE email = '${email}';`);

  // Users: find self, grant 5 credits (30 free + 5 = 35)
  await page.goto(`/admin?q=${encodeURIComponent(email)}`);
  const grant = page.getByLabel(`Grant credits: ${email}`);
  await expect(async () => {
    await grant.fill("5");
    await expect(page.getByRole("button", { name: "Grant credits" })).toBeEnabled({ timeout: 1_000 });
  }).toPass();
  await page.getByRole("button", { name: "Grant credits" }).click();
  await expect(page.getByRole("row", { name: new RegExp(email) })).toContainText("35", { timeout: 10_000 });

  // Flags: create, enable, and see it reflected in the public flags endpoint
  const key = `e2e.flag_${Date.now()}`;
  await page.goto("/admin/flags");
  await page.getByLabel("Key").fill(key);
  await page.getByRole("button", { name: "Create" }).click();
  const toggle = page.getByRole("switch", { name: `Enabled: ${key}` });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect
    .poll(async () => ((await (await page.request.get("/api/v1/flags")).json()) as Record<string, boolean>)[key])
    .toBe(true);

  // Health: all dependencies up
  await page.goto("/admin/health");
  await expect(page.getByText("Down")).toHaveCount(0);
  await expect(page.getByText("OK")).toHaveCount(4);

  sql(`DELETE FROM "FeatureFlag" WHERE key = '${key}';`);
});
