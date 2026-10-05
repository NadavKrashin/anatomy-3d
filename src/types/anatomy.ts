export const ANATOMY_SYSTEMS = [
  "skeletal",
  "muscular",
  "nervous",
  "cardiovascular",
  "respiratory",
  "digestive",
  "urinary",
  "reproductive",
  "lymphatic",
  "endocrine",
  "integumentary",
  "other",
] as const;
export type AnatomySystem = (typeof ANATOMY_SYSTEMS)[number];

export const ANATOMY_REGIONS = [
  "head",
  "neck",
  "thorax",
  "abdomen",
  "pelvis",
  "back",
  "upper-limb",
  "lower-limb",
  "whole-body",
  "other",
] as const;
export type AnatomyRegion = (typeof ANATOMY_REGIONS)[number];

export type BodySide = "left" | "right" | "midline";

/** Languages an anatomical term can be expressed in. */
export const TERM_LANGUAGES = ["en", "la", "he"] as const;
export type TermLanguage = (typeof TERM_LANGUAGES)[number];

/**
 * A single anatomical name. `verified` means a human checked it against an
 * authoritative source (course material, Terminologia Anatomica, the Academy
 * of the Hebrew Language). Unverified terms are shown with a marker.
 */
export interface Term {
  text: string;
  verified: boolean;
  source?: string;
}

/** English is required because it is the lingua franca of the datasets. */
export type StructureNames = { en: Term } & Partial<
  Record<Exclude<TermLanguage, "en">, Term>
>;

/**
 * Educational prose. English is required; Hebrew is filled in as it gets
 * written/verified. The UI falls back to English.
 */
export type LocalizedText = { en: string } & Partial<
  Record<Exclude<TermLanguage, "en">, string>
>;

/**
 * Optional per-structure medical details. Each list item is one bullet.
 * Fields are absent when unknown — never filled with guesses.
 */
export interface StructureDetails {
  description?: LocalizedText;
  clinicalNote?: LocalizedText;
  function?: LocalizedText[];
  origin?: LocalizedText[];
  insertion?: LocalizedText[];
  innervation?: LocalizedText[];
  bloodSupply?: LocalizedText[];
  articulations?: LocalizedText[];
}

export const DETAIL_SECTIONS = [
  "function",
  "origin",
  "insertion",
  "innervation",
  "bloodSupply",
  "articulations",
] as const satisfies readonly (keyof StructureDetails)[];
export type DetailSection = (typeof DETAIL_SECTIONS)[number];

/**
 * Tag for fine-grained structures (small branches, digital vessels,
 * inconstant structures). Searchable and explorable, but left out of
 * built-in quiz scopes so quizzes focus on core exam material.
 */
export const DETAIL_TAG = "detail";

export interface AnatomicalStructure {
  /** Stable, model-independent id, e.g. "biceps-brachii-left". */
  id: string;
  /** Names of the structure without the side ("Biceps brachii"). */
  names: StructureNames;
  aliases: Partial<Record<TermLanguage, string[]>>;
  system: AnatomySystem;
  region: AnatomyRegion;
  side?: BodySide;
  /**
   * Shared by the left/right instances of a paired structure, so a quiz can
   * accept either side when the side is not what is being tested.
   */
  bilateralGroupId?: string;
  /**
   * Set on a part of a larger structure (a head of a muscle). Parts are
   * selectable and searchable, but scopes, counts and quizzes work on whole
   * structures (`AnatomyRegistry.structures` lists only those).
   */
  parentId?: string;
  details?: StructureDetails;
  /** Study notes from her own course summary, in its language (Hebrew). */
  studyNotes?: StudyNote[];
  tags: string[];
  modelSource?: string;
  sourceLicense?: string;
  sourceAttribution?: string;
}

/**
 * A note from her course summary (her own words). `term` is the entry it
 * comes from; `shared` marks an entry about several structures ("Superficial
 * & Deep inguinal ring"); `section` is where it sits in the summary.
 */
export interface StudyNote {
  text: string;
  language: TermLanguage;
  term: string;
  section: string;
  shared?: boolean;
}

/**
 * Where a muscle attaches, as a surface patch on a bone. "attachment" means
 * the source doesn't reliably say whether it is the origin or the insertion.
 */
export const ATTACHMENT_KINDS = ["origin", "insertion", "attachment"] as const;
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];

export interface MuscleAttachment {
  /** Node name in the attachments model. */
  meshName: string;
  /** The muscle or muscle part that attaches here. */
  structureId: string;
  kind: AttachmentKind;
  /** The bone (or cartilage) the patch lies on, when known. */
  boneId?: string;
}

export interface AttachmentData {
  /** Model with one patch mesh per attachment, loaded on demand. */
  modelUrl: string;
  items: MuscleAttachment[];
}

/** Maps raw mesh/node names in a model file to structure ids. */
export type MeshMap = Record<string, string>;

/** One model file of a dataset. The first is loaded first and frames the camera. */
export interface AnatomyModelFile {
  id: string;
  url: string;
}

export interface AnatomyDatasetInfo {
  id: string;
  models: AnatomyModelFile[];
  isDemo: boolean;
  attribution?: string;
}

export interface AnatomyDataset {
  info: AnatomyDatasetInfo;
  structures: AnatomicalStructure[];
  /** Mesh → whole structure. Every mesh of a part maps to its parent here. */
  meshMap: MeshMap;
  /** Mesh → part structure, for meshes that are a part of a whole (optional). */
  partMeshMap?: MeshMap;
  /** Origins/insertions as patches on bones (optional). */
  attachments?: AttachmentData;
}
