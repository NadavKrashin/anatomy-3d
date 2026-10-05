import type { AnatomicalStructure, AnatomySystem } from "@/types/anatomy";
import { ANATOMY_SYSTEMS } from "@/types/anatomy";

export interface AnatomyRegistry {
  /** Whole structures only — what the legend, region views and filters work on. */
  readonly structures: readonly AnatomicalStructure[];
  /**
   * Wholes and parts (heads of a muscle, lobes of a lung…) — what can be
   * studied: quiz scopes, progress.
   */
  readonly all: readonly AnatomicalStructure[];
  /** Any structure, parts included. */
  get(id: string): AnatomicalStructure | undefined;
  /** Parts of a whole structure (e.g. the heads of a muscle), in dataset order. */
  partsOf(id: string): AnatomicalStructure[];
  /** The whole structure for a part; the structure itself otherwise. */
  wholeOf(id: string): AnatomicalStructure | undefined;
  has(id: string): boolean;
  bySystem(system: AnatomySystem): AnatomicalStructure[];
  /** Systems that have at least one structure, in canonical order. */
  presentSystems(): AnatomySystem[];
}

export function createRegistry(
  structures: readonly AnatomicalStructure[],
): AnatomyRegistry {
  const byId = new Map<string, AnatomicalStructure>();
  const parts = new Map<string, AnatomicalStructure[]>();
  for (const structure of structures) {
    if (byId.has(structure.id)) {
      throw new Error(`Duplicate anatomical structure id: "${structure.id}"`);
    }
    byId.set(structure.id, structure);
    if (structure.parentId) {
      const list = parts.get(structure.parentId) ?? [];
      list.push(structure);
      parts.set(structure.parentId, list);
    }
  }
  const wholes = structures.filter((s) => !s.parentId);

  return {
    structures: wholes,
    all: structures,
    get: (id) => byId.get(id),
    partsOf: (id) => [...(parts.get(id) ?? [])],
    wholeOf: (id) => {
      const structure = byId.get(id);
      return structure?.parentId ? byId.get(structure.parentId) : structure;
    },
    has: (id) => byId.has(id),
    bySystem: (system) => wholes.filter((s) => s.system === system),
    presentSystems: () =>
      ANATOMY_SYSTEMS.filter((system) =>
        wholes.some((s) => s.system === system),
      ),
  };
}
