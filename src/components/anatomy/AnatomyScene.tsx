"use client";

import { AnatomyModel } from "./AnatomyModel";
import { CameraController } from "./CameraController";

export function AnatomyScene({ modelUrl }: { modelUrl: string }) {
  return (
    <>
      {/* Soft, neutral lighting: a sky/ground fill plus a key and a rim light. */}
      <hemisphereLight args={["#f2f4f7", "#2a2d33", 1.1]} />
      <directionalLight position={[2, 3, 3]} intensity={1.9} />
      <directionalLight position={[-2.5, 1.5, -2]} intensity={0.7} />
      <AnatomyModel url={modelUrl} />
      <CameraController />
    </>
  );
}
