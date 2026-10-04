"use client";

import { clsx } from "clsx";
import { Eye, Keyboard, Layers, ListTree, RotateCcw } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { useMessages } from "@/hooks/useMessages";
import { useViewerStore } from "@/store/viewerStore";

interface ViewerToolbarProps {
  systemsOpen: boolean;
  onToggleSystems: () => void;
  onShowShortcuts: () => void;
  className?: string;
}

export function ViewerToolbar({
  systemsOpen,
  onToggleSystems,
  onShowShortcuts,
  className,
}: ViewerToolbarProps) {
  const t = useMessages();
  const hiddenCount = useViewerStore(
    (s) => s.hiddenStructureIds.size + s.hiddenSystems.size,
  );
  const isolating = useViewerStore((s) => s.isolatedStructureId !== null);
  const { resetCamera, showAll, exitIsolate } = useViewerStore.getState();

  return (
    <div
      role="toolbar"
      aria-label={t.viewer.settings}
      className={clsx("panel flex items-center gap-1 p-1", className)}
    >
      <IconButton
        label={t.viewer.systems}
        icon={<ListTree />}
        active={systemsOpen}
        onClick={onToggleSystems}
        className="lg:hidden"
      />
      <IconButton
        label={t.viewer.resetCamera}
        icon={<RotateCcw />}
        onClick={resetCamera}
      />
      {isolating && (
        <IconButton
          showLabel
          active
          label={t.viewer.exitIsolate}
          icon={<Layers />}
          onClick={exitIsolate}
        />
      )}
      {hiddenCount > 0 && (
        <IconButton
          showLabel
          label={`${t.viewer.showAll} (${hiddenCount})`}
          icon={<Eye />}
          onClick={showAll}
        />
      )}
      <IconButton
        label={t.viewer.shortcuts}
        icon={<Keyboard />}
        onClick={onShowShortcuts}
        className="max-md:hidden"
      />
    </div>
  );
}
