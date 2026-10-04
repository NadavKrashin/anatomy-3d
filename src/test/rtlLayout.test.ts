import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * The UI must mirror correctly between Hebrew (RTL) and English (LTR), so
 * layout uses logical Tailwind utilities (ms-/me-/ps-/pe-/start-/end-/
 * text-start/…) instead of physical left/right ones.
 *
 * Exception: `left-1/2 … -translate-x-1/2` centring is direction-neutral.
 */
const PHYSICAL_CLASS =
  /(?<![\w-])-?(?:ml|mr|pl|pr|left|right|rounded-[lr]|rounded-[tb][lr]|border-[lr]|text-left|text-right|float-left|float-right)(?:-[\w./[\]]+)?(?![\w-])/g;
const ALLOWED = new Set(["left-1/2"]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith(".tsx") ? [path] : [];
  });
}

function physicalClasses(classString: string): string[] {
  return (classString.match(PHYSICAL_CLASS) ?? []).filter(
    (match) => !ALLOWED.has(match),
  );
}

describe("RTL-safe styling", () => {
  it("detects physical direction utilities", () => {
    expect(
      physicalClasses(
        'className="ml-2 pr-4 text-left -right-1 border-l rounded-tr-lg"',
      ),
    ).toEqual([
      "ml-2",
      "pr-4",
      "text-left",
      "-right-1",
      "border-l",
      "rounded-tr-lg",
    ]);
    expect(
      physicalClasses(
        'className="ms-2 pe-4 text-start end-0 left-1/2 inset-x-0 border-line"',
      ),
    ).toEqual([]);
  });

  it("components use logical, not physical, direction utilities", () => {
    const root = join(process.cwd(), "src");
    const offenders: string[] = [];
    for (const file of sourceFiles(root)) {
      const classStrings =
        readFileSync(file, "utf8").match(/className=(?:"[^"]*"|\{[^}]*\})/g) ??
        [];
      for (const classString of classStrings) {
        for (const match of physicalClasses(classString))
          offenders.push(`${relative(root, file)}: ${match}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
