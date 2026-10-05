/**
 * Explore flow: RTL home, viewer, Hebrew search + focus, click selection,
 * isolate / hide / systems, language switch persistence, iPad and phone
 * layouts. Screenshots go to docs/screenshots/.
 */
import type { Browser, Page } from "playwright";
import { assert, BASE_URL, openPage, SHOTS, waitForModel } from "./helpers";

async function infoTitle(page: Page) {
  const panel = page.locator("aside h2");
  return (await panel.count()) > 0
    ? (await panel.first().innerText()).trim()
    : null;
}

export async function exploreFlow(browser: Browser, errors: string[]) {
  const desktop = await openPage(browser, errors);

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
  // leaves uncovered: deselect, then click there.
  await desktop.locator("#structure-search").fill("deltoid");
  await desktop.waitForSelector('[role="option"]');
  await desktop.keyboard.press("Enter");
  await desktop.waitForTimeout(1200);
  const panel = await desktop.locator("aside").boundingBox();
  const box = await desktop.locator("canvas").boundingBox();
  assert(panel && box, "info panel and canvas are laid out");
  await desktop.keyboard.press("Escape");
  assert((await infoTitle(desktop)) === null, "Escape deselects");
  await desktop.mouse.click(
    (panel.x + panel.width + box.x + box.width) / 2,
    box.y + box.height / 2,
  );
  await desktop.waitForTimeout(300);
  // Real muscles overlap (the deltoid's centre lies behind pectoralis major),
  // so assert that the click selects and names *a* structure.
  const clicked = await infoTitle(desktop);
  assert(
    clicked,
    `clicking a mesh selects and names its structure (${clicked ?? "none"})`,
  );
  await desktop.screenshot({ path: `${SHOTS}/selected.png` });

  // Isolate and hide via keyboard shortcuts.
  await desktop.keyboard.press("KeyI");
  await desktop.waitForTimeout(200);
  assert(
    (await desktop.getByRole("button", { name: /יציאה מבידוד/ }).count()) > 0,
    "I isolates the selection",
  );
  await desktop.screenshot({ path: `${SHOTS}/isolate.png` });
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
  const ipad = await openPage(browser, errors, {
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
  });
  await ipad.goto(`${BASE_URL}/explore?region=upper-limb`);
  await waitForModel(ipad);
  await ipad.locator("#structure-search").fill("ביספס");
  await ipad.waitForSelector('[role="option"]');
  await ipad.keyboard.press("Enter");
  await ipad.waitForTimeout(900);
  await ipad.screenshot({ path: `${SHOTS}/ipad-upper-limb.png` });

  // Phone portrait.
  const phone = await openPage(browser, errors, {
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  await phone.goto(`${BASE_URL}/explore`);
  await waitForModel(phone);
  await phone.locator("#structure-search").fill("clavicle");
  await phone.waitForSelector('[role="option"]');
  await phone.keyboard.press("Enter");
  await phone.waitForTimeout(900);
  await phone.screenshot({ path: `${SHOTS}/phone-clavicle.png` });

  await Promise.all([desktop.close(), ipad.close(), phone.close()]);
}
