"use client";

import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { MeshStandardMaterial, type Mesh, type Object3D } from "three";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { attachmentsFor } from "@/lib/anatomy/attachments";
import { getSourceName } from "@/lib/anatomy/meshNames";
import { SELECTED_RENDER_ORDER } from "@/lib/anatomy/three/materialStates";
import { useViewerStore } from "@/store/viewerStore";
import {
  ATTACHMENT_KINDS,
  type AttachmentData,
  type AttachmentKind,
} from "@/types/anatomy";
import { ATTACHMENT_COLORS } from "./attachmentColors";

type ViewerSnapshot = ReturnType<typeof useViewerStore.getState>;

const isMesh = (object: Object3D): object is Mesh =>
  (object as Mesh).isMesh === true;

function createMaterials(): Record<AttachmentKind, MeshStandardMaterial> {
  const entries = ATTACHMENT_KINDS.map((kind) => {
    const material = new MeshStandardMaterial({
      color: ATTACHMENT_COLORS[kind],
      roughness: 0.6,
      // X-ray like the selection: attachment sites are almost always under
      // other muscles, so they're drawn through them, after the selected
      // muscle (which would otherwise tint them).
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.95,
    });
    return [kind, material] as const;
  });
  return Object.fromEntries(entries) as Record<
    AttachmentKind,
    MeshStandardMaterial
  >;
}

/** Patch meshes by source name, made unpickable and drawn after the selection. */
function preparePatches(scene: Object3D): Map<string, Mesh> {
  const byName = new Map<string, Mesh>();
  scene.traverse((object) => {
    if (!isMesh(object)) return;
    object.raycast = () => {}; // never intercept clicks meant for the model
    object.renderOrder = SELECTED_RENDER_ORDER + 1;
    object.visible = false;
    byName.set(getSourceName(object), object);
  });
  return byName;
}

function showPatches(
  meshes: ReadonlyMap<string, Mesh>,
  kindByMesh: ReadonlyMap<string, AttachmentKind>,
  materials: Record<AttachmentKind, MeshStandardMaterial>,
) {
  for (const [name, mesh] of meshes) {
    const kind = kindByMesh.get(name);
    mesh.visible = kind !== undefined;
    if (kind) mesh.material = materials[kind];
  }
}

function Patches({ data }: { data: AttachmentData }) {
  const { scene } = useGLTF(data.modelUrl);
  const { registry } = useAnatomyData();
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const meshes = preparePatches(scene);
    const materials = createMaterials();
    const apply = (state: ViewerSnapshot) => {
      const shown =
        state.showAttachments && state.selectedStructureId
          ? attachmentsFor(state.selectedStructureId, registry, data.items)
          : [];
      showPatches(
        meshes,
        new Map(shown.map((a) => [a.meshName, a.kind])),
        materials,
      );
      invalidate();
    };
    apply(useViewerStore.getState());
    const unsubscribe = useViewerStore.subscribe((state, previous) => {
      if (
        state.selectedStructureId !== previous.selectedStructureId ||
        state.showAttachments !== previous.showAttachments
      )
        apply(state);
    });
    return () => {
      unsubscribe();
      for (const material of Object.values(materials)) material.dispose();
    };
  }, [scene, registry, data, invalidate]);

  return <primitive object={scene} />;
}

/**
 * Origin/insertion patches of the selected muscle (or the muscles attached
 * to the selected bone). The patch model is only fetched once something
 * with attachments is selected, in its own Suspense so the main model never
 * blinks while it loads.
 */
export function AttachmentPatches() {
  const { dataset, registry } = useAnatomyData();
  const data = dataset.attachments;
  const wanted = useViewerStore(
    (s) =>
      data !== undefined &&
      s.showAttachments &&
      s.selectedStructureId !== null &&
      attachmentsFor(s.selectedStructureId, registry, data.items).length > 0,
  );
  if (!data || !wanted) return null;
  return (
    <Suspense fallback={null}>
      <Patches data={data} />
    </Suspense>
  );
}
