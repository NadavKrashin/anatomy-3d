import { Box3, Sphere, type Object3D } from "three";

/** Extra room around a focused structure so it never fills the screen edge to edge. */
const FOCUS_PADDING = 1.8;
/** Thin structures (nerves) still get a comfortable minimum framing radius. */
const MIN_FOCUS_RADIUS = 0.05;

export function boundingSphereOf(objects: readonly Object3D[]): Sphere | null {
  const box = new Box3();
  for (const object of objects) box.expandByObject(object);
  if (box.isEmpty()) return null;
  return box.getBoundingSphere(new Sphere());
}

export function framingSphere(
  objects: readonly Object3D[],
  padding = FOCUS_PADDING,
): Sphere | null {
  const sphere = boundingSphereOf(objects);
  if (!sphere) return null;
  sphere.radius = Math.max(sphere.radius, MIN_FOCUS_RADIUS) * padding;
  return sphere;
}

export interface ScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** A panel wider than this share of the viewport is treated as a bottom sheet. */
const SHEET_WIDTH_RATIO = 0.7;

/**
 * Screen-space shift (px, +x right, +y down) that moves the view's centre into
 * the part of the viewport not covered by a UI panel, so a focused structure
 * isn't hidden behind the info panel (side card on desktop, bottom sheet on
 * phones).
 */
export function unobstructedCenterShift(
  viewport: { width: number; height: number },
  obstruction: ScreenRect | null,
): { x: number; y: number } {
  if (!obstruction) return { x: 0, y: 0 };
  const width = obstruction.right - obstruction.left;
  if (width > viewport.width * SHEET_WIDTH_RATIO) {
    return { x: 0, y: obstruction.top / 2 - viewport.height / 2 };
  }
  const panelIsOnLeft =
    (obstruction.left + obstruction.right) / 2 < viewport.width / 2;
  return panelIsOnLeft
    ? { x: obstruction.right / 2, y: 0 }
    : { x: obstruction.left / 2 - viewport.width / 2, y: 0 };
}
