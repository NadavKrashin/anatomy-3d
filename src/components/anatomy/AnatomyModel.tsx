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
import { isTap } from "@/lib/anatomy/pointer";
import { getStructureVisibility } from "@/lib/anatomy/visibility";
import { useSceneIndexStore } from "@/store/sceneIndexStore";
import { useViewerStore } from "@/store/viewerStore";
import type { AnatomicalStructure } from "@/types/anatomy";

type ViewerSnapshot = ReturnType<typeof useViewerStore.getState>;

function visualStateFor(
  structure: AnatomicalStructure,
  part: AnatomicalStructure | undefined,
  state: ViewerSnapshot,
): MeshVisualState {
  const visibility = getStructureVisibility(
    structure.id,
    structure.system,
    state,
    part?.id,
  );
  if (visibility !== "visible") return visibility;
  const is = (id: string | null) =>
    id !== null && (id === structure.id || id === part?.id);
  if (is(state.selectedStructureId)) return "selected";
  if (is(state.hoveredStructureId)) return "hovered";
  return "default";
}

const affectsVisuals = (a: ViewerSnapshot, b: ViewerSnapshot) =>
  a.selectedStructureId !== b.selectedStructureId ||
  a.hoveredStructureId !== b.hoveredStructureId ||
  a.hiddenStructureIds !== b.hiddenStructureIds ||
  a.hiddenSystems !== b.hiddenSystems ||
  a.isolatedStructureId !== b.isolatedStructureId;

/**
 * First structure under the pointer that is currently visible and not
 * ghosted — the part (e.g. a head of a muscle) when picking parts.
 */
function pickStructureId(
  event: ThreeEvent<PointerEvent | MouseEvent>,
): string | null {
  const { pickParts } = useViewerStore.getState();
  for (const hit of event.intersections) {
    const { structureId, partId, interactive } = hit.object.userData;
    if (
      typeof structureId === "string" &&
      interactive === true &&
      hit.object.visible
    )
      return pickParts && typeof partId === "string" ? partId : structureId;
  }
  return null;
}

/** One model file (pack) of the dataset: indexed, registered, highlighted. */
export function AnatomyModel({ id, url }: { id: string; url: string }) {
  const { scene } = useGLTF(url);
  const { adapter } = useAnatomyData();
  const invalidate = useThree((s) => s.invalidate);
  const getThree = useThree((s) => s.get);

  const index = useMemo(
    () => buildSceneIndex(scene, adapter),
    [scene, adapter],
  );

  // Materials are driven imperatively from the store so selection changes
  // don't re-render React for every mesh in a large model.
  useEffect(() => {
    const controller = new MaterialStateController();
    const apply = (state: ViewerSnapshot) => {
      for (const [mesh, structure] of index.structureByMesh) {
        controller.apply(
          mesh,
          visualStateFor(structure, index.partByMesh.get(mesh), state),
        );
      }
      for (const mesh of index.unmapped) controller.apply(mesh, "hidden");
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

  // Registered after the material effect above has applied visibility, so
  // the camera's first framing (on the first registered file) sees the
  // current filters (e.g. a region deep link) rather than every mesh.
  useEffect(() => {
    useSceneIndexStore.getState().addModel(id, { root: scene, index });
    return () => useSceneIndexStore.getState().removeModel(id);
  }, [id, scene, index]);

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
        // A drag that turned the body ends with a click: don't select (or,
        // in peel mode, peel) whatever is under the pointer on release.
        if (!isTap(event.delta)) return;
        useViewerStore.getState().pick(pickStructureId(event));
      }}
      onDoubleClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        if (!isTap(event.delta)) return;
        const id = pickStructureId(event);
        if (!id) return;
        const { pick, focus, selectionLocked, peelMode } =
          useViewerStore.getState();
        if (selectionLocked || peelMode) return;
        pick(id);
        focus(id);
      }}
    />
  );
}
