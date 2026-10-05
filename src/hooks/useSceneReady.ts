import { useSceneIndexStore } from "@/store/sceneIndexStore";

/** True once every model file is loaded and its meshes are mapped to structures. */
export function useSceneReady(): boolean {
  return useSceneIndexStore((s) => s.complete);
}

/**
 * True once the model file holding this structure is loaded — model files
 * stream in one by one, so a deep link needn't wait for all of them.
 */
export function useStructureLoaded(structureId: string | null): boolean {
  return useSceneIndexStore(
    (s) =>
      structureId !== null && (s.objectsByStructure?.has(structureId) ?? false),
  );
}
