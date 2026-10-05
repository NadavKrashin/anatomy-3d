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
  /** Whole muscle this mesh is a part of (e.g. a head of biceps brachii). */
  group?: string;
}

export const Z_ANATOMY_SOURCE = "Z-Anatomy";
export const Z_ANATOMY_LICENSE = "CC BY-SA 4.0";
export const Z_ANATOMY_ATTRIBUTION =
  "Z-Anatomy — the open source atlas of anatomy (CC BY-SA 4.0), based on BodyParts3D © The Database Center for Life Science (CC BY-SA 2.1 JP).";

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

const DETAIL_PATTERN =
  /\bbranch(es)?\b|\bdigital\b|\bdivisions?\b|anastomosis|network|communicating/i;

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
 * Turns the export manifest into app structures + mesh map. Muscle parts
 * listed under a group become one whole-muscle structure with several meshes.
 */
export function buildZAnatomyDataset(manifest: readonly ManifestEntry[]): {
  structures: AnatomicalStructure[];
  meshMap: MeshMap;
} {
  const byId = new Map<string, AnatomicalStructure>();
  const meshMap: MeshMap = {};

  for (const entry of manifest) {
    const parsed = parseName(entry.name);
    const base = entry.group ?? parsed.base;
    const inconstant = !entry.group && parsed.inconstant;
    const id = toId(base, parsed.side);
    meshMap[entry.name] = id;
    if (byId.has(id)) continue;

    const detail = inconstant || DETAIL_PATTERN.test(base);
    const structure: AnatomicalStructure = {
      id,
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
      modelSource: Z_ANATOMY_SOURCE,
      sourceLicense: Z_ANATOMY_LICENSE,
      sourceAttribution: Z_ANATOMY_ATTRIBUTION,
    };
    const concept = CONCEPT_BY_NAME[base];
    byId.set(id, concept ? withConcept(structure, concept) : structure);
  }

  return { structures: [...byId.values()], meshMap };
}
