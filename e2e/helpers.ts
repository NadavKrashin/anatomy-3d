import type { Browser, Page } from "playwright";

export const BASE_URL = process.env.BASE_URL ?? "http://localhost:3100";
export const SHOTS = "docs/screenshots";

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`✗ ${message}`);
  console.log(`✓ ${message}`);
}

/** Waits until the GLB is loaded (loading overlay gone) and the camera settled. */
export async function waitForModel(page: Page) {
  await page.waitForSelector("canvas", { timeout: 30_000 });
  await page.waitForFunction(
    () => !document.querySelector("[data-viewer-loading]"),
    null,
    { timeout: 120_000 },
  );
  await page.waitForTimeout(800);
}

/** Opens a page that records uncaught errors and console errors into `errors`. */
export async function openPage(
  browser: Browser,
  errors: string[],
  options: Parameters<Browser["newPage"]>[0] = {
    viewport: { width: 1440, height: 900 },
  },
) {
  // Reduced motion makes camera moves instant: the CI/sandbox GPU is a
  // software rasterizer, and animating the whole-body model frame by frame
  // there takes longer than a screenshot's timeout.
  const page = await browser.newPage({ reducedMotion: "reduce", ...options });
  page.setDefaultTimeout(60_000);
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return page;
}
