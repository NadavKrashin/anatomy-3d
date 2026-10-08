"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";
import { MainNav } from "@/components/layout/MainNav";
import { NavMenu } from "@/components/layout/NavMenu";
import { SettingsMenu } from "@/components/layout/SettingsMenu";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { useMessages } from "@/hooks/useMessages";

// WebGL only exists in the browser; never render the canvas on the server.
const AnatomyCanvas = dynamic(() => import("./AnatomyCanvas"), { ssr: false });

interface ViewerFrameProps {
  /** Page-specific control in the middle of the top strip (search, quiz progress). */
  center: ReactNode;
  /** Show the atlas-style leader label on the selected structure. */
  showSelectionLabel?: boolean;
  children?: ReactNode;
}

/**
 * Full-screen 3D viewer on the pale "plate", with a plain top strip. Pages
 * put their overlays in as children.
 */
export function ViewerFrame({
  center,
  showSelectionLabel = false,
  children,
}: ViewerFrameProps) {
  const t = useMessages();
  const { dataset } = useAnatomyData();

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,#f6f8f9_0%,var(--color-plate)_70%,var(--color-plate-deep)_100%)]">
      <AnatomyCanvas showSelectionLabel={showSelectionLabel} />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center gap-3 px-4 py-3 md:gap-8 md:px-6">
        <div className="pointer-events-auto shrink-0">
          <Logo compact />
        </div>
        <div className="pointer-events-auto mx-auto max-w-md min-w-0 flex-1">
          {center}
        </div>
        <MainNav className="pointer-events-auto max-lg:hidden" />
        {/* On a capsule: bare icons get lost over the model. */}
        <div className="bg-sheet pointer-events-auto flex shrink-0 items-center gap-0.5 rounded-full p-0.5 shadow-[var(--shadow-float)]">
          <NavMenu className="lg:hidden" />
          <SettingsMenu />
        </div>
      </header>

      {children}

      <p className="text-faint pointer-events-none absolute start-5 bottom-5 z-0 max-w-[46ch] text-[12px] leading-snug max-lg:hidden">
        {dataset.info.isDemo
          ? t.demoModelNotice
          : dataset.info.credits
            ? t.modelCredits(dataset.info.credits)
            : dataset.info.attribution}
      </p>
    </main>
  );
}
