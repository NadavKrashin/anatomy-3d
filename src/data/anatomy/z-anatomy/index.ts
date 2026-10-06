import type { AnatomyDataset } from "@/types/anatomy";
import {
  buildZAnatomyDataset,
  OPEN3DMODEL_ATTRIBUTION,
  Z_ANATOMY_ATTRIBUTION,
  type ManifestEntry,
} from "./build";
import { zAnatomyAttachments } from "./attachments";
import { withCourseName } from "./courseNames";
import { withSummaryNotes } from "./summaryNotes";
import manifest from "./manifest.json";
import open3dManifest from "./manifest-open3d.json";

/**
 * Real anatomy from the Z-Anatomy atlas: the whole skeleton for context plus
 * the muscles, nerves and vessels of both upper limbs (incl. pectoral,
 * axillary and scapular regions). Rebuild with scripts/anatomy/z-anatomy/README.md.
 */
// Z-Anatomy, plus what Open3DModel adds on the same body (nerves, vessels,
// a few muscles and ligaments: scripts/anatomy/open3dmodel/README.md).
const raw = buildZAnatomyDataset([
  ...(manifest as ManifestEntry[]),
  ...(open3dManifest as ManifestEntry[]),
]);
// Names as her course writes them, then her own summary's notes and Hebrew
// names (docs/COURSE_SOURCE.md → "Course names", "Her summary").
const built = {
  ...raw,
  structures: raw.structures.map((s) => withSummaryNotes(withCourseName(s))),
};
const ids = new Set(built.structures.map((s) => s.id));

export const zAnatomyDataset: AnatomyDataset = {
  info: {
    id: "z-anatomy",
    // Skeleton first: it frames the whole body while the rest streams in.
    models: [
      ...["skeleton", "muscles", "nerves", "vessels", "organs"].map((pack) => ({
        id: pack,
        url: `/models/z-anatomy/${pack}.glb`,
      })),
      { id: "extras", url: "/models/open3dmodel/extras.glb" },
    ],
    isDemo: false,
    attribution: `${Z_ANATOMY_ATTRIBUTION} ${OPEN3DMODEL_ATTRIBUTION}`,
  },
  ...built,
  attachments: zAnatomyAttachments((id) => ids.has(id)),
};
