import type { Object3D } from "three";
import { create } from "zustand";

/**
 * Runtime link between structure ids and the three.js objects of the loaded
 * model. Populated by AnatomyModel; read by the camera controller. Kept out
 * of the viewer store because it holds mutable scene objects, not app state.
 */
interface SceneIndexState {
  objectsByStructure: ReadonlyMap<string, readonly Object3D[]> | null;
  setIndex: (index: ReadonlyMap<string, readonly Object3D[]> | null) => void;
}

export const useSceneIndexStore = create<SceneIndexState>()((set) => ({
  objectsByStructure: null,
  setIndex: (objectsByStructure) => set({ objectsByStructure }),
}));
