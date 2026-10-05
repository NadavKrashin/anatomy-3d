"use client";

import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { useViewerStore } from "@/store/viewerStore";
import { StructureActions } from "./structure/StructureActions";
import { StructureAttachments } from "./structure/StructureAttachments";
import { StructureDetails } from "./structure/StructureDetails";
import { StructureHeader } from "./structure/StructureHeader";
import { StructureNotes } from "./structure/StructureNotes";
import { StructureRelations } from "./structure/StructureRelations";
import { ViewerPanel } from "./ViewerPanel";

/** Information about the selected structure. */
export function StructureInfoPanel() {
  const { registry } = useAnatomyData();
  const selectedId = useViewerStore((s) => s.selectedStructureId);
  const structure = selectedId ? registry.get(selectedId) : undefined;
  if (!structure) return null;

  return (
    <ViewerPanel label={structure.names.en.text}>
      <StructureHeader
        structure={structure}
        onClose={() => useViewerStore.getState().select(null)}
      />
      <StructureActions structureId={structure.id} />
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-4">
        <StructureNotes structure={structure} />
        <StructureRelations structure={structure} />
        <StructureAttachments structure={structure} />
        <StructureDetails structure={structure} />
      </div>
    </ViewerPanel>
  );
}
