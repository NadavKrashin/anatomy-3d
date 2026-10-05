import { Mesh } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import type { SceneIndex } from "@/lib/anatomy/three/sceneIndex";
import { useSceneIndexStore } from "./sceneIndexStore";

const initial = useSceneIndexStore.getState();

const indexOf = (entries: [string, Mesh[]][]): SceneIndex => ({
  meshesByStructure: new Map(entries),
  structureByMesh: new Map(),
  partByMesh: new Map(),
});

describe("scene index store", () => {
  beforeEach(() => useSceneIndexStore.setState(initial, true));

  it("merges model files as they load and completes when all are in", () => {
    const store = useSceneIndexStore.getState();
    store.setExpected(2);
    const a = new Mesh();
    const b = new Mesh();
    store.addModel("skeleton", { root: a, index: indexOf([["humerus", [a]]]) });
    let state = useSceneIndexStore.getState();
    expect(state.complete).toBe(false);
    expect(state.objectsByStructure?.get("humerus")).toEqual([a]);

    store.addModel("muscles", { root: b, index: indexOf([["biceps", [b]]]) });
    state = useSceneIndexStore.getState();
    expect(state.complete).toBe(true);
    expect([...(state.objectsByStructure?.keys() ?? [])]).toEqual([
      "humerus",
      "biceps",
    ]);

    store.removeModel("muscles");
    expect(useSceneIndexStore.getState().complete).toBe(false);
  });
});
