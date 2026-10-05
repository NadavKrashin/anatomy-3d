"use client";

import { AnatomyModel } from "./AnatomyModel";
import { CameraController } from "./CameraController";
import { SelectionLabel } from "./SelectionLabel";

export function AnatomyScene({
  modelUrl,
  showSelectionLabel,
}: {
  modelUrl: string;
  showSelectionLabel: boolean;
}) {
  return (
    <>
      {/* Even, soft light suited to the pale plate: a bright sky/ground fill,
          a key light from the front-right and a gentle rim from behind. */}
      <hemisphereLight args={["#ffffff", "#c9d1d6", 1.35]} />
      <directionalLight position={[2, 3, 3]} intensity={1.6} />
      <directionalLight position={[-2.5, 1.5, -2]} intensity={0.55} />
      <AnatomyModel url={modelUrl} />
      <CameraController />
      {showSelectionLabel && <SelectionLabel />}
    </>
  );
}
