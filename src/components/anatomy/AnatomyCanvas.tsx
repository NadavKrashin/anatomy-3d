"use client";

import { useGLTF, useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Suspense, useState, useSyncExternalStore } from "react";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { useMessages } from "@/hooks/useMessages";
import { useViewerStore } from "@/store/viewerStore";
import { AnatomyScene } from "./AnatomyScene";
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
      <div className="panel flex max-w-sm flex-col items-center gap-4 p-6 text-center">
        {children}
      </div>
    </div>
  );
}

function LoadingOverlay() {
  const t = useMessages();
  const { progress, active } = useProgress();
  if (!active && progress >= 100) return null;
  const percent = Math.round(progress);
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      role="status"
      data-viewer-loading=""
    >
      <div className="flex w-56 flex-col items-center gap-3">
        <p className="text-muted text-sm">{t.viewer.loading}</p>
        <div
          className="bg-raised h-1 w-full overflow-hidden rounded-full"
          dir="ltr"
        >
          <div
            className="bg-accent h-full transition-[width] duration-300"
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

export default function AnatomyCanvas() {
  const t = useMessages();
  const { dataset } = useAnatomyData();
  const [attempt, setAttempt] = useState(0);
  const hasWebGL = useSyncExternalStore(
    subscribeNever,
    detectWebGL,
    () => true,
  );
  const modelUrl = dataset.info.modelUrl;

  if (!hasWebGL) {
    return (
      <CenteredMessage>
        <AlertTriangle className="text-warn size-6" aria-hidden />
        <p className="text-ink text-sm">{t.viewer.webglUnavailable}</p>
      </CenteredMessage>
    );
  }

  return (
    <ViewerErrorBoundary
      key={attempt}
      onRetry={() => {
        useGLTF.clear(modelUrl);
        setAttempt((n) => n + 1);
      }}
      fallback={(retry) => (
        <CenteredMessage>
          <AlertTriangle className="text-warn size-6" aria-hidden />
          <p className="text-ink text-sm">{t.viewer.loadFailed}</p>
          <button
            type="button"
            onClick={retry}
            className="bg-accent text-accent-ink inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium"
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
          <AnatomyScene modelUrl={modelUrl} />
        </Suspense>
      </Canvas>
      <LoadingOverlay />
    </ViewerErrorBoundary>
  );
}
