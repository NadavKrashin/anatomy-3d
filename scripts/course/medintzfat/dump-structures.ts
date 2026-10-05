/**
 * Writes the Z-Anatomy structure ids and names to a JSON file, so the
 * course extractor (extract.py) can suggest structure ids for course terms.
 *
 *   npx tsx scripts/course/medintzfat/dump-structures.ts .course-cache/structures.json
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { zAnatomyDataset } from "../../../src/data/anatomy/z-anatomy";

const out = process.argv[2] ?? ".course-cache/structures.json";
mkdirSync(dirname(out), { recursive: true });
writeFileSync(
  out,
  JSON.stringify(
    zAnatomyDataset.structures.map((s) => ({
      id: s.id,
      en: s.names.en.text,
      la: s.names.la?.text ?? null,
    })),
  ),
);
console.log(`${zAnatomyDataset.structures.length} structures → ${out}`);
