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

/** The hand-built phrenic nerve, found by search and selected, in this body. */
async function findPhrenic(page: Page, body: string) {
  await page.locator("#structure-search").fill("phrenic nerve");
  await page.waitForSelector('[role="option"]');
  await page
    .getByRole("option", { name: /^Phrenic nerve/i })
    .first()
    .click();
  await page.waitForTimeout(1200);
  assert(
    /^Phrenic nerve/i.test((await infoTitle(page)) ?? ""),
    `the hand-built phrenic nerve is searchable and selectable (${body} body)`,
  );
  await page.screenshot({ path: `${SHOTS}/handmade-phrenic-${body}.png` });
  await page.locator("#structure-search").fill("");
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
  // Turning the body by dragging must not select what is under the pointer
  // on release (drag right, then back so the view is restored).
  const centre = {
    x: (panel.x + panel.width + box.x + box.width) / 2,
    y: box.y + box.height / 2,
  };
  for (const dx of [140, -140]) {
    await desktop.mouse.move(centre.x - dx / 2, centre.y);
    await desktop.mouse.down();
    await desktop.mouse.move(centre.x + dx / 2, centre.y, { steps: 10 });
    await desktop.mouse.up();
    await desktop.waitForTimeout(300);
  }
  assert(
    (await infoTitle(desktop)) === null,
    "dragging to turn the body selects nothing",
  );
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

  // Tap to peel: in peel mode each tap removes just the tapped structure.
  await desktop.getByRole("button", { name: "Tap to peel" }).click();
  const view = await desktop.locator("canvas").boundingBox();
  assert(view, "canvas is laid out");
  const center = { x: view.x + view.width / 2, y: view.y + view.height / 2 };
  await desktop.mouse.click(center.x, center.y);
  await desktop
    .getByRole("button", { name: "Restore (1)" })
    .waitFor({ timeout: 5000 });
  await desktop.waitForTimeout(400); // not a double click
  await desktop.mouse.click(center.x, center.y);
  await desktop
    .getByRole("button", { name: "Restore (2)" })
    .waitFor({ timeout: 5000 });
  assert(
    (await infoTitle(desktop)) === null,
    "two taps in peel mode peel two structures, one each, without selecting",
  );
  await desktop.screenshot({ path: `${SHOTS}/peel-tap.png` });
  await desktop.keyboard.press("Shift+KeyP");
  assert(
    (await desktop.getByRole("button", { name: "Restore (1)" }).count()) === 1,
    "⇧P restores the last peeled structure",
  );
  await desktop.keyboard.press("Escape");
  assert(
    (await desktop
      .getByRole("button", { name: "Tap to peel" })
      .getAttribute("aria-pressed")) === null,
    "Escape leaves peel mode",
  );
  await desktop.getByRole("button", { name: /Show all/ }).click();
  assert(
    (await desktop.getByRole("button", { name: /Restore/ }).count()) === 0,
    "Show all also clears peeled structures",
  );

  // Selecting a muscle fetches the attachment patches model (once).
  const patches = desktop.waitForResponse((r) =>
    r.url().includes("attachments.glb"),
  );
  // Parts: search a head of a muscle, see what it belongs to, go to the whole.
  await desktop.locator("#structure-search").fill("long head of biceps");
  await desktop.waitForSelector('[role="option"]');
  await desktop.keyboard.press("Enter");
  await desktop.waitForTimeout(900);
  assert(
    (await infoTitle(desktop))?.includes("Long head of biceps"),
    "search finds a muscle part (long head of biceps)",
  );
  await desktop.screenshot({ path: `${SHOTS}/muscle-part.png` });
  await desktop.getByRole("button", { name: /^Biceps brachii/ }).click();
  assert(
    (await desktop.getByRole("heading", { name: "Parts" }).count()) === 1,
    "a part links to its whole muscle, which lists its parts",
  );
  // Origins & insertions: the whole biceps is selected now; its patches
  // come from a separate model fetched on demand.
  assert(
    (await desktop
      .getByRole("heading", { name: "Origin and insertion" })
      .count()) === 1,
    "a muscle shows its origin and insertion",
  );
  assert((await patches).ok(), "the attachment patches model loads on demand");
  await desktop.keyboard.press("KeyF");
  await desktop.waitForTimeout(1200);
  await desktop.screenshot({ path: `${SHOTS}/attachments-biceps.png` });
  await desktop.getByRole("button", { name: "Scapula (left)" }).click();
  await desktop.keyboard.press("KeyF");
  await desktop.waitForTimeout(1200);
  assert(
    (await desktop
      .getByRole("heading", { name: "Muscles attached to this bone" })
      .count()) === 1,
    "a bone lists the muscles attached to it",
  );
  await desktop.screenshot({ path: `${SHOTS}/attachments-scapula.png` });

  await desktop.getByRole("button", { name: "Select parts" }).click();
  assert(
    (await desktop
      .getByRole("button", { name: "Select parts" })
      .getAttribute("aria-pressed")) === "true",
    "the parts toggle switches on",
  );

  // Whole organs: the heart is one structure made of its chambers and valves.
  await desktop.getByRole("button", { name: "Select parts" }).click(); // back to wholes
  await desktop.locator("#structure-search").fill("heart");
  await desktop.waitForSelector('[role="option"]');
  await desktop
    .getByRole("option", { name: /^Heart/ })
    .first()
    .click();
  await desktop.waitForTimeout(1200);
  assert(
    (await infoTitle(desktop)) === "Heart" &&
      (await desktop
        .getByRole("button", { name: /Ventricle \(left\)/ })
        .count()) === 1,
    "the heart is selectable as a whole organ that lists its chambers",
  );
  await desktop.screenshot({ path: `${SHOTS}/organ-heart.png` });

  // Hand-built structures: the phrenic nerve is searchable and selectable.
  await findPhrenic(desktop, "male");

  // Female body: the female organs replace the male ones.
  await desktop.getByRole("button", { name: "Settings" }).first().click();
  await desktop.getByText("Female", { exact: true }).click();
  await desktop.screenshot({ path: `${SHOTS}/settings-body.png` });
  await desktop.keyboard.press("Escape");
  await waitForModel(desktop);
  await desktop.locator("#structure-search").fill("uterus");
  await desktop.waitForSelector('[role="option"]');
  await desktop
    .getByRole("option", { name: /^Uterus/ })
    .first()
    .click();
  await desktop.waitForTimeout(1200);
  assert(
    (await infoTitle(desktop)) === "Uterus",
    "the female body shows the uterus",
  );
  await desktop.screenshot({ path: `${SHOTS}/female-uterus.png` });
  await findPhrenic(desktop, "female");
  await desktop.locator("#structure-search").fill("prostate");
  await desktop.waitForTimeout(600);
  assert(
    (await desktop.getByRole("option", { name: /^Prostate/ }).count()) === 0,
    "the female body has no prostate",
  );
  await desktop.locator("#structure-search").fill("");
  await desktop.getByRole("button", { name: "Settings" }).first().click();
  await desktop.getByText("Male", { exact: true }).click();
  await desktop.keyboard.press("Escape");

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
