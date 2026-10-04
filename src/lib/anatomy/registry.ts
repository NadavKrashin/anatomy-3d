import type { AnatomicalStructure, AnatomySystem } from "@/types/anatomy";
import { ANATOMY_SYSTEMS } from "@/types/anatomy";

export interface AnatomyRegistry {
  readonly structures: readonly AnatomicalStructure[];
  get(id: string): AnatomicalStructure | undefined;
  has(id: string): boolean;
  bySystem(system: AnatomySystem): AnatomicalStructure[];
  /** Systems that have at least one structure, in canonical order. */
  presentSystems(): AnatomySystem[];
}

export function createRegistry(
  structures: readonly AnatomicalStructure[],
): AnatomyRegistry {
  const byId = new Map<string, AnatomicalStructure>();
  for (const structure of structures) {
    if (byId.has(structure.id)) {
      throw new Error(`Duplicate anatomical structure id: "${structure.id}"`);
    }
    byId.set(structure.id, structure);
  }

  return {
    structures,
    get: (id) => byId.get(id),
    has: (id) => byId.has(id),
    bySystem: (system) => structures.filter((s) => s.system === system),
    presentSystems: () =>
      ANATOMY_SYSTEMS.filter((system) =>
        structures.some((s) => s.system === system),
      ),
  };
}
