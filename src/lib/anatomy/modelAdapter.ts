import type { AnatomicalStructure, MeshMap } from "@/types/anatomy";
import { stripDuplicateSuffix } from "./meshNames";
import type { AnatomyRegistry } from "./registry";

/**
 * The only place that knows about raw model node names. Everything else in
 * the app talks in structure ids, so the model can be swapped without
 * touching the viewer, quiz or progress code.
 */
export interface AnatomyModelAdapter {
  getStructures(): readonly AnatomicalStructure[];
  getStructureForMesh(meshName: string): AnatomicalStructure | undefined;
  getMeshesForStructure(structureId: string): string[];
}

export interface MeshMapIssues {
  /** Mesh map entries that point at ids missing from the registry. */
  unknownStructureIds: string[];
  /** Registry structures that no mesh maps to (not selectable in this model). */
  unmappedStructureIds: string[];
}

export function createMeshMapAdapter(
  registry: AnatomyRegistry,
  meshMap: MeshMap,
): AnatomyModelAdapter {
  const meshesByStructure = new Map<string, string[]>();
  for (const [meshName, structureId] of Object.entries(meshMap)) {
    const list = meshesByStructure.get(structureId) ?? [];
    list.push(meshName);
    meshesByStructure.set(structureId, list);
  }

  const resolveId = (meshName: string): string | undefined =>
    meshMap[meshName] ?? meshMap[stripDuplicateSuffix(meshName)];

  return {
    getStructures: () => registry.structures,
    getStructureForMesh: (meshName) => {
      const id = resolveId(meshName);
      return id === undefined ? undefined : registry.get(id);
    },
    getMeshesForStructure: (structureId) => [
      ...(meshesByStructure.get(structureId) ?? []),
    ],
  };
}

export function findMeshMapIssues(
  registry: AnatomyRegistry,
  meshMap: MeshMap,
): MeshMapIssues {
  const mappedIds = new Set(Object.values(meshMap));
  return {
    unknownStructureIds: [...mappedIds].filter((id) => !registry.has(id)),
    unmappedStructureIds: registry.structures
      .map((s) => s.id)
      .filter((id) => !mappedIds.has(id)),
  };
}
