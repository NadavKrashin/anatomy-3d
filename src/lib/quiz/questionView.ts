import type { AnatomicalStructure, AnatomySystem } from "@/types/anatomy";

/** Organ systems that lie inside the body cavities, behind ribs and pelvis. */
const VISCERAL_SYSTEMS: ReadonlySet<AnatomySystem> = new Set([
  "respiratory",
  "digestive",
  "urinary",
  "reproductive",
  "endocrine",
  "lymphatic",
]);
/** Tissues encased in bone: brain/spinal cord, eye, heart. */
const ENCASED_TISSUES = ["brain", "sense", "heart"];

/**
 * Systems to hide while a question is about `target`, so it isn't buried.
 * Muscles are the big occluders: questions about nerves, vessels or bones
 * hide them; muscle questions keep everything (nerves and vessels are thin
 * and lie between muscles rather than covering them). Organs, the brain and
 * the heart also sit behind the skull, ribs or pelvis, so the skeleton goes
 * too.
 */
export function systemsToHideFor(target: AnatomicalStructure): AnatomySystem[] {
  if (target.system === "muscular") return [];
  const encased =
    VISCERAL_SYSTEMS.has(target.system) ||
    ENCASED_TISSUES.some((tissue) => target.tags.includes(tissue));
  return encased ? ["muscular", "skeletal"] : ["muscular"];
}
