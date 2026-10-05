"use client";

import { Layers2, Undo2 } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { useMessages } from "@/hooks/useMessages";
import { useViewerStore } from "@/store/viewerStore";

/**
 * Peel the outer layer as seen from the camera / restore the last peeled
 * layer. Not offered while isolating (everything else is ghosted then).
 */
export function LayerControls({
  showLabel = "wide",
}: {
  showLabel?: boolean | "wide";
}) {
  const t = useMessages();
  const peeled = useViewerStore((s) => s.peeledLayers.length);
  const isolating = useViewerStore((s) => s.isolatedStructureId !== null);
  const { requestPeel, restoreLayer } = useViewerStore.getState();
  if (isolating) return null;

  return (
    <>
      <IconButton
        showLabel={showLabel}
        label={t.viewer.peelLayer}
        icon={<Layers2 />}
        onClick={requestPeel}
      />
      {peeled > 0 && (
        <IconButton
          showLabel={showLabel}
          label={`${t.viewer.restoreLayer} (${peeled})`}
          icon={<Undo2 />}
          onClick={restoreLayer}
        />
      )}
    </>
  );
}
