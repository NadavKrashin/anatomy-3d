import type { AnatomyDataset } from "@/types/anatomy";
import {
  buildZAnatomyDataset,
  Z_ANATOMY_ATTRIBUTION,
  type ManifestEntry,
} from "./build";
import { zAnatomyAttachments } from "./attachments";
import { withCourseName } from "./courseNames";
import manifest from "./manifest.json";

/**
 * Real anatomy from the Z-Anatomy atlas: the whole skeleton for context plus
 * the muscles, nerves and vessels of both upper limbs (incl. pectoral,
 * axillary and scapular regions). Rebuild with scripts/anatomy/z-anatomy/README.md.
 */
const raw = buildZAnatomyDataset(manifest as ManifestEntry[]);
// Names as her course writes them (docs/COURSE_SOURCE.md → "Course names").
const built = {
  ...raw,
  structures: raw.structures.map((s) => withCourseName(s)),
};
const ids = new Set(built.structures.map((s) => s.id));

export const zAnatomyDataset: AnatomyDataset = {
  info: {
    id: "z-anatomy",
    // Skeleton first: it frames the whole body while the rest streams in.
    models: ["skeleton", "muscles", "nerves", "vessels", "organs"].map(
      (pack) => ({ id: pack, url: `/models/z-anatomy/${pack}.glb` }),
    ),
    isDemo: false,
    attribution: Z_ANATOMY_ATTRIBUTION,
  },
  ...built,
  attachments: zAnatomyAttachments((id) => ids.has(id)),
};
