import type {
  AnatomicalStructure,
  AnatomyRegion,
  AnatomySystem,
  BodySide,
} from "@/types/anatomy";
import type { ConceptKey } from "../content/concepts";
import { withConcept } from "../content/withConcept";

/*
 * Demo dataset for the placeholder model (public/models/anatomy-demo.glb).
 * Names, Hebrew terms and medical details come from the shared curated
 * concepts (../content/concepts.ts); this file only says which demo
 * structures exist and where.
 */

interface DemoEntry {
  concept: ConceptKey;
  english: string;
  system: AnatomySystem;
  region: AnatomyRegion;
  sides: readonly BodySide[];
  tags: string[];
}

const BOTH = ["left", "right"] as const;
const LEFT = ["left"] as const;
const MIDLINE = ["midline"] as const;

const ENTRIES: DemoEntry[] = [
  {
    concept: "skull",
    english: "Skull",
    system: "skeletal",
    region: "head",
    sides: MIDLINE,
    tags: ["bone"],
  },
  {
    concept: "humerus",
    english: "Humerus",
    system: "skeletal",
    region: "upper-limb",
    sides: BOTH,
    tags: ["bone"],
  },
  {
    concept: "radius",
    english: "Radius",
    system: "skeletal",
    region: "upper-limb",
    sides: BOTH,
    tags: ["bone"],
  },
  {
    concept: "ulna",
    english: "Ulna",
    system: "skeletal",
    region: "upper-limb",
    sides: BOTH,
    tags: ["bone"],
  },
  {
    concept: "biceps-brachii",
    english: "Biceps brachii",
    system: "muscular",
    region: "upper-limb",
    sides: BOTH,
    tags: ["muscle"],
  },
  {
    concept: "femur",
    english: "Femur",
    system: "skeletal",
    region: "lower-limb",
    sides: BOTH,
    tags: ["bone"],
  },
  {
    concept: "median-nerve",
    english: "Median nerve",
    system: "nervous",
    region: "upper-limb",
    sides: LEFT,
    tags: ["nerve"],
  },
  {
    concept: "ulnar-nerve",
    english: "Ulnar nerve",
    system: "nervous",
    region: "upper-limb",
    sides: LEFT,
    tags: ["nerve"],
  },
  {
    concept: "radial-nerve",
    english: "Radial nerve",
    system: "nervous",
    region: "upper-limb",
    sides: LEFT,
    tags: ["nerve"],
  },
  {
    concept: "brachial-artery",
    english: "Brachial artery",
    system: "cardiovascular",
    region: "upper-limb",
    sides: LEFT,
    tags: ["artery"],
  },
  {
    concept: "heart",
    english: "Heart",
    system: "cardiovascular",
    region: "thorax",
    sides: MIDLINE,
    tags: ["organ"],
  },
  {
    concept: "lung",
    english: "Lung",
    system: "respiratory",
    region: "thorax",
    sides: BOTH,
    tags: ["organ"],
  },
  {
    concept: "liver",
    english: "Liver",
    system: "digestive",
    region: "abdomen",
    sides: MIDLINE,
    tags: ["organ"],
  },
];

function toStructures(entry: DemoEntry): AnatomicalStructure[] {
  return entry.sides.map((side) =>
    withConcept(
      {
        id: side === "midline" ? entry.concept : `${entry.concept}-${side}`,
        names: { en: { text: entry.english, verified: false } },
        aliases: {},
        system: entry.system,
        region: entry.region,
        side,
        ...(side === "midline" ? {} : { bilateralGroupId: entry.concept }),
        tags: entry.tags,
        modelSource: "demo-dataset",
        sourceLicense: "Project content (see README)",
      },
      entry.concept,
    ),
  );
}

export const demoStructures: AnatomicalStructure[] =
  ENTRIES.flatMap(toStructures);
