import type { AnatomicalStructure, AnatomySystem } from "@/types/anatomy";

/**
 * Systems to hide while a question is about `target`, so it isn't buried.
 * Muscles are the big occluders: questions about nerves, vessels or bones
 * hide them; muscle questions keep everything (nerves and vessels are thin
 * and lie between muscles rather than covering them).
 */
export function systemsToHideFor(target: AnatomicalStructure): AnatomySystem[] {
  return target.system === "muscular" ? [] : ["muscular"];
}
