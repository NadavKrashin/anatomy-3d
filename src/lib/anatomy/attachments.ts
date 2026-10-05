import type { AttachmentKind, MuscleAttachment } from "@/types/anatomy";
import type { AnatomyRegistry } from "./registry";

/**
 * Attachments to show for a selected structure:
 * - a muscle: its own patches and its parts' (e.g. biceps → both heads'
 *   origins + the common insertion);
 * - a muscle part: its own patches and the whole muscle's;
 * - a bone: every patch lying on it.
 */
export function attachmentsFor(
  structureId: string,
  registry: AnatomyRegistry,
  items: readonly MuscleAttachment[],
): MuscleAttachment[] {
  const structure = registry.get(structureId);
  if (!structure) return [];
  if (structure.system === "skeletal") {
    return items.filter((item) => item.boneId === structureId);
  }
  const related = new Set([
    structureId,
    ...(structure.parentId ? [structure.parentId] : []),
    ...registry.partsOf(structureId).map((p) => p.id),
  ]);
  return items.filter((item) => related.has(item.structureId));
}

export interface AttachmentSummaryRow {
  kind: AttachmentKind;
  /** Structures to name in this row: bones for a muscle, muscles for a bone. */
  structureIds: string[];
}

/**
 * Rows for the info panel, in origin → insertion → unclassified order, each
 * naming the bones (for a muscle) or the muscles (for a bone) once.
 */
export function summarizeAttachments(
  items: readonly MuscleAttachment[],
  perspective: "muscle" | "bone",
): AttachmentSummaryRow[] {
  const order: AttachmentKind[] = ["origin", "insertion", "attachment"];
  return order.flatMap((kind) => {
    const ids = items
      .filter((item) => item.kind === kind)
      .map((item) =>
        perspective === "muscle" ? item.boneId : item.structureId,
      )
      .filter((id): id is string => id !== undefined);
    const unique = [...new Set(ids)];
    const hasPatches = items.some((item) => item.kind === kind);
    return hasPatches ? [{ kind, structureIds: unique }] : [];
  });
}
