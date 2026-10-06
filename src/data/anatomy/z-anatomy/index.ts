import type { AnatomyDataset } from "@/types/anatomy";
import {
  buildZAnatomyDataset,
  MODEL_SOURCES,
  type ManifestEntry,
  type ModelSourceId,
} from "./build";
import { zAnatomyAttachments } from "./attachments";
import { withCourseName } from "./courseNames";
import { withSummaryNotes } from "./summaryNotes";
import manifest from "./manifest.json";
import open3dManifest from "./manifest-open3d.json";
import nonCommercialManifest from "./manifest-non-commercial.json";
import femaleManifest from "./manifest-female.json";

/**
 * Whether the app includes models licensed for non-commercial use only
 * (Z-Anatomy's inner ear and kidney: MODEL_SOURCES, commercialUse false).
 * The app is a free study tool, so they are in (user decision 2026-10-06).
 * Before any commercial use, set this to false and follow
 * THIRD_PARTY_ASSETS.md → "Going commercial".
 */
export const INCLUDE_NON_COMMERCIAL = true;

/**
 * Real anatomy from the Z-Anatomy atlas (whole body, five model files;
 * scripts/anatomy/z-anatomy/README.md), plus what Open3DModel adds on the
 * same body (scripts/anatomy/open3dmodel/README.md), the female organs of
 * the Human Reference Atlas fitted into it (scripts/anatomy/hra/README.md;
 * shown in the female body only, `datasetForSex`) and, unless left out, the
 * non-commercial inner ear and kidney.
 */
export function createZAnatomyDataset({
  nonCommercial,
}: {
  nonCommercial: boolean;
}): AnatomyDataset {
  const entries = [
    ...(manifest as ManifestEntry[]),
    ...(open3dManifest as ManifestEntry[]),
    ...(femaleManifest as ManifestEntry[]),
    ...(nonCommercial ? (nonCommercialManifest as ManifestEntry[]) : []),
  ];
  const raw = buildZAnatomyDataset(entries);
  // Names as her course writes them, then her own summary's notes and Hebrew
  // names (docs/COURSE_SOURCE.md → "Course names", "Her summary").
  const built = {
    ...raw,
    structures: raw.structures.map((s) => withSummaryNotes(withCourseName(s))),
  };
  const ids = new Set(built.structures.map((s) => s.id));
  const sources = [
    ...new Set<ModelSourceId>(entries.map((e) => e.source ?? "Z-Anatomy")),
  ].map((id) => MODEL_SOURCES[id]);

  return {
    info: {
      id: "z-anatomy",
      // Skeleton first: it frames the whole body while the rest streams in.
      models: [
        ...["skeleton", "muscles", "nerves", "vessels", "organs"].map(
          (pack) => ({ id: pack, url: `/models/z-anatomy/${pack}.glb` }),
        ),
        { id: "extras", url: "/models/open3dmodel/extras.glb" },
        { id: "female", url: "/models/hra/female.glb", sex: "female" },
        ...(nonCommercial
          ? [
              {
                id: "non-commercial",
                url: "/models/non-commercial/non-commercial.glb",
              },
            ]
          : []),
      ],
      isDemo: false,
      attribution: sources.map((s) => s.attribution).join(" "),
      credits: sources.map((s) => s.credit).join(", "),
    },
    ...built,
    attachments: zAnatomyAttachments((id) => ids.has(id)),
  };
}

export const zAnatomyDataset: AnatomyDataset = createZAnatomyDataset({
  nonCommercial: INCLUDE_NON_COMMERCIAL,
});
