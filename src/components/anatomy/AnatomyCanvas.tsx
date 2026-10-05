"use client";

import { useGLTF, useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Suspense, useState, useSyncExternalStore } from "react";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { useMessages } from "@/hooks/useMessages";
import { useSceneIndexStore } from "@/store/sceneIndexStore";
import { useViewerStore } from "@/store/viewerStore";
import { AnatomyScene } from "./AnatomyScene";
import { PeelModeHint } from "./LayerControls";
import { ViewerErrorBoundary } from "./ViewerErrorBoundary";

let webGLSupport: boolean | undefined;

/** Cached: every probe creates a GL context, and browsers cap how many exist. */
function detectWebGL(): boolean {
  if (webGLSupport === undefined) {
    try {
      const canvas = document.createElement("canvas");
      webGLSupport = Boolean(
        canvas.getContext("webgl2") ?? canvas.getContext("webgl"),
      );
    } catch {
      webGLSupport = false;
    }
  }
  return webGLSupport;
}

const subscribeNever = () => () => {};

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="sheet flex max-w-sm flex-col items-center gap-4 p-6 text-center">
        {children}
      </div>
    </div>
  );
}

/**
 * Loading state. Until the first (primary) model file is in, a centred
 * progress bar; while the other files stream in, a small pill that leaves
 * the already-visible model usable. `data-viewer-loading` stays until every
 * file is indexed (e2e waits on it).
 */
function LoadingOverlay() {
  const t = useMessages();
  const { progress, active } = useProgress();
  const loaded = useSceneIndexStore((s) => s.models.size);
  const expected = useSceneIndexStore((s) => s.expected);
  const complete = useSceneIndexStore((s) => s.complete);
  if (complete && !active) return null;
  if (loaded > 0) {
    return (
      <div
        className="pointer-events-none absolute inset-x-0 top-[72px] z-10 flex justify-center"
        role="status"
        data-viewer-loading=""
      >
        <p className="bg-sheet/90 text-graphite rounded-full px-3 py-1 text-[13px] shadow-[var(--shadow-float)]">
          {t.viewer.loadingMore(loaded, expected)}
        </p>
      </div>
    );
  }
  const percent = Math.round(progress);
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      role="status"
      data-viewer-loading=""
    >
      <div className="flex w-56 flex-col items-center gap-3">
        <p className="text-graphite font-serif text-[17px]">
          {t.viewer.loading}
        </p>
        <div
          className="bg-rule h-0.5 w-full overflow-hidden rounded-full"
          dir="ltr"
        >
          <div
            className="bg-scrub h-full transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-faint text-xs tabular-nums" dir="ltr">
          {percent}%
        </p>
      </div>
    </div>
  );
}

export default function AnatomyCanvas({
  showSelectionLabel = false,
}: {
  showSelectionLabel?: boolean;
}) {
  const t = useMessages();
  const { dataset } = useAnatomyData();
  const [attempt, setAttempt] = useState(0);
  const hasWebGL = useSyncExternalStore(
    subscribeNever,
    detectWebGL,
    () => true,
  );
  const { models } = dataset.info;

  if (!hasWebGL) {
    return (
      <CenteredMessage>
        <AlertTriangle className="text-caution size-6" aria-hidden />
        <p className="text-ink text-sm">{t.viewer.webglUnavailable}</p>
      </CenteredMessage>
    );
  }

  return (
    <ViewerErrorBoundary
      key={attempt}
      onRetry={() => {
        for (const model of models) useGLTF.clear(model.url);
        setAttempt((n) => n + 1);
      }}
      fallback={(retry) => (
        <CenteredMessage>
          <AlertTriangle className="text-caution size-6" aria-hidden />
          <p className="text-ink text-sm">{t.viewer.loadFailed}</p>
          <button
            type="button"
            onClick={retry}
            className="bg-scrub inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium text-white"
          >
            <RotateCw className="size-4" aria-hidden />
            {t.viewer.retry}
          </button>
        </CenteredMessage>
      )}
    >
      <Canvas
        className="!absolute inset-0 touch-none"
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ fov: 32, near: 0.01, far: 50, position: [0, 1.2, 3] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onPointerMissed={(event) => {
          // Only plain clicks on empty space deselect; ignore right-click pans.
          if (event.button === 0) useViewerStore.getState().pick(null);
        }}
      >
        <Suspense fallback={null}>
          <AnatomyScene
            models={models}
            showSelectionLabel={showSelectionLabel}
          />
        </Suspense>
      </Canvas>
      <LoadingOverlay />
      <PeelModeHint />
    </ViewerErrorBoundary>
  );
}
