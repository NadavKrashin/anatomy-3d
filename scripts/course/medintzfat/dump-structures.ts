/**
 * Writes the model's structure ids (Z-Anatomy, the Open3DModel extras, the
 * female organs (both bodies) and,
 * when included, the non-commercial models) and their raw model names (before the
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
import open3dManifest from "../../../src/data/anatomy/z-anatomy/manifest-open3d.json";
import femaleManifest from "../../../src/data/anatomy/z-anatomy/manifest-female.json";
import nonCommercialManifest from "../../../src/data/anatomy/z-anatomy/manifest-non-commercial.json";
import { INCLUDE_NON_COMMERCIAL } from "../../../src/data/anatomy/z-anatomy/index";

const { structures } = buildZAnatomyDataset([
  ...(manifest as ManifestEntry[]),
  ...(open3dManifest as ManifestEntry[]),
  ...(femaleManifest as ManifestEntry[]),
  ...(INCLUDE_NON_COMMERCIAL ? (nonCommercialManifest as ManifestEntry[]) : []),
]);
const out = process.argv[2] ?? ".course-cache/structures.json";
mkdirSync(dirname(out), { recursive: true });
writeFileSync(
  out,
  JSON.stringify(
    structures.map((s) => ({
      id: s.id,
      en: s.names.en.text,
      la: s.names.la?.text ?? null,
      region: s.region,
      system: s.system,
    })),
  ),
);
console.log(`${structures.length} structures → ${out}`);
