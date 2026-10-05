import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { Mesh } from "three";
import { isPeelable, outerLayer } from "@/lib/anatomy/peel";
import { countFrontPixelsByStructure } from "@/lib/anatomy/three/structureIdPass";
import { useSceneIndexStore } from "@/store/sceneIndexStore";
import { useViewerStore } from "@/store/viewerStore";
import type { AnatomicalStructure } from "@/types/anatomy";

/**
 * Answers peel requests from the viewer store: finds the structures that are
 * outermost from the current camera across every loaded model file (one
 * off-screen ID render) and hands the peelable ones back as a layer. Must
 * run inside the R3F canvas.
 */
export function useLayerPeeling() {
  const getThree = useThree((s) => s.get);

  useEffect(
    () =>
      useViewerStore.subscribe((state, previous) => {
        if (state.peelRequest === previous.peelRequest) return;
        const models = [...useSceneIndexStore.getState().models.values()];
        if (models.length === 0) return;
        const wholeByMesh = new Map<Mesh, AnatomicalStructure>();
        const structures = new Map<string, AnatomicalStructure>();
        for (const { index } of models) {
          for (const [mesh, s] of index.structureByMesh) {
            wholeByMesh.set(mesh, s);
            structures.set(s.id, s);
          }
          for (const s of index.partByMesh.values()) structures.set(s.id, s);
        }

        const { gl, camera, invalidate } = getThree();
        const counts = countFrontPixelsByStructure(
          gl,
          models.map((m) => m.root),
          camera,
          (mesh) => wholeByMesh.get(mesh)?.id,
        );
        // A selected part keeps its whole muscle (peeling works on wholes).
        const selected = state.selectedStructureId;
        const keep = selected
          ? (structures.get(selected)?.parentId ?? selected)
          : null;
        state.applyPeel(
          outerLayer(counts, (id) => {
            const structure = structures.get(id);
            return (
              id !== keep && structure !== undefined && isPeelable(structure)
            );
          }),
        );
        invalidate();
      }),
    [getThree],
  );
}
