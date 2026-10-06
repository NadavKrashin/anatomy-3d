import type {
  AnatomicalStructure,
  AnatomyRegion,
  AnatomySystem,
  BodySide,
  MeshMap,
} from "@/types/anatomy";
import { DETAIL_TAG } from "@/types/anatomy";
import type { ConceptKey } from "../content/concepts";
import { withConcept } from "../content/withConcept";

/** One exported mesh, as written by scripts/anatomy/z-anatomy/export_glb.py. */
export interface ManifestEntry {
  name: string;
  system: "skeletal" | "muscular" | "nervous" | "cardiovascular";
  tissue:
    | "bone"
    | "cartilage"
    | "teeth"
    | "muscle"
    | "ligament"
    | "nerve"
    | "artery"
    | "vein";
  region: AnatomyRegion;
  vertices: number;
  /**
   * The whole this mesh is a part of: a muscle (a head of biceps brachii →
   * "Biceps brachii muscle") or an organ (a lobe → "Lung").
   */
  group?: string;
  /**
   * Side of the whole when it isn't the part's own side: organ wholes are
   * either one midline organ ("Heart", from midline or sided parts) or one per
   * side whose parts carry no side suffix ("Lung", right/left lobes).
   */
  groupSide?: BodySide;
  /** The model the mesh comes from when it isn't Z-Anatomy's own (MODEL_SOURCES). */
  source?: Exclude<ModelSourceId, "Z-Anatomy">;
}

export interface ModelSource {
  license: string;
  /** Credit line, shown in full on the home page. */
  attribution: string;
  /** Short name for the viewer's credit line. */
  credit: string;
  /**
   * False for non-commercial licences (NC): those models must go before the
   * app is used commercially (THIRD_PARTY_ASSETS.md → "Going commercial").
   */
  commercialUse: boolean;
}

/**
 * Every 3D model the dataset is built from, with its licence. A manifest
 * entry names its model in `source`; entries without one are Z-Anatomy's.
 */
export const MODEL_SOURCES = {
  "Z-Anatomy": {
    license: "CC BY-SA 4.0",
    attribution:
      "Z-Anatomy — the open source atlas of anatomy (CC BY-SA 4.0), based on BodyParts3D © The Database Center for Life Science (CC BY-SA 2.1 JP), including Cranial Nerves and Foramina © University of Dundee, CAHID (CC BY 4.0).",
    credit: "Z-Anatomy, BodyParts3D",
    commercialUse: true,
  },
  Open3DModel: {
    license: "CC BY-SA",
    attribution: "Open3DModel — AnatomyTOOL.org, CC BY-SA, built on Z-Anatomy.",
    credit: "Open3DModel",
    commercialUse: true,
  },
  "Dundee inner ear": {
    license: "CC BY-NC-SA 4.0",
    attribution:
      "Anatomy of the Inner Ear © University of Dundee School of Medicine (CC BY-NC-SA 4.0), via Z-Anatomy; non-commercial use only.",
    credit: "University of Dundee",
    commercialUse: false,
  },
  "lissiecowley kidney": {
    license: "CC BY-NC 4.0",
    attribution:
      "Kidney © lissiecowley (CC BY-NC 4.0), via Z-Anatomy; non-commercial use only.",
    credit: "lissiecowley",
    commercialUse: false,
  },
} as const satisfies Record<string, ModelSource>;

export type ModelSourceId = keyof typeof MODEL_SOURCES;

/** Z-Anatomy English base names that have hand-curated content. */
const CONCEPT_BY_NAME: Record<string, ConceptKey> = {
  Humerus: "humerus",
  Radius: "radius",
  Ulna: "ulna",
  Femur: "femur",
  Scapula: "scapula",
  Clavicle: "clavicle",
  "Biceps brachii muscle": "biceps-brachii",
  "Median nerve": "median-nerve",
  "Ulnar nerve": "ulnar-nerve",
  "Radial nerve": "radial-nerve",
  "Brachial artery": "brachial-artery",
};

/**
 * Fine-grained structures: explorable and searchable, but left out of the
 * built-in quiz scopes — small branches, brain/spinal nuclei, tracts and
 * fasciculi, sulci, and individual lymph-node groups.
 */
const DETAIL_PATTERN =
  /\bbranch(es)?\b|\bdigital\b|\bdivisions?\b|anastomosis|network|communicating|\bnucle(us|i)\b|\btracts?\b|fasciculus|\bsulc(us|i)\b|\bnodes?\b/i;

export interface ParsedName {
  base: string;
  side: BodySide;
  /** Z-Anatomy writes inconstant (variably present) structures in parentheses. */
  inconstant: boolean;
}

/**
 * "Humerus.l" → Humerus/left · "Left subclavian artery" → Subclavian artery/left ·
 * "(Ulnar recurrent artery).r" → Ulnar recurrent artery/right, inconstant.
 */
export function parseName(raw: string): ParsedName {
  let name = raw;
  let side: BodySide = "midline";
  const suffix = /\.(l|r)$/.exec(name);
  if (suffix) {
    side = suffix[1] === "l" ? "left" : "right";
    name = name.slice(0, -2);
  } else {
    const prefix = /^(Left|Right) (.+)$/.exec(name);
    if (prefix?.[1] && prefix[2]) {
      side = prefix[1] === "Left" ? "left" : "right";
      name = prefix[2].charAt(0).toUpperCase() + prefix[2].slice(1);
    }
  }
  const inconstant = /^\(.*\)$/.test(name);
  return { base: inconstant ? name.slice(1, -1) : name, side, inconstant };
}

export function toId(base: string, side: BodySide): string {
  const slug = base
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return side === "midline" ? slug : `${slug}-${side}`;
}

function systemFor(entry: ManifestEntry): AnatomySystem {
  // Ligaments ship with the muscular model but belong to neither system here.
  return entry.tissue === "ligament" ? "other" : entry.system;
}

/**
 * Turns the export manifest into app structures + mesh maps. Parts listed
 * under a group — heads of a muscle (biceps), pieces of an organ (heart
 * chambers, lung lobes, brain gyri) — become one whole structure with
 * several meshes, and each part also becomes a structure of its own
 * (`parentId` = the whole) mapped in `partMeshMap`.
 */
export function buildZAnatomyDataset(manifest: readonly ManifestEntry[]): {
  structures: AnatomicalStructure[];
  meshMap: MeshMap;
  partMeshMap: MeshMap;
} {
  const byId = new Map<string, AnatomicalStructure>();
  const meshMap: MeshMap = {};
  const partMeshMap: MeshMap = {};
  const wholeRegions = new Map<string, AnatomyRegion[]>();

  for (const entry of manifest) {
    const parsed = parseName(entry.name);
    const wholeSide = entry.groupSide ?? parsed.side;
    const id = toId(entry.group ?? parsed.base, wholeSide);
    meshMap[entry.name] = id;
    // A whole muscle spans its parts' regions (e.g. erector spinae: neck + back).
    if (entry.group)
      wholeRegions.set(id, [...(wholeRegions.get(id) ?? []), entry.region]);
    if (!byId.has(id)) {
      byId.set(
        id,
        structureFor(
          entry,
          entry.group ?? parsed.base,
          { ...parsed, side: wholeSide },
          !entry.group && parsed.inconstant,
        ),
      );
    }
    // A part named exactly like its whole is the whole itself, not a part.
    const partId = toId(parsed.base, parsed.side);
    if (entry.group && partId !== id) {
      partMeshMap[entry.name] = partId;
      if (!byId.has(partId)) {
        byId.set(partId, {
          ...structureFor(entry, parsed.base, parsed, parsed.inconstant),
          parentId: id,
        });
      }
    }
  }

  return {
    structures: [...byId.values()].map((s) =>
      wholeRegions.has(s.id)
        ? { ...s, region: majorityRegion(wholeRegions.get(s.id) ?? []) }
        : s,
    ),
    meshMap,
    partMeshMap,
  };
}

/** Most frequent region among a whole muscle's parts (first wins a tie). */
function majorityRegion(regions: readonly AnatomyRegion[]): AnatomyRegion {
  const counts = new Map<AnatomyRegion, number>();
  for (const region of regions)
    counts.set(region, (counts.get(region) ?? 0) + 1);
  let best: AnatomyRegion = regions[0] ?? "other";
  for (const [region, count] of counts)
    if (count > (counts.get(best) ?? 0)) best = region;
  return best;
}

function structureFor(
  entry: ManifestEntry,
  base: string,
  parsed: ParsedName,
  inconstant: boolean,
): AnatomicalStructure {
  const detail = inconstant || DETAIL_PATTERN.test(base);
  const structure: AnatomicalStructure = {
    id: toId(base, parsed.side),
    names: { en: { text: base, verified: false } },
    aliases: {},
    system: systemFor(entry),
    region: entry.region,
    side: parsed.side,
    ...(parsed.side === "midline"
      ? {}
      : { bilateralGroupId: toId(base, "midline") }),
    tags: [
      entry.tissue,
      ...(inconstant ? ["inconstant"] : []),
      ...(detail ? [DETAIL_TAG] : []),
    ],
    modelSource: entry.source ?? "Z-Anatomy",
    sourceLicense: MODEL_SOURCES[entry.source ?? "Z-Anatomy"].license,
    sourceAttribution: MODEL_SOURCES[entry.source ?? "Z-Anatomy"].attribution,
  };
  const concept = CONCEPT_BY_NAME[base];
  return concept ? withConcept(structure, concept) : structure;
}
