/**
 * Writes the Z-Anatomy structure ids and their raw model names (before the
 * course names are applied) for extract.py and course_names.py.
 *
 *   npx tsx scripts/course/medintzfat/dump-structures.ts .course-cache/structures.json
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  buildZAnatomyDataset,
  type ManifestEntry,
} from "../../../src/data/anatomy/z-anatomy/build";
import manifest from "../../../src/data/anatomy/z-anatomy/manifest.json";

const { structures } = buildZAnatomyDataset(manifest as ManifestEntry[]);
const out = process.argv[2] ?? ".course-cache/structures.json";
mkdirSync(dirname(out), { recursive: true });
writeFileSync(
  out,
  JSON.stringify(
    structures.map((s) => ({
      id: s.id,
      en: s.names.en.text,
      la: s.names.la?.text ?? null,
    })),
  ),
);
console.log(`${structures.length} structures → ${out}`);
