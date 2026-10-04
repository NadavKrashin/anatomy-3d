/**
 * End-to-end smoke test against a running production build:
 *
 *   npm run build && npx next start -p 3100   (in another terminal / background)
 *   npm run e2e:smoke                          (BASE_URL overrides the URL)
 *
 * Uses real WebGL through SwiftShader. Writes screenshots to docs/screenshots/.
 */
import { chromium } from "playwright";
import { exploreFlow } from "./explore.flow";
import { assert } from "./helpers";
import { quizFlow } from "./quiz.flow";

async function main() {
  const browser = await chromium.launch({
    args: [
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });
  const errors: string[] = [];
  try {
    await exploreFlow(browser, errors);
    await quizFlow(browser, errors);
  } finally {
    await browser.close();
  }
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
