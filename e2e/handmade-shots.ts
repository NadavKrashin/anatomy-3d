/**
 * Screenshots of every hand-built structure (scripts/anatomy/handmade/), for
 * review: each selected and focused, in front and side views, with the
 * systems that would hide it switched off; female ones in the female body.
 *
 *   npx tsx e2e/handmade-shots.ts            # against BASE_URL (default :3100)
 *   npx tsx e2e/handmade-shots.ts phrenic    # only ids containing "phrenic"
 *   npx tsx e2e/handmade-shots.ts --missing  # only shots not taken yet
 *
 * Writes docs/screenshots/handmade/<id>-front.png and -side.png.
 */
import { existsSync, mkdirSync } from "node:fs";
import { chromium, type Page } from "playwright";
import { BASE_URL, openPage, SHOTS, waitForModel } from "./helpers";

type System =
  | "Skeletal"
  | "Muscular"
  | "Respiratory"
  | "Digestive"
  | "Lymphatic"
  | "Endocrine"
  | "Cardiovascular"
  | "Urinary"
  | "Reproductive"
  | "Other";

interface Shot {
  id: string;
  hide: System[];
  body?: "male" | "female";
  /** Horizontal drag (px) for the second view; vertical drag for a view from below. */
  turn?: number;
  tilt?: number;
}

const DEEP_NECK: System[] = ["Muscular", "Lymphatic", "Other"];
const CHEST: System[] = [
  "Muscular",
  "Skeletal",
  "Respiratory",
  "Endocrine",
  "Lymphatic",
  "Other",
];
const BELLY: System[] = ["Muscular", "Skeletal", "Respiratory", "Other"];
const PERINEUM: System[] = ["Digestive", "Urinary", "Other"];

const SHOTS_LIST: Shot[] = [
  { id: "phrenic-nerve-left", hide: CHEST },
  { id: "phrenic-nerve-right", hide: CHEST, turn: -260 },
  { id: "recurrent-laryngeal-nerve-left", hide: [...CHEST, "Digestive"] },
  {
    id: "recurrent-laryngeal-nerve-right",
    hide: [...CHEST, "Digestive"],
    turn: -260,
  },
  { id: "superior-laryngeal-nerve-left", hide: DEEP_NECK },
  { id: "superior-laryngeal-nerve-right", hide: DEEP_NECK, turn: -260 },
  { id: "ansa-cervicalis-left", hide: DEEP_NECK },
  { id: "ansa-cervicalis-right", hide: DEEP_NECK, turn: -260 },
  { id: "lesser-occipital-nerve-left", hide: ["Lymphatic"] },
  { id: "great-auricular-nerve-left", hide: ["Lymphatic"] },
  { id: "transverse-cervical-nerve-left", hide: ["Lymphatic"] },
  { id: "supraclavicular-nerves-left", hide: ["Lymphatic"] },
  { id: "superior-thyroid-artery-left", hide: DEEP_NECK },
  { id: "superior-laryngeal-artery-left", hide: DEEP_NECK },
  { id: "thoracic-duct", hide: [...CHEST, "Digestive"], turn: 520 },
  { id: "cisterna-chyli", hide: [...BELLY, "Digestive", "Urinary"], turn: 520 },
  { id: "cystic-artery", hide: BELLY },
  { id: "short-gastric-arteries", hide: BELLY, turn: 260 },
  { id: "perineal-body", hide: PERINEUM, tilt: 260 },
  {
    id: "superficial-transverse-perineal-muscle-left",
    hide: PERINEUM,
    tilt: 260,
  },
  { id: "deep-transverse-perineal-muscle-left", hide: PERINEUM, tilt: 260 },
  {
    id: "external-urethral-sphincter",
    hide: ["Digestive", "Other"],
    tilt: 260,
  },
  { id: "bulbospongiosus-muscle", hide: PERINEUM, tilt: 260 },
  { id: "ischiocavernosus-muscle-left", hide: PERINEUM, tilt: 260 },
  { id: "anal-canal", hide: ["Urinary", "Reproductive", "Other"], turn: 260 },
  {
    id: "internal-anal-sphincter",
    hide: ["Urinary", "Reproductive", "Other"],
    turn: 260,
  },
  // Female body
  { id: "perineal-body", hide: PERINEUM, tilt: 260, body: "female" },
  {
    id: "external-urethral-sphincter",
    hide: ["Digestive", "Other"],
    tilt: 260,
    body: "female",
  },
  { id: "bulbospongiosus-muscle", hide: PERINEUM, tilt: 260, body: "female" },
  {
    id: "ischiocavernosus-muscle-left",
    hide: PERINEUM,
    tilt: 260,
    body: "female",
  },
];

async function setSystems(page: Page, hide: System[]) {
  for (const name of hide) {
    const sw = page.getByRole("switch", { name: new RegExp(`^${name}`) });
    if (
      (await sw.count()) &&
      (await sw.first().getAttribute("aria-checked")) === "true"
    )
      await sw.first().click();
  }
}

async function drag(page: Page, dx: number, dy: number) {
  const box = await page.locator("canvas").first().boundingBox();
  if (!box) return;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(800);
}

async function main() {
  const out = `${SHOTS}/handmade`;
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const errors: string[] = [];
  const arg = process.argv[2];
  const missing = arg === "--missing";
  const only = missing ? undefined : arg;
  for (const shot of SHOTS_LIST) {
    if (only && !shot.id.includes(only)) continue;
    const suffix = shot.body === "female" ? "-female" : "";
    if (missing && existsSync(`${out}/${shot.id}${suffix}-side.png`)) continue;
    const page = await openPage(browser, errors, {
      viewport: { width: 1280, height: 860 },
    });
    const body = shot.body ?? "male";
    await page.addInitScript((sex) => {
      localStorage.setItem(
        "anatomy.settings",
        JSON.stringify({ state: { locale: "en", bodySex: sex }, version: 1 }),
      );
    }, body);
    await page.goto(`${BASE_URL}/explore?structure=${shot.id}`);
    await waitForModel(page);
    await setSystems(page, shot.hide);
    // The panel's Focus button (the "f" key is lost when no switch was clicked).
    await page.getByRole("button", { name: "Focus", exact: true }).click();
    await page.waitForTimeout(2500);
    const name = `${out}/${shot.id}${suffix}`;
    await page.screenshot({ path: `${name}-front.png` });
    await drag(page, shot.turn ?? 260, shot.tilt ?? 0);
    await page.screenshot({ path: `${name}-side.png` });
    console.log(`✓ ${shot.id} (${body})`);
    await page.close();
  }
  await browser.close();
  if (errors.length) console.log(`page errors:\n${errors.join("\n")}`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
