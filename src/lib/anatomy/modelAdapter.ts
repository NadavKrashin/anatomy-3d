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
  /** The whole structure a mesh belongs to. */
  getStructureForMesh(meshName: string): AnatomicalStructure | undefined;
  /** The part a mesh belongs to, when it is one part of a whole. */
  getPartForMesh(meshName: string): AnatomicalStructure | undefined;
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
  partMeshMap: MeshMap = {},
): AnatomyModelAdapter {
  const meshesByStructure = new Map<string, string[]>();
  for (const map of [meshMap, partMeshMap]) {
    for (const [meshName, structureId] of Object.entries(map)) {
      const list = meshesByStructure.get(structureId) ?? [];
      list.push(meshName);
      meshesByStructure.set(structureId, list);
    }
  }

  const resolve = (map: MeshMap, meshName: string) => {
    const id = map[meshName] ?? map[stripDuplicateSuffix(meshName)];
    return id === undefined ? undefined : registry.get(id);
  };

  return {
    getStructures: () => registry.structures,
    getStructureForMesh: (meshName) => resolve(meshMap, meshName),
    getPartForMesh: (meshName) => resolve(partMeshMap, meshName),
    getMeshesForStructure: (structureId) => [
      ...(meshesByStructure.get(structureId) ?? []),
    ],
  };
}

export function findMeshMapIssues(
  registry: AnatomyRegistry,
  meshMap: MeshMap,
  partMeshMap: MeshMap = {},
): MeshMapIssues {
  const mappedIds = new Set(Object.values(meshMap));
  const partIds = new Set(Object.values(partMeshMap));
  return {
    unknownStructureIds: [...mappedIds, ...partIds].filter(
      (id) => !registry.has(id),
    ),
    unmappedStructureIds: registry.structures
      .map((s) => s.id)
      .filter((id) => !mappedIds.has(id)),
  };
}
