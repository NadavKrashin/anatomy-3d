"use client";

import { Layers2, Undo2 } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { useMessages } from "@/hooks/useMessages";
import { useViewerStore } from "@/store/viewerStore";

/**
 * Peel mode toggle (taps then peel the tapped structure away, one at a
 * time) and restore (undo the last peel). Not offered while isolating —
 * everything else is ghosted then.
 */
export function LayerControls({
  showLabel = "wide",
}: {
  showLabel?: boolean | "wide";
}) {
  const t = useMessages();
  const peeled = useViewerStore((s) => s.peeledLayers.length);
  const peelMode = useViewerStore((s) => s.peelMode);
  const isolating = useViewerStore((s) => s.isolatedStructureId !== null);
  const { setPeelMode, restoreLayer } = useViewerStore.getState();
  if (isolating) return null;

  return (
    <>
      <IconButton
        showLabel={showLabel}
        label={t.viewer.peelMode}
        icon={<Layers2 />}
        active={peelMode}
        onClick={() => setPeelMode(!peelMode)}
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

/** While peel mode is on, a short instruction at the top of the viewer. */
export function PeelModeHint() {
  const t = useMessages();
  const peelMode = useViewerStore((s) => s.peelMode);
  if (!peelMode) return null;
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-[112px] z-10 flex justify-center"
      role="status"
    >
      <p className="bg-scrub rounded-full px-3 py-1 text-[13px] text-white shadow-[var(--shadow-float)]">
        {t.viewer.peelHint}
      </p>
    </div>
  );
}
