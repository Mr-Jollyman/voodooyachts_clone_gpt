import { chromium } from "@playwright/test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
for (const [name, url] of [
  ["prototype", "http://127.0.0.1:5173/"],
  ["source", "https://voodooyachts.com/"],
]) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  if (name === "source")
    await page.route("**/*", async (route) => {
      const req = route.request(),
        u = new URL(req.url());
      if (
        !u.hostname.endsWith("voodooyachts.com") ||
        req.resourceType() === "media"
      )
        return route.abort();
      try {
        const { stdout } = await exec(
          "curl",
          ["-sS", "-L", "--fail", "--max-time", "20", req.url()],
          { encoding: "buffer", maxBuffer: 40 * 1024 * 1024 },
        );
        const type = req.resourceType();
        await route.fulfill({
          body: stdout,
          contentType:
            type === "document"
              ? "text/html"
              : type === "stylesheet"
                ? "text/css"
                : type === "script"
                  ? "application/javascript"
                  : u.pathname.endsWith(".png")
                    ? "image/png"
                    : u.pathname.endsWith(".webp")
                      ? "image/webp"
                      : u.pathname.endsWith(".woff2")
                        ? "font/woff2"
                        : u.pathname.endsWith(".jpg")
                          ? "image/jpeg"
                          : "application/octet-stream",
        });
      } catch {
        await route.abort();
      }
    });
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(5000);
    await page.screenshot({
      path: `/workspace/site-source/screenshots/${name}-home.png`,
    });
    console.log(name, await page.title());
    if (name === "source") {
      console.log(
        "header",
        await page
          .locator("#main-header")
          .evaluate((el) => ({
            height: el.getBoundingClientRect().height,
            background: getComputedStyle(el).backgroundColor,
          })),
      );
      await page.screenshot({
        path: "/workspace/site-source/screenshots/source-home-full.png",
        fullPage: true,
      });
    }
  } catch (e) {
    console.log(name, e.message.slice(0, 250));
  }
  await page.close();
}
await browser.close();
