import type { Mesh, Object3D } from "three";
import type { AnatomicalStructure } from "@/types/anatomy";
import { getSourceName } from "../meshNames";
import type { AnatomyModelAdapter } from "../modelAdapter";

export interface SceneIndex {
  /** Meshes per structure id — whole structures and parts. */
  meshesByStructure: Map<string, Mesh[]>;
  /** The whole structure each mesh belongs to. */
  structureByMesh: Map<Mesh, AnatomicalStructure>;
  /** The part each mesh belongs to, for meshes that are part of a whole. */
  partByMesh: Map<Mesh, AnatomicalStructure>;
  /** Meshes no structure claims, e.g. the other body's (drawn hidden). */
  unmapped: Mesh[];
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
  const partByMesh = new Map<Mesh, AnatomicalStructure>();
  const unmapped: Mesh[] = [];
  const add = (id: string, mesh: Mesh) => {
    const list = meshesByStructure.get(id) ?? [];
    list.push(mesh);
    meshesByStructure.set(id, list);
  };

  root.traverse((object) => {
    if (!isMesh(object)) return;
    let node: Object3D | null = object;
    while (node && node !== root.parent) {
      const name = getSourceName(node);
      const structure = adapter.getStructureForMesh(name);
      if (structure) {
        object.userData.structureId = structure.id;
        structureByMesh.set(object, structure);
        add(structure.id, object);
        const part = adapter.getPartForMesh(name);
        if (part) {
          object.userData.partId = part.id;
          partByMesh.set(object, part);
          add(part.id, object);
        }
        return;
      }
      node = node.parent;
    }
    unmapped.push(object);
  });

  return { meshesByStructure, structureByMesh, partByMesh, unmapped };
}
