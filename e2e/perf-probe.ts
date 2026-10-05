/**
 * Rough performance probe against a running build: model load + index time,
 * and long tasks while hovering the densest area (raycast cost).
 *
 *   npx tsx e2e/perf-probe.ts            (server on :3100)
 */
import { chromium } from "playwright";
import { BASE_URL, waitForModel } from "./helpers";
async function main() {
  const b = await chromium.launch({
    args: [
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const t0 = Date.now();
  await p.goto(`${BASE_URL}/explore`);
  await waitForModel(p);
  console.log("load+index ms", Date.now() - t0 - 800);
  // Long tasks during pointer moves over the dense arm = raycast cost.
  await p.evaluate(() => {
    (window as unknown as { __lt: number[] }).__lt = [];
    new PerformanceObserver((l) =>
      l
        .getEntries()
        .forEach((e) =>
          (window as unknown as { __lt: number[] }).__lt.push(e.duration),
        ),
    ).observe({ type: "longtask" });
  });
  const t1 = Date.now();
  for (let i = 0; i < 40; i++) await p.mouse.move(600 + i * 2, 300 + i * 3);
  console.log("40 moves ms", Date.now() - t1);
  const lt = await p.evaluate(
    () => (window as unknown as { __lt: number[] }).__lt,
  );
  console.log("long tasks", lt.length, "max", Math.round(Math.max(0, ...lt)));
  await b.close();
}
void main();
