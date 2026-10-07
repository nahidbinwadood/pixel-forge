import { execSync } from "node:child_process";
import { test } from "@playwright/test";

const LABEL = process.env.SHOT_LABEL ?? "before";
const OUT = `docs/design/screenshots/${LABEL}`;
const WIDTHS = [375, 768, 1280, 1920];
const THEMES = (process.env.SHOT_THEMES ?? "light,dark").split(",") as ("light" | "dark")[];

// 1x1 PNG, enough to get a real thumbnail into the uploads grid
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const PUBLIC = ["/", "/sign-in", "/sign-up", "/forgot-password"];
const PRIVATE = ["/home", "/uploads", "/settings", "/admin", "/admin/flags", "/admin/health"];
const name = (route: string) => (route === "/" ? "landing" : route.slice(1).replaceAll("/", "-"));

test("capture all routes", async ({ browser }) => {
  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
      // Dark is the app default (not "system"), so pin the theme explicitly for each run.
      await ctx.addInitScript((t) => window.localStorage.setItem("theme", t), theme);
      const page = await ctx.newPage();
      // Scroll through the page so whileInView sections reveal before the full-page capture.
      const revealAll = () =>
        page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 400) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 120));
          }
          window.scrollTo(0, 0);
          await new Promise((r) => setTimeout(r, 400));
        });
      const shot = async (n: string) => {
        await revealAll();
        return page.screenshot({ path: `${OUT}/${n}--${width}-${theme}.png`, fullPage: true, animations: "disabled" });
      };

      for (const route of PUBLIC) {
        await page.goto(route);
        await page.waitForLoadState("load");
        await page.waitForTimeout(2_800); // let the intro light-sweep settle
        await shot(name(route));
      }

      const email = `shot-${theme}-${width}-${Date.now()}@example.com`;
      await page.goto("/sign-up");
      await page.getByLabel("Name").fill("Maya Chen");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password", { exact: true }).fill("Correct-horse-9!");
      await page.getByRole("button", { name: "Create account" }).click();
      await page.waitForURL(/\/home$/);
      execSync("docker compose exec -T postgres psql -U pixelforge", {
        input: `UPDATE "User" SET role='admin' WHERE email='${email}';`,
        stdio: ["pipe", "ignore", "inherit"],
      });

      for (const route of PRIVATE) {
        await page.goto(route);
        await page.waitForLoadState("load");
        await page.waitForTimeout(2_800); // let the intro light-sweep settle
        await shot(name(route));
      }

      // Uploads with content
      await page.goto("/uploads");
      await page.waitForLoadState("load");
      await page.waitForTimeout(1_500); // hydration: the input's onChange must be attached before we set files
      await page.getByTestId("file-input").setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: PNG });
      await page.getByRole("img", { name: "photo.png" }).waitFor({ timeout: 45_000 });
      await shot("uploads-filled");
      await ctx.close();
    }
  }
});
