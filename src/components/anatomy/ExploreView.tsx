"use client";

import { clsx } from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { useRevealStructure } from "@/hooks/useRevealStructure";
import { useSceneReady } from "@/hooks/useSceneReady";
import { useShowScope } from "@/hooks/useShowScope";
import { useViewerShortcuts } from "@/hooks/useViewerShortcuts";
import { useViewerStore } from "@/store/viewerStore";
import { ANATOMY_REGIONS, type AnatomyRegion } from "@/types/anatomy";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { StructureInfoPanel } from "./StructureInfoPanel";
import { StructureSearch } from "./StructureSearch";
import { SystemVisibilityPanel } from "./SystemVisibilityPanel";
import { ViewerFrame } from "./ViewerFrame";
import { ViewerToolbar } from "./ViewerToolbar";

const isRegion = (value: string | null): value is AnatomyRegion =>
  value !== null && (ANATOMY_REGIONS as readonly string[]).includes(value);

/**
 * Deep links:
 *   /explore?region=upper-limb   only that region visible
 *   /explore?structure=<id>      select and focus a structure (e.g. from Progress)
 */
function useExploreDeepLinks() {
  const { registry } = useAnatomyData();
  const params = useSearchParams();
  const region = params.get("region");
  const structureId = params.get("structure");
  const showScope = useShowScope();
  const reveal = useRevealStructure();
  const sceneReady = useSceneReady();

  useEffect(() => {
    if (!isRegion(region) || region === "whole-body") return;
    showScope(
      registry.structures.filter((s) => s.region === region).map((s) => s.id),
    );
  }, [region, registry, showScope]);

  // Focusing needs the meshes, so wait until the model is indexed.
  useEffect(() => {
    const structure = structureId ? registry.get(structureId) : undefined;
    if (sceneReady && structure) reveal(structure);
  }, [sceneReady, structureId, registry, reveal]);
}

export function ExploreView() {
  const router = useRouter();
  const [systemsOpen, setSystemsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const hasSelection = useViewerStore((s) => s.selectedStructureId !== null);

  useExploreDeepLinks();
  useViewerShortcuts({
    onToggleHelp: useCallback(() => setShortcutsOpen((v) => !v), []),
    onQuiz: useCallback(() => router.push("/quiz"), [router]),
  });

  return (
    <ViewerFrame center={<StructureSearch />} showSelectionLabel>
      <SystemVisibilityPanel
        className={clsx(
          "absolute start-3 top-[76px] z-20",
          systemsOpen ? "max-lg:sheet max-lg:py-2" : "max-lg:hidden",
        )}
      />
      <StructureInfoPanel />
      <ViewerToolbar
        className={clsx(
          "absolute bottom-4 left-1/2 z-10 -translate-x-1/2",
          hasSelection && "max-md:hidden",
        )}
        systemsOpen={systemsOpen}
        onToggleSystems={() => setSystemsOpen((v) => !v)}
        onShowShortcuts={() => setShortcutsOpen(true)}
      />
      <ShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </ViewerFrame>
  );
}
