"use client";

import { CameraControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { MathUtils, PerspectiveCamera, type Object3D } from "three";
import {
  framingSphere,
  unobstructedCenterShift,
  type ScreenRect,
} from "@/lib/anatomy/three/cameraFraming";
import { VIEWER_OBSTRUCTION_ATTRIBUTE } from "@/lib/anatomy/viewerDom";
import { useSceneIndexStore } from "@/store/sceneIndexStore";
import { useViewerStore, type CameraCommand } from "@/store/viewerStore";

const MODEL_PADDING = 1.08;
const FRONT_AZIMUTH = 0;
const FRONT_POLAR = Math.PI / 2;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function obstructionRelativeTo(canvas: HTMLElement): ScreenRect | null {
  const element = document.querySelector(`[${VIEWER_OBSTRUCTION_ATTRIBUTE}]`);
  if (!element) return null;
  const panel = element.getBoundingClientRect();
  const view = canvas.getBoundingClientRect();
  return {
    left: panel.left - view.left,
    right: panel.right - view.left,
    top: panel.top - view.top,
    bottom: panel.bottom - view.top,
  };
}

export function CameraController() {
  const controlsRef = useRef<CameraControls>(null);
  const getThree = useThree((s) => s.get);

  useEffect(() => {
    const visibleObjects = (): Object3D[] => {
      const index = useSceneIndexStore.getState().objectsByStructure;
      if (!index) return [];
      const all = [...index.values()].flat();
      const visible = all.filter((object) => object.visible);
      return visible.length > 0 ? visible : all;
    };

    const reset = (smooth: boolean) => {
      const controls = controlsRef.current;
      const sphere = framingSphere(visibleObjects(), MODEL_PADDING);
      if (!controls || !sphere) return;
      void controls.setFocalOffset(0, 0, 0, smooth);
      void controls.rotateTo(FRONT_AZIMUTH, FRONT_POLAR, smooth);
      void controls.fitToSphere(sphere, smooth);
    };

    const focus = (structureId: string, smooth: boolean) => {
      const controls = controlsRef.current;
      const objects = useSceneIndexStore
        .getState()
        .objectsByStructure?.get(structureId);
      const sphere = objects ? framingSphere(objects) : null;
      const { camera, gl, size } = getThree();
      if (!controls || !sphere || !(camera instanceof PerspectiveCamera))
        return;

      void controls.fitToSphere(sphere, smooth);

      // Convert the pixel shift into world units at the final camera
      // distance, then slide the camera in its own plane by that much. Moving
      // the camera against the shift moves the structure with it on screen;
      // camera-controls' focal offset Y is screen-down, hence both negated.
      const distance = controls.getDistanceToFitSphere(sphere.radius);
      const worldPerPixel =
        (2 * distance * Math.tan(MathUtils.degToRad(camera.fov) / 2)) /
        size.height;
      const shift = unobstructedCenterShift(
        size,
        obstructionRelativeTo(gl.domElement),
      );
      void controls.setFocalOffset(
        -shift.x * worldPerPixel,
        -shift.y * worldPerPixel,
        0,
        smooth,
      );
    };

    const run = (command: CameraCommand) => {
      const smooth = !prefersReducedMotion();
      if (command.type === "reset") return reset(smooth);
      // Wait a frame so a just-opened info panel is laid out before measuring it.
      requestAnimationFrame(() => focus(command.structureId, smooth));
    };

    // Frame the model once the first (primary, whole-body) file is indexed.
    // Files that stream in later don't move the camera under the user. A
    // command issued before this controller mounted (e.g. a quiz or deep
    // link reacting to the same index update) is applied after framing.
    if (useSceneIndexStore.getState().objectsByStructure) {
      reset(false);
      const pending = useViewerStore.getState().cameraCommand;
      if (pending) run(pending);
    }
    const unsubscribeIndex = useSceneIndexStore.subscribe((state, previous) => {
      if (state.objectsByStructure && !previous.objectsByStructure)
        reset(false);
    });
    const unsubscribeCommands = useViewerStore.subscribe((state, previous) => {
      if (state.cameraCommand && state.cameraCommand !== previous.cameraCommand)
        run(state.cameraCommand);
    });
    return () => {
      unsubscribeIndex();
      unsubscribeCommands();
    };
  }, [getThree]);

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      smoothTime={0.32}
      draggingSmoothTime={0.08}
      minDistance={0.05}
      maxDistance={8}
      dollyToCursor
    />
  );
}
