/**
 * Renders the app icon (home screen, browser tab) to PNG files:
 *
 *   npx tsx scripts/brand/render-icons.ts
 *
 * The mark is the app's own atlas label: a teal plate, a pin with a leader
 * line, and "אור" set on the line in Noto Serif Hebrew (loaded from Google
 * Fonts, so this needs network). Every file is full-bleed and keeps the mark
 * inside the maskable safe zone (the middle 80% circle), so iOS and Android
 * can round or crop it. docs/DESIGN.md → "App icon".
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const PLATE = "#0b7a75"; // --color-scrub
const INK = "#fbfcfc"; // --color-sheet

// 240-unit canvas; the group is scaled about the centre to sit in the safe zone.
const MARK = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="100%" height="100%">
  <rect width="240" height="240" fill="${PLATE}"/>
  <g transform="translate(120 120) scale(0.82) translate(-122 -135)">
    <polyline points="58,182 98,142 200,142" fill="none" stroke="${INK}"
      stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="58" cy="182" r="21" fill="${INK}" fill-opacity="0.33"/>
    <circle cx="58" cy="182" r="11.5" fill="${INK}"/>
    <text x="149" y="126" text-anchor="middle" direction="rtl"
      font-family="Noto Serif Hebrew" font-weight="600" font-size="86"
      fill="${INK}">אור</text>
  </g>
</svg>`;

const OUTPUTS = [
  { file: "src/app/icon.png", size: 512 },
  { file: "src/app/apple-icon.png", size: 180 },
  { file: "public/icons/icon-192.png", size: 192 },
  { file: "public/icons/icon-512.png", size: 512 },
] as const;

async function main() {
  const browser = await chromium.launch();
  try {
    for (const { file, size } of OUTPUTS) {
      const page = await browser.newPage({
        viewport: { width: size, height: size },
      });
      await page.setContent(
        `<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+Hebrew:wght@600&display=block"></head>
         <body style="margin:0">${MARK}</body></html>`,
      );
      await page.evaluate(() => document.fonts.ready);
      const ok = await page.evaluate(() =>
        document.fonts.check('600 86px "Noto Serif Hebrew"', "אור"),
      );
      if (!ok) throw new Error("Noto Serif Hebrew did not load");
      await mkdir(path.dirname(file), { recursive: true });
      await page.screenshot({ path: file, omitBackground: false });
      await page.close();
      console.log(`wrote ${file} (${size}px)`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
