import { test, expect } from "@playwright/test";
import fs from "node:fs";
const site = JSON.parse(fs.readFileSync("src/data/site.json", "utf8")) as {
  pages: { path: string }[];
};
for (const width of [390, 768, 1440]) {
  test(`representative pages and navigation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const route of [
      "/",
      "/xf60-2/",
      "/dsf86/",
      "/project/special-delivery/",
      "/travel-stories/",
    ]) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      await expect(page).not.toHaveTitle(/not found/i);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `overflow on ${route}`,
      ).toBeTruthy();
      await page.getByRole("button", { name: "MENU", exact: true }).click();
      await expect(
        page.getByRole("dialog", { name: "Main navigation" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Show yacht models" }).click();
      await expect(
        page
          .getByRole("navigation")
          .getByRole("link", { name: "DSF86", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("dialog", { name: "Main navigation" }),
      ).not.toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}
test("model enquiry validates input, carries the model and never sends a request", async ({
  page,
}) => {
  const outbound: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") outbound.push(r.url());
  });
  await page.goto("/xf60-2/");
  const form = page.locator("form");
  await form.scrollIntoViewIfNeeded();
  await expect(form.getByLabel("Model of interest")).toHaveValue("XF60");
  await form.getByRole("button", { name: "Send demo enquiry" }).click();
  expect(await form.locator(":invalid").count()).toBeGreaterThan(0);
  await form.getByLabel("Name").fill("Client Review");
  await form.getByLabel("Email").fill("invalid");
  await form.getByLabel("Message").fill("Please tell me more about XF60.");
  await form.getByRole("button", { name: "Send demo enquiry" }).click();
  expect(
    await form
      .getByLabel("Email")
      .evaluate((e: HTMLInputElement) => e.validity.valid),
  ).toBe(false);
  await form.getByLabel("Email").fill("review@example.com");
  await form.getByRole("button", { name: "Send demo enquiry" }).click();
  await expect(page.getByRole("status")).toContainText("It was not sent.");
  expect(outbound).toEqual([]);
});
test("gallery supports opening, next photograph and keyboard dismissal", async ({
  page,
}) => {
  await page.goto("/dsf86/");
  const first = page.locator(".gallery-thumb").first();
  await first.scrollIntoViewIfNeeded();
  await first.click();
  const lightbox = page
    .getByRole("dialog", { name: "Yacht photo gallery" })
    .first();
  await expect(lightbox).toBeVisible();
  await lightbox.getByRole("button", { name: "Next photograph" }).click();
  await expect(lightbox.locator(".gallery-controls p")).toContainText("2 /");
  await page.keyboard.press("Escape");
  await expect(lightbox).not.toBeVisible();
});
test("original range map changes departure and zoom", async ({ page }) => {
  await page.goto("/xf60-2/");
  const map = page.getByRole("region", { name: "Indicative yacht range map" });
  await map.getByLabel("Departure port").selectOption({ label: "Opua" });
  await expect(map.getByRole("img")).toHaveAttribute("aria-label", /Opua/);
  await map.getByRole("button", { name: "Zoom to port" }).click();
  await expect(map.getByRole("button", { name: "Show world" })).toBeVisible();
});
test("every published page runs with local, decodable imagery and working internal destinations", async ({
  page,
}) => {
  const paths = new Set(site.pages.map((p) => p.path));
  const aliases = new Set(["/home/", "/xf95-3/", "/our-story/"]);
  const failures: string[] = [];
  for (const p of site.pages) {
    await page.goto(p.path);
    await expect(page).not.toHaveTitle(/not found/i);
    await page
      .locator("img")
      .evaluateAll((imgs) => imgs.forEach((i) => (i.loading = "eager")));
    await page.waitForFunction(() =>
      Array.from(document.images).every((i) => i.complete),
    );
    const broken = await page
      .locator("img")
      .evaluateAll((imgs) =>
        imgs.filter((i) => !i.naturalWidth).map((i) => i.getAttribute("src")),
      );
    if (broken.length)
      failures.push(`${p.path}: broken images ${broken.join(",")}`);
    const hrefs = await page
      .locator("a[href]")
      .evaluateAll((els) =>
        els
          .map((e) => e.getAttribute("href") || "")
          .filter((h) => h.startsWith("/")),
      );
    for (const h of hrefs) {
      const path = h.split(/[?#]/)[0] || "/";
      if (
        !paths.has(path) &&
        !aliases.has(path) &&
        !path.startsWith("/assets/")
      )
        failures.push(`${p.path} links to ${h}`);
    }
    const text = await page.locator("main").innerText();
    if (/\[et_pb_|@ET-DC@|\[ngg/.test(text))
      failures.push(`${p.path}: raw shortcodes`);
  }
  expect([...new Set(failures)]).toEqual([]);
});
test("XF60 deck-layout controls expose both supplied variants", async ({
  page,
}) => {
  await page.goto("/xf60-2/");
  const layouts = page.getByRole("group", { name: "Yacht layout viewer" });
  await expect(layouts).toHaveCount(2);
  const first = layouts.first();
  const initial = await first.locator("img").getAttribute("src");
  await first.getByRole("button", { name: "Next layout" }).click();
  await expect(first.locator("img")).not.toHaveAttribute("src", initial!);
  await expect(first).toContainText("Layout 2 of 2");
});
test("welcome film has a real poster, honours reduced motion and plays on request", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const video = page.locator("video").first();
  await expect(video).toHaveJSProperty("paused", true);
  const poster = await video.getAttribute("poster");
  expect(poster).toMatch(/\.poster\.webp$/);
  const response = await page.request.get(poster!);
  expect(response.ok()).toBeTruthy();
  await page.getByRole("button", { name: "Play film" }).first().click();
  await page.waitForFunction(
    () => document.querySelector("video")!.currentTime > 0.2,
  );
  await page.getByRole("button", { name: "Pause film" }).first().click();
  await expect(video).toHaveJSProperty("paused", true);
});
