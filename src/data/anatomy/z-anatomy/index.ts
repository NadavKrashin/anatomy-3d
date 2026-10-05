import type { AnatomyDataset } from "@/types/anatomy";
import {
  buildZAnatomyDataset,
  Z_ANATOMY_ATTRIBUTION,
  type ManifestEntry,
} from "./build";
import { zAnatomyAttachments } from "./attachments";
import manifest from "./manifest.json";

/**
 * Real anatomy from the Z-Anatomy atlas: the whole skeleton for context plus
 * the muscles, nerves and vessels of both upper limbs (incl. pectoral,
 * axillary and scapular regions). Rebuild with scripts/anatomy/z-anatomy/README.md.
 */
const built = buildZAnatomyDataset(manifest as ManifestEntry[]);
const ids = new Set(built.structures.map((s) => s.id));

export const zAnatomyUpperLimbDataset: AnatomyDataset = {
  info: {
    id: "z-anatomy-upper-limb",
    modelUrl: "/models/z-anatomy-upper-limb.glb",
    isDemo: false,
    attribution: Z_ANATOMY_ATTRIBUTION,
  },
  ...built,
  attachments: zAnatomyAttachments((id) => ids.has(id)),
};
