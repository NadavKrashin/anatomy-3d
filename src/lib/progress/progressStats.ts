import type { ProgressData, StructureProgress } from "@/types/progress";
import { MASTERED_CONFIDENCE } from "./reviewScheduler";

export interface ProgressOverview {
  totalStructures: number;
  studied: number;
  mastered: number;
  /** 0–100: mean confidence over all structures (unseen count as 0). */
  masteryPercent: number;
  /** 0–100 over every answer ever given; null before the first quiz. */
  accuracyPercent: number | null;
}

/** Stats over the structures of the current dataset (others are ignored). */
export function progressOverview(
  data: ProgressData,
  structureIds: readonly string[],
): ProgressOverview {
  const entries = structureIds
    .map((id) => data.structures[id])
    .filter((p): p is StructureProgress => p !== undefined);
  const correct = entries.reduce((sum, p) => sum + p.correctCount, 0);
  const answered = entries.reduce(
    (sum, p) => sum + p.correctCount + p.incorrectCount,
    0,
  );
  const confidenceSum = entries.reduce((sum, p) => sum + p.confidence, 0);

  return {
    totalStructures: structureIds.length,
    studied: entries.filter((p) => p.timesSeen > 0).length,
    mastered: entries.filter((p) => p.confidence >= MASTERED_CONFIDENCE).length,
    masteryPercent:
      structureIds.length === 0
        ? 0
        : Math.round((confidenceSum / structureIds.length) * 100),
    accuracyPercent:
      answered === 0 ? null : Math.round((correct / answered) * 100),
  };
}

const seen = (data: ProgressData, structureIds: readonly string[]) =>
  structureIds
    .map((id) => data.structures[id])
    .filter((p): p is StructureProgress => (p?.timesSeen ?? 0) > 0);

/** Lowest-confidence studied structures first. */
export function weakestStructures(
  data: ProgressData,
  structureIds: readonly string[],
  limit = 5,
): StructureProgress[] {
  return seen(data, structureIds)
    .sort(
      (a, b) =>
        a.confidence - b.confidence || b.incorrectCount - a.incorrectCount,
    )
    .slice(0, limit);
}

export function recentlyStudied(
  data: ProgressData,
  structureIds: readonly string[],
  limit = 5,
): StructureProgress[] {
  return seen(data, structureIds)
    .sort((a, b) =>
      (b.lastReviewedAt ?? "").localeCompare(a.lastReviewedAt ?? ""),
    )
    .slice(0, limit);
}

/** Studied structures whose review time has come, most overdue first. */
export function dueForReview(
  data: ProgressData,
  structureIds: readonly string[],
  now: number,
): StructureProgress[] {
  const nowIso = new Date(now).toISOString();
  return seen(data, structureIds)
    .filter((p) => p.nextReviewAt !== undefined && p.nextReviewAt <= nowIso)
    .sort((a, b) => (a.nextReviewAt ?? "").localeCompare(b.nextReviewAt ?? ""));
}
