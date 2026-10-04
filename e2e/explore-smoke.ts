/**
 * End-to-end smoke test of the explore vertical slice against a running app.
 *
 *   npm run build && npm run start -- -p 3100
 *   BASE_URL=http://localhost:3100 npm run e2e:smoke
 *
 * Writes screenshots to docs/screenshots/.
 */
import { chromium, type Page } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = "docs/screenshots";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`✗ ${message}`);
  console.log(`✓ ${message}`);
}

async function waitForModel(page: Page) {
  await page.waitForFunction(
    () => !document.querySelector('[role="status"]'),
    null,
    { timeout: 30_000 },
  );
  // Give the camera a moment to settle after the initial framing.
  await page.waitForTimeout(800);
}

async function infoTitle(page: Page) {
  const panel = page.locator("aside h2");
  return (await panel.count()) > 0
    ? (await panel.first().innerText()).trim()
    : null;
}

async function main() {
  const browser = await chromium.launch({
    args: [
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });
  const errors: string[] = [];

  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  desktop.on("pageerror", (e) => errors.push(e.message));
  desktop.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await desktop.goto(BASE_URL);
  assert(
    (await desktop.locator("html").getAttribute("dir")) === "rtl",
    "home page renders RTL by default",
  );
  await desktop.screenshot({ path: `${SHOTS}/home-he.png` });

  await desktop.goto(`${BASE_URL}/explore`);
  await waitForModel(desktop);
  assert(
    (await desktop.locator("canvas").count()) === 1,
    "viewer renders a WebGL canvas",
  );
  await desktop.screenshot({ path: `${SHOTS}/explore-he.png` });

  // Search in Hebrew → select + focus.
  await desktop.keyboard.press("Slash");
  assert(
    await desktop
      .locator("#structure-search")
      .evaluate((el) => el === document.activeElement),
    "/ focuses search",
  );
  await desktop.keyboard.type("עצב מדיאני");
  await desktop.waitForSelector('[role="option"]');
  await desktop.keyboard.press("Enter");
  await desktop.waitForTimeout(900);
  assert(
    (await infoTitle(desktop))?.includes("Median nerve"),
    "Hebrew search selects the median nerve",
  );
  await desktop.screenshot({ path: `${SHOTS}/search-focus-median-nerve.png` });

  // A focused structure is framed in the centre of the area the info panel
  // leaves uncovered: deselect, then click exactly there.
  await desktop.locator("#structure-search").fill("heart");
  await desktop.waitForSelector('[role="option"]');
  await desktop.keyboard.press("Enter");
  await desktop.waitForTimeout(1200);
  const panel = (await desktop.locator("aside").boundingBox())!;
  const box = (await desktop.locator("canvas").boundingBox())!;
  await desktop.keyboard.press("Escape");
  assert((await infoTitle(desktop)) === null, "Escape deselects");
  await desktop.mouse.click(
    (panel.x + panel.width + box.x + box.width) / 2,
    box.y + box.height / 2,
  );
  await desktop.waitForTimeout(300);
  assert(
    (await infoTitle(desktop))?.startsWith("Heart"),
    "clicking a mesh selects its structure",
  );
  await desktop.screenshot({ path: `${SHOTS}/selected-heart.png` });

  // Isolate and hide via keyboard shortcuts.
  await desktop.keyboard.press("KeyI");
  await desktop.waitForTimeout(200);
  assert(
    (await desktop.getByRole("button", { name: /יציאה מבידוד/ }).count()) > 0,
    "I isolates the selection",
  );
  await desktop.screenshot({ path: `${SHOTS}/isolate-heart.png` });
  await desktop.keyboard.press("KeyI");
  await desktop.keyboard.press("KeyH");
  await desktop.waitForTimeout(200);
  assert(
    (await infoTitle(desktop)) === null,
    "H hides and deselects the structure",
  );
  assert(
    (await desktop.getByRole("button", { name: /הצג הכול/ }).count()) > 0,
    "Show all appears after hiding",
  );

  // System toggle.
  await desktop.getByRole("switch", { name: /שלד/ }).click();
  assert(
    (await desktop
      .getByRole("switch", { name: /שלד/ })
      .getAttribute("aria-checked")) === "false",
    "system toggles off",
  );
  await desktop.screenshot({ path: `${SHOTS}/skeletal-hidden.png` });

  // English UI.
  await desktop.getByRole("button", { name: "הגדרות" }).first().click();
  await desktop.locator("select").first().selectOption("en");
  await desktop.keyboard.press("Escape");
  assert(
    (await desktop.locator("html").getAttribute("dir")) === "ltr",
    "switching to English flips to LTR",
  );
  await desktop.getByRole("button", { name: /Show all/ }).click();
  await desktop.reload();
  await waitForModel(desktop);
  assert(
    (await desktop.locator("html").getAttribute("dir")) === "ltr",
    "language choice persists across reload",
  );
  await desktop.screenshot({ path: `${SHOTS}/explore-en.png` });

  // iPad landscape, Hebrew, region scope.
  const ipad = await browser.newPage({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
  });
  ipad.on("pageerror", (e) => errors.push(e.message));
  await ipad.goto(`${BASE_URL}/explore?region=upper-limb`);
  await waitForModel(ipad);
  await ipad.locator("#structure-search").fill("ביספס");
  await ipad.waitForSelector('[role="option"]');
  await ipad.keyboard.press("Enter");
  await ipad.waitForTimeout(900);
  await ipad.screenshot({ path: `${SHOTS}/ipad-upper-limb.png` });

  // Phone portrait.
  const phone = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  await phone.goto(`${BASE_URL}/explore`);
  await waitForModel(phone);
  await phone.locator("#structure-search").fill("liver");
  await phone.waitForSelector('[role="option"]');
  await phone.keyboard.press("Enter");
  await phone.waitForTimeout(900);
  await phone.screenshot({ path: `${SHOTS}/phone-liver.png` });

  await browser.close();
  const relevant = errors.filter((e) => !/GPU stall|WebGL-|GL Driver/i.test(e));
  assert(
    relevant.length === 0,
    `no page errors${relevant.length ? `: ${relevant.join(" | ")}` : ""}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
