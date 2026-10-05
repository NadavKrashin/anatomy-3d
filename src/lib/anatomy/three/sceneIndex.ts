import type { Mesh, Object3D } from "three";
import type { AnatomicalStructure } from "@/types/anatomy";
import { getSourceName } from "../meshNames";
import type { AnatomyModelAdapter } from "../modelAdapter";

export interface SceneIndex {
  meshesByStructure: Map<string, Mesh[]>;
  structureByMesh: Map<Mesh, AnatomicalStructure>;
}

const isMesh = (object: Object3D): object is Mesh =>
  (object as Mesh).isMesh === true;

/**
 * Resolves each mesh to a structure. A mesh's own name is tried first, then
 * its ancestors' — GLTFLoader turns multi-primitive meshes into a Group of
 * child meshes, and some models name the parent node rather than the mesh.
 */
export function buildSceneIndex(
  root: Object3D,
  adapter: AnatomyModelAdapter,
): SceneIndex {
  const meshesByStructure = new Map<string, Mesh[]>();
  const structureByMesh = new Map<Mesh, AnatomicalStructure>();

  root.traverse((object) => {
    if (!isMesh(object)) return;
    let node: Object3D | null = object;
    while (node && node !== root.parent) {
      const structure = adapter.getStructureForMesh(getSourceName(node));
      if (structure) {
        object.userData.structureId = structure.id;
        structureByMesh.set(object, structure);
        const list = meshesByStructure.get(structure.id) ?? [];
        list.push(object);
        meshesByStructure.set(structure.id, list);
        return;
      }
      node = node.parent;
    }
  });

  return { meshesByStructure, structureByMesh };
}
