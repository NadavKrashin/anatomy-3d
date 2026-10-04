"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/layout/Logo";
import { MainNav } from "@/components/layout/MainNav";
import { SettingsMenu } from "@/components/layout/SettingsMenu";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { useMessages } from "@/hooks/useMessages";
import { useViewerShortcuts } from "@/hooks/useViewerShortcuts";
import { useViewerStore } from "@/store/viewerStore";
import { ANATOMY_REGIONS, type AnatomyRegion } from "@/types/anatomy";
import { clsx } from "clsx";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { StructureInfoPanel } from "./StructureInfoPanel";
import { StructureSearch } from "./StructureSearch";
import { SystemVisibilityPanel } from "./SystemVisibilityPanel";
import { ViewerToolbar } from "./ViewerToolbar";

// WebGL only exists in the browser; never render the canvas on the server.
const AnatomyCanvas = dynamic(() => import("./AnatomyCanvas"), { ssr: false });

const isRegion = (value: string | null): value is AnatomyRegion =>
  value !== null && (ANATOMY_REGIONS as readonly string[]).includes(value);

/** `/explore?region=upper-limb` starts with only that region visible. */
function useRegionScope() {
  const { registry } = useAnatomyData();
  const region = useSearchParams().get("region");

  useEffect(() => {
    if (!isRegion(region) || region === "whole-body") return;
    const { showAll, hideMany, select, resetCamera } =
      useViewerStore.getState();
    showAll();
    select(null);
    hideMany(
      registry.structures.filter((s) => s.region !== region).map((s) => s.id),
    );
    resetCamera();
  }, [region, registry]);
}

export function ExploreView() {
  const t = useMessages();
  const { dataset } = useAnatomyData();
  const [systemsOpen, setSystemsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const hasSelection = useViewerStore((s) => s.selectedStructureId !== null);

  useRegionScope();
  useViewerShortcuts({
    onToggleHelp: useCallback(() => setShortcutsOpen((v) => !v), []),
  });

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,#171b21_0%,var(--color-canvas)_70%)]">
      <AnatomyCanvas />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center gap-3 p-3 md:gap-6 md:px-4">
        <div className="pointer-events-auto">
          <Logo />
        </div>
        <div className="pointer-events-auto mx-auto w-full max-w-md">
          <StructureSearch />
        </div>
        <MainNav className="pointer-events-auto max-lg:hidden" />
        <div className="pointer-events-auto">
          <SettingsMenu />
        </div>
      </header>

      <SystemVisibilityPanel
        className={clsx(
          "absolute start-4 top-20 z-20",
          systemsOpen ? "block" : "max-lg:hidden",
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

      {dataset.info.isDemo && (
        <p className="text-faint pointer-events-none absolute start-4 bottom-5 z-0 max-w-[40ch] text-[11px] max-lg:hidden">
          {t.demoModelNotice}
        </p>
      )}

      <ShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </main>
  );
}
