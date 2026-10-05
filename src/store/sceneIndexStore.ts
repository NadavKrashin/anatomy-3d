import type { Object3D } from "three";
import { create } from "zustand";
import type { SceneIndex } from "@/lib/anatomy/three/sceneIndex";

/** One loaded model file (a "pack": skeleton, muscles, …) and its index. */
export interface LoadedModel {
  root: Object3D;
  index: SceneIndex;
}

/**
 * Runtime link between structure ids and the three.js objects of the loaded
 * model files. Each AnatomyModel registers its file when indexed; the merged
 * lookup grows as files stream in. Kept out of the viewer store because it
 * holds mutable scene objects, not app state.
 */
interface SceneIndexState {
  models: ReadonlyMap<string, LoadedModel>;
  /** Number of model files the dataset has. */
  expected: number;
  /** Structure id → objects, across every loaded file; null before the first. */
  objectsByStructure: ReadonlyMap<string, readonly Object3D[]> | null;
  /** True once every model file is loaded and indexed. */
  complete: boolean;
  setExpected: (count: number) => void;
  addModel: (id: string, model: LoadedModel) => void;
  removeModel: (id: string) => void;
}

function merge(
  models: ReadonlyMap<string, LoadedModel>,
): Map<string, Object3D[]> | null {
  if (models.size === 0) return null;
  const merged = new Map<string, Object3D[]>();
  for (const { index } of models.values()) {
    for (const [id, meshes] of index.meshesByStructure) {
      merged.set(id, [...(merged.get(id) ?? []), ...meshes]);
    }
  }
  return merged;
}

const derive = (
  models: ReadonlyMap<string, LoadedModel>,
  expected: number,
) => ({
  models,
  objectsByStructure: merge(models),
  complete: expected > 0 && models.size >= expected,
});

export const useSceneIndexStore = create<SceneIndexState>()((set, get) => ({
  models: new Map(),
  expected: 0,
  objectsByStructure: null,
  complete: false,
  setExpected: (expected) =>
    set({ expected, complete: expected > 0 && get().models.size >= expected }),
  addModel: (id, model) =>
    set(derive(new Map(get().models).set(id, model), get().expected)),
  removeModel: (id) => {
    const models = new Map(get().models);
    models.delete(id);
    set(derive(models, get().expected));
  },
}));
