"use client";

import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { VIEWER_OBSTRUCTION_ATTRIBUTE } from "@/lib/anatomy/viewerDom";
import { useViewerStore } from "@/store/viewerStore";
import { StructureActions } from "./structure/StructureActions";
import { StructureDetails } from "./structure/StructureDetails";
import { StructureHeader } from "./structure/StructureHeader";

/**
 * Information about the selected structure: a side card on tablet/desktop,
 * a bottom sheet on phones. Marked as a viewer obstruction so camera focus
 * frames structures in the uncovered area.
 */
export function StructureInfoPanel() {
  const { registry } = useAnatomyData();
  const selectedId = useViewerStore((s) => s.selectedStructureId);
  const structure = selectedId ? registry.get(selectedId) : undefined;
  if (!structure) return null;

  return (
    <aside
      {...{ [VIEWER_OBSTRUCTION_ATTRIBUTE]: "" }}
      aria-label={structure.names.en.text}
      className="panel absolute inset-x-2 bottom-2 z-20 flex max-h-[48dvh] flex-col md:inset-x-auto md:end-4 md:top-20 md:bottom-auto md:max-h-[calc(100dvh-7rem)] md:w-[360px]"
    >
      <StructureHeader
        structure={structure}
        onClose={() => useViewerStore.getState().select(null)}
      />
      <StructureActions structureId={structure.id} />
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <StructureDetails structure={structure} />
      </div>
    </aside>
  );
}
