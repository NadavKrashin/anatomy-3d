/**
 * Screenshots of every hand-built structure (scripts/anatomy/handmade/), for
 * review: each selected and focused, in front and side views, with the
 * systems that would hide it switched off; female ones in the female body.
 *
 *   npx tsx e2e/handmade-shots.ts            # against BASE_URL (default :3100)
 *   npx tsx e2e/handmade-shots.ts phrenic    # only ids containing "phrenic"
 *   npx tsx e2e/handmade-shots.ts --missing  # only shots not taken yet
 *
 * Writes docs/screenshots/handmade/<id>-front.jpg and -side.jpg (JPEG keeps
 * the 60 review shots small).
 */
import { existsSync, mkdirSync } from "node:fs";
import { chromium, type Page } from "playwright";
import { BASE_URL, openPage, SHOTS, waitForModel } from "./helpers";

type System =
  | "Skeletal"
  | "Muscular"
  | "Nervous"
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
  /** Horizontal drag (px) for the second view; or a vertical one (negative = up = a view from below). */
  turn?: number;
  tilt?: number;
  /** Isolate it (the rest ghosted): the thighs hide the perineum from below. */
  isolate?: boolean;
  /** Wheel steps to zoom in after focusing (millimetre-sized structures). */
  zoom?: number;
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
const ANAL: System[] = ["Muscular", "Urinary", "Reproductive", "Other"];

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
  {
    // Its own system (Lymphatic) stays on; the spinal cord would hide it from behind.
    id: "thoracic-duct",
    hide: [
      "Muscular",
      "Skeletal",
      "Respiratory",
      "Endocrine",
      "Other",
      "Digestive",
      "Nervous",
    ],
    turn: 520,
  },
  { id: "cisterna-chyli", hide: [...BELLY, "Digestive", "Urinary"], turn: 520 },
  { id: "cystic-artery", hide: BELLY },
  { id: "short-gastric-arteries", hide: BELLY, turn: -260 },
  { id: "perineal-body", hide: PERINEUM, tilt: -150, isolate: true },
  {
    id: "superficial-transverse-perineal-muscle-left",
    hide: PERINEUM,
    tilt: -150,
    isolate: true,
  },
  {
    id: "deep-transverse-perineal-muscle-left",
    hide: PERINEUM,
    tilt: -150,
    isolate: true,
  },
  {
    id: "external-urethral-sphincter",
    hide: ["Digestive", "Other"],
    tilt: -150,
    isolate: true,
  },
  { id: "bulbospongiosus-muscle", hide: PERINEUM, tilt: -150, isolate: true },
  {
    id: "ischiocavernosus-muscle-left",
    hide: PERINEUM,
    tilt: -150,
    isolate: true,
  },
  // Muscles hidden: the gluteal muscles would hide the rectum it continues.
  { id: "anal-canal", hide: ANAL, turn: 260 },
  { id: "internal-anal-sphincter", hide: ANAL, turn: 260 },
  // Priority 2
  { id: "pericardiacophrenic-artery-left", hide: CHEST },
  {
    id: "subcostal-nerve-left",
    hide: ["Skeletal", "Digestive", "Urinary", "Other"],
    turn: 520,
  },
  { id: "greater-pancreatic-artery", hide: [...BELLY, "Digestive"], turn: 520 },
  { id: "lingual-artery-left", hide: DEEP_NECK, turn: 260 },
  {
    id: "posterior-auricular-artery-left",
    hide: ["Lymphatic", "Other"],
    turn: 260,
  },
  { id: "suboccipital-nerve-left", hide: ["Lymphatic", "Other"], turn: 520 },
  {
    id: "infra-orbital-nerve-left",
    hide: ["Muscular", "Lymphatic", "Other"],
    turn: 260,
  },
  {
    id: "nerve-to-vastus-medialis-left",
    hide: ["Lymphatic", "Other"],
    turn: 260,
  },
  { id: "bulbourethral-gland-left", hide: PERINEUM, tilt: -150, isolate: true },
  { id: "cremaster-muscle-left", hide: ["Lymphatic", "Other"], turn: 260 },
  // Priority 3: the middle ear's muscles are millimetres long inside the
  // temporal bone — isolated (everything else ghosted).
  {
    id: "tensor-tympani-muscle-left",
    hide: [],
    turn: 260,
    isolate: true,
    zoom: 4,
  },
  { id: "stapedius-muscle-left", hide: [], turn: 260, isolate: true, zoom: 4 },
  {
    // On the inside of the back wall: the chest's contents hidden.
    id: "subcostal-muscles-left",
    hide: [
      "Respiratory",
      "Cardiovascular",
      "Digestive",
      "Nervous",
      "Lymphatic",
      "Endocrine",
      "Urinary",
      "Other",
    ],
    turn: 260,
  },
  { id: "scrotum", hide: ["Lymphatic", "Other"], turn: 260 },
  { id: "septum-of-scrotum", hide: [], turn: 260, isolate: true },
  // Priority 4: the Human Reference Atlas kidney (from the front, the
  // organs in front of it hidden; turned, from behind).
  {
    id: "kidney-left",
    hide: ["Digestive", "Respiratory", "Lymphatic", "Endocrine", "Other"],
    turn: 520,
  },
  { id: "fibrous-capsule-of-kidney-left", hide: [], turn: 260, isolate: true },
  { id: "renal-cortex-left", hide: [], turn: 260, isolate: true },
  {
    id: "renal-pelvis-right",
    hide: ["Digestive", "Lymphatic", "Other"],
    turn: 260,
    isolate: true,
  },
  // Female body
  {
    id: "urethra",
    hide: ["Muscular", "Digestive", "Other"],
    turn: 260,
    body: "female",
  },
  ...[
    "clitoris",
    "bulb-of-vestibule-left",
    "greater-vestibular-gland-left",
    "labium-majus-left",
    "mons-pubis",
  ].map((id) => ({
    id,
    hide: PERINEUM,
    tilt: -150,
    isolate: true,
    body: "female" as const,
  })),
  {
    id: "perineal-body",
    hide: PERINEUM,
    tilt: -150,
    isolate: true,
    body: "female",
  },
  {
    id: "external-urethral-sphincter",
    hide: ["Digestive", "Other"],
    tilt: -150,
    isolate: true,
    body: "female",
  },
  {
    id: "bulbospongiosus-muscle",
    hide: PERINEUM,
    tilt: -150,
    isolate: true,
    body: "female",
  },
  {
    id: "ischiocavernosus-muscle-left",
    hide: PERINEUM,
    tilt: -150,
    isolate: true,
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

/**
 * Turn the camera by dragging. The drag ends over an overlay (panel, legend,
 * search bar, toolbar), never over the body: a drag released over a mesh
 * counts as a click there and selects it (R3F fires onClick after a drag).
 * Viewport 1280 × 860.
 */
async function drag(page: Page, dx: number, dy: number) {
  const [endX, endY] =
    dy < 0
      ? [560, 34]
      : dy > 0
        ? [640, 819]
        : dx > 0
          ? [1050, 140]
          : [110, 300];
  await page.mouse.move(endX - dx, endY - dy);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(800);
}

/** Wheel in over the label's leader dot (the structure stays in view). */
async function zoom(page: Page, steps = 0) {
  for (let i = 0; i < steps; i++) {
    await page.mouse.move(446, 430);
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(600);
  }
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
    if (missing && existsSync(`${out}/${shot.id}${suffix}-side.jpg`)) continue;
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
    if (shot.isolate) {
      await page.getByRole("button", { name: "Isolate", exact: true }).click();
      await page.waitForTimeout(1500);
    }
    const name = `${out}/${shot.id}${suffix}`;
    await zoom(page, shot.zoom);
    await page.screenshot({ path: `${name}-front.jpg`, quality: 85 });
    if (shot.zoom) {
      // Turning that close orbits it out of view: frame it again first.
      await page.getByRole("button", { name: "Focus", exact: true }).click();
      await page.waitForTimeout(2500);
    }
    await drag(page, shot.turn ?? (shot.tilt ? 0 : 260), shot.tilt ?? 0);
    await zoom(page, shot.zoom);
    await page.screenshot({ path: `${name}-side.jpg`, quality: 85 });
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
