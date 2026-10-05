"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";
import { MainNav } from "@/components/layout/MainNav";
import { SettingsMenu } from "@/components/layout/SettingsMenu";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { useMessages } from "@/hooks/useMessages";

// WebGL only exists in the browser; never render the canvas on the server.
const AnatomyCanvas = dynamic(() => import("./AnatomyCanvas"), { ssr: false });

/**
 * Full-screen 3D viewer with the floating top bar. Pages put their own
 * control in the bar's centre (search in explore, progress in quiz) and their
 * overlays as children.
 */
export function ViewerFrame({
  center,
  children,
}: {
  center: ReactNode;
  children?: ReactNode;
}) {
  const t = useMessages();
  const { dataset } = useAnatomyData();

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,#171b21_0%,var(--color-canvas)_70%)]">
      <AnatomyCanvas />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center gap-3 p-3 md:gap-6 md:px-4">
        <div className="pointer-events-auto">
          <Logo />
        </div>
        <div className="pointer-events-auto mx-auto w-full max-w-md">
          {center}
        </div>
        <MainNav className="pointer-events-auto max-lg:hidden" />
        <div className="pointer-events-auto">
          <SettingsMenu />
        </div>
      </header>

      {children}

      <p className="text-faint pointer-events-none absolute start-4 bottom-5 z-0 max-w-[48ch] text-[11px] max-lg:hidden">
        {dataset.info.isDemo ? t.demoModelNotice : dataset.info.attribution}
      </p>
    </main>
  );
}
