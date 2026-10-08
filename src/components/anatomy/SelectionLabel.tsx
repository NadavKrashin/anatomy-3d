"use client";

import { Html } from "@react-three/drei";
import { useMemo } from "react";
import { Box3, Vector3 } from "three";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { useStructureNames } from "@/hooks/useStructureNames";
import { useSceneIndexStore } from "@/store/sceneIndexStore";
import { useViewerStore } from "@/store/viewerStore";
import type { AnatomicalStructure } from "@/types/anatomy";
import { TermText } from "./TermText";

function Label({
  structure,
  anchor,
}: {
  structure: AnatomicalStructure;
  anchor: Vector3;
}) {
  const { primary } = useStructureNames(structure);
  return (
    // An atlas-plate leader: a dot on the structure, a hairline, the name.
    // The line runs toward the reading start, away from the info panel.
    <Html
      position={anchor}
      zIndexRange={[10, 0]}
      style={{ pointerEvents: "none" }}
    >
      <div className="relative size-0">
        {/* Logical insets: `end-*` places the line and name toward the reading
            start in both RTL and LTR. */}
        <span className="ring-scrub absolute start-0 top-0 size-[10px] -translate-y-1/2 rounded-full bg-white ring-2 ltr:-translate-x-1/2 rtl:translate-x-1/2" />
        <span className="bg-ink/60 absolute end-[6px] top-0 h-px w-14" />
        <span className="absolute end-[68px] top-0 -translate-y-1/2 whitespace-nowrap">
          <TermText
            name={primary}
            showVerification={false}
            className="text-ink bg-sheet/90 font-title rounded-md px-2 py-0.5 text-[15px] shadow-[0_1px_2px_rgb(24_34_45/0.12)]"
          />
        </span>
      </div>
    </Html>
  );
}

/**
 * Leader-line label for the selected structure, anchored at the centre of its
 * meshes' bounding box (the x-ray highlight keeps that point meaningful even
 * for buried structures).
 */
export function SelectionLabel() {
  const { registry } = useAnatomyData();
  const selectedId = useViewerStore((s) => s.selectedStructureId);
  const index = useSceneIndexStore((s) => s.objectsByStructure);

  const anchor = useMemo(() => {
    const objects = selectedId ? index?.get(selectedId) : undefined;
    if (!objects?.length) return null;
    const box = new Box3();
    for (const object of objects) box.expandByObject(object);
    return box.getCenter(new Vector3());
  }, [selectedId, index]);

  const structure = selectedId ? registry.get(selectedId) : undefined;
  return structure && anchor ? (
    <Label structure={structure} anchor={anchor} />
  ) : null;
}
