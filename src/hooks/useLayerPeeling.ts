import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { Object3D } from "three";
import { isPeelable, outerLayer } from "@/lib/anatomy/peel";
import type { SceneIndex } from "@/lib/anatomy/three/sceneIndex";
import { countFrontPixelsByStructure } from "@/lib/anatomy/three/structureIdPass";
import { useViewerStore } from "@/store/viewerStore";

/**
 * Answers peel requests from the viewer store: finds the structures that are
 * outermost from the current camera (one off-screen ID render) and hands the
 * peelable ones back as a layer. Must run inside the R3F canvas.
 */
export function useLayerPeeling(root: Object3D, index: SceneIndex) {
  const getThree = useThree((s) => s.get);

  useEffect(
    () =>
      useViewerStore.subscribe((state, previous) => {
        if (state.peelRequest === previous.peelRequest) return;
        const { gl, camera, invalidate } = getThree();
        const counts = countFrontPixelsByStructure(
          gl,
          root,
          camera,
          (mesh) => index.structureByMesh.get(mesh)?.id,
        );
        const structures = new Map(
          [...index.structureByMesh.values()].map((s) => [s.id, s]),
        );
        state.applyPeel(
          outerLayer(counts, (id) => {
            const structure = structures.get(id);
            return structure !== undefined && isPeelable(structure);
          }),
        );
        invalidate();
      }),
    [root, index, getThree],
  );
}
