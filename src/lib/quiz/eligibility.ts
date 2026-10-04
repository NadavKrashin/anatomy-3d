import type { AnatomyRegistry } from "@/lib/anatomy/registry";
import type { AnatomicalStructure } from "@/types/anatomy";
import type { StudyScope } from "@/types/study";

/**
 * Structures a quiz may ask about: in the scope, known to the registry, and
 * selectable in the currently loaded model (§20). `selectableIds` comes from
 * the model adapter / scene index, so a dataset with metadata for structures
 * the model lacks never produces impossible questions.
 */
export function eligibleStructures(
  scope: StudyScope,
  registry: AnatomyRegistry,
  selectableIds: ReadonlySet<string>,
): AnatomicalStructure[] {
  return scope.structureIds
    .filter((id) => selectableIds.has(id))
    .map((id) => registry.get(id))
    .filter((s): s is AnatomicalStructure => s !== undefined);
}
