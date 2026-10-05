import type {
  AnatomicalStructure,
  StructureNames,
  Term,
} from "@/types/anatomy";
import { CONCEPTS, type ConceptKey } from "./concepts";

const unverified = (text: string): Term => ({ text, verified: false });

/**
 * Adds a concept's curated names, aliases and details to a structure.
 * Dataset-specific fields (English name as named by the model, aliases)
 * are kept; curated aliases are appended.
 */
export function withConcept(
  structure: AnatomicalStructure,
  key: ConceptKey,
): AnatomicalStructure {
  const concept: (typeof CONCEPTS)[ConceptKey] = CONCEPTS[key];
  const names: StructureNames = { ...structure.names };
  if ("names" in concept) {
    if (concept.names.la) names.la = unverified(concept.names.la);
    if (concept.names.he) names.he = unverified(concept.names.he);
  }
  const aliases = { ...structure.aliases };
  if ("aliases" in concept) {
    for (const [language, list] of Object.entries(concept.aliases) as [
      keyof typeof aliases,
      string[],
    ][]) {
      aliases[language] = [...(aliases[language] ?? []), ...list];
    }
  }
  return { ...structure, names, aliases, details: concept.details };
}
