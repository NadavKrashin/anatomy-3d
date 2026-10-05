import { useSceneIndexStore } from "@/store/sceneIndexStore";

/** True once the 3D model is loaded and its meshes are mapped to structures. */
export function useSceneReady(): boolean {
  return useSceneIndexStore((s) => s.objectsByStructure !== null);
}
