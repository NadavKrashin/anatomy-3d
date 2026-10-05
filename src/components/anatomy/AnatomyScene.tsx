"use client";

import { Suspense, useEffect } from "react";
import { useSceneIndexStore } from "@/store/sceneIndexStore";
import type { AnatomyModelFile } from "@/types/anatomy";
import { AnatomyModel } from "./AnatomyModel";
import { AttachmentPatches } from "./AttachmentPatches";
import { CameraController } from "./CameraController";
import { SelectionLabel } from "./SelectionLabel";

/**
 * The dataset's model files, primary first: it frames the camera, then the
 * other files stream in together, each appearing as soon as it is loaded
 * (own Suspense boundary, so nothing already shown blinks).
 */
function ModelFiles({ models }: { models: readonly AnatomyModelFile[] }) {
  const [primary, ...rest] = models;
  const primaryLoaded = useSceneIndexStore(
    (s) => primary !== undefined && s.models.has(primary.id),
  );
  useEffect(() => {
    useSceneIndexStore.getState().setExpected(models.length);
  }, [models.length]);
  if (!primary) return null;

  return (
    <>
      <Suspense fallback={null}>
        <AnatomyModel id={primary.id} url={primary.url} />
      </Suspense>
      {primaryLoaded &&
        rest.map((model) => (
          <Suspense key={model.id} fallback={null}>
            <AnatomyModel id={model.id} url={model.url} />
          </Suspense>
        ))}
    </>
  );
}

export function AnatomyScene({
  models,
  showSelectionLabel,
}: {
  models: readonly AnatomyModelFile[];
  /** Explore extras: leader label and attachment patches (would give quiz answers away). */
  showSelectionLabel: boolean;
}) {
  return (
    <>
      {/* Even, soft light suited to the pale plate: a bright sky/ground fill,
          a key light from the front-right and a gentle rim from behind. */}
      <hemisphereLight args={["#ffffff", "#c9d1d6", 1.35]} />
      <directionalLight position={[2, 3, 3]} intensity={1.6} />
      <directionalLight position={[-2.5, 1.5, -2]} intensity={0.55} />
      <ModelFiles models={models} />
      <CameraController />
      {showSelectionLabel && <SelectionLabel />}
      {showSelectionLabel && <AttachmentPatches />}
    </>
  );
}
