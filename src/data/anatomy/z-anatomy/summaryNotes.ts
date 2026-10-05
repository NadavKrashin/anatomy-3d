import type { AnatomicalStructure, StructureNames } from "@/types/anatomy";
import summaryNotesJson from "./summaryNotes.json";

/**
 * Her own anatomy summary, matched to structures by
 * scripts/course/summary/summary_notes.py. Keyed like courseNames.json:
 * side-less id, or a sided id for a note on one side only.
 */
export interface SummaryEntry {
  notes: { text: string; section: string; term: string; shared?: boolean }[];
  /** Her Hebrew name from the summary's organ guide. */
  he?: string;
  /** The heading as she wrote it (with the article / plural). */
  heHeading?: string;
}

export const SUMMARY_NOTES: Readonly<Record<string, SummaryEntry>> =
  summaryNotesJson;

export const SUMMARY_SOURCE = "her course summary";

/**
 * Adds her study notes and, where her summary names it in Hebrew, her Hebrew
 * name. Her Hebrew wins over the course site's (she wrote it and learns
 * from it); the replaced name stays searchable.
 */
export function withSummaryNotes(
  structure: AnatomicalStructure,
  summary: Readonly<Record<string, SummaryEntry>> = SUMMARY_NOTES,
): AnatomicalStructure {
  const shared = summary[structure.bilateralGroupId ?? structure.id];
  const ownSide = structure.bilateralGroupId
    ? summary[structure.id]
    : undefined;
  if (!shared && !ownSide) return structure;

  const notes = [...(shared?.notes ?? []), ...(ownSide?.notes ?? [])].map(
    (note) => ({ ...note, language: "he" as const }),
  );
  const names: StructureNames = { ...structure.names };
  const aliases = { ...structure.aliases };
  if (shared?.he) {
    const replaced = structure.names.he?.text;
    names.he = { text: shared.he, verified: false, source: SUMMARY_SOURCE };
    const extra = [replaced, shared.heHeading].filter(
      (n): n is string => n !== undefined && n !== shared.he,
    );
    if (extra.length > 0)
      aliases.he = [...new Set([...(aliases.he ?? []), ...extra])];
  }
  return { ...structure, names, aliases, studyNotes: notes };
}
