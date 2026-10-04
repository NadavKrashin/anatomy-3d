"use client";

import { useGLTF } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import {
  MaterialStateController,
  type MeshVisualState,
} from "@/lib/anatomy/three/materialStates";
import { buildSceneIndex } from "@/lib/anatomy/three/sceneIndex";
import { getStructureVisibility } from "@/lib/anatomy/visibility";
import { useSceneIndexStore } from "@/store/sceneIndexStore";
import { useViewerStore } from "@/store/viewerStore";
import type { AnatomicalStructure } from "@/types/anatomy";

type ViewerSnapshot = ReturnType<typeof useViewerStore.getState>;

function visualStateFor(
  structure: AnatomicalStructure,
  state: ViewerSnapshot,
): MeshVisualState {
  const visibility = getStructureVisibility(
    structure.id,
    structure.system,
    state,
  );
  if (visibility !== "visible") return visibility;
  if (structure.id === state.selectedStructureId) return "selected";
  if (structure.id === state.hoveredStructureId) return "hovered";
  return "default";
}

const affectsVisuals = (a: ViewerSnapshot, b: ViewerSnapshot) =>
  a.selectedStructureId !== b.selectedStructureId ||
  a.hoveredStructureId !== b.hoveredStructureId ||
  a.hiddenStructureIds !== b.hiddenStructureIds ||
  a.hiddenSystems !== b.hiddenSystems ||
  a.isolatedStructureId !== b.isolatedStructureId;

/** First structure under the pointer that is currently visible and not ghosted. */
function pickStructureId(
  event: ThreeEvent<PointerEvent | MouseEvent>,
): string | null {
  for (const hit of event.intersections) {
    const { structureId, interactive } = hit.object.userData;
    if (
      typeof structureId === "string" &&
      interactive === true &&
      hit.object.visible
    )
      return structureId;
  }
  return null;
}

export function AnatomyModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const { adapter } = useAnatomyData();
  const invalidate = useThree((s) => s.invalidate);
  const getThree = useThree((s) => s.get);

  const index = useMemo(
    () => buildSceneIndex(scene, adapter),
    [scene, adapter],
  );

  useEffect(() => {
    useSceneIndexStore.getState().setIndex(index.meshesByStructure);
    return () => useSceneIndexStore.getState().setIndex(null);
  }, [index]);

  // Materials are driven imperatively from the store so selection changes
  // don't re-render React for every mesh in a large model.
  useEffect(() => {
    const controller = new MaterialStateController();
    const apply = (state: ViewerSnapshot) => {
      for (const [mesh, structure] of index.structureByMesh) {
        controller.apply(mesh, visualStateFor(structure, state));
      }
      getThree().gl.domElement.style.cursor = state.hoveredStructureId
        ? "pointer"
        : "";
      invalidate();
    };
    apply(useViewerStore.getState());
    const unsubscribe = useViewerStore.subscribe((state, previous) => {
      if (affectsVisuals(state, previous)) apply(state);
    });
    return () => {
      unsubscribe();
      controller.dispose();
    };
  }, [index, invalidate, getThree]);

  const setHovered = (id: string | null) => {
    if (useViewerStore.getState().hoveredStructureId !== id)
      useViewerStore.getState().hover(id);
  };

  return (
    <primitive
      object={scene}
      onPointerMove={(event: ThreeEvent<PointerEvent>) => {
        if (event.pointerType !== "mouse") return;
        event.stopPropagation();
        setHovered(pickStructureId(event));
      }}
      onPointerLeave={() => setHovered(null)}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        useViewerStore.getState().select(pickStructureId(event));
      }}
      onDoubleClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        const id = pickStructureId(event);
        if (!id) return;
        const { select, focus } = useViewerStore.getState();
        select(id);
        focus(id);
      }}
    />
  );
}
