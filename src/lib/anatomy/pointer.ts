/**
 * How far (px) the pointer may move between press and release for the
 * release to still count as a tap or click. Beyond it the gesture turned the
 * camera, and must not select or peel what happens to be under the pointer.
 * A little above react-three-fiber's 2 px (its rule for clicks on empty
 * space), so a finger tap that wobbles on a tablet still selects.
 */
export const DRAG_THRESHOLD_PX = 6;

/** `delta` is the press-to-release distance R3F reports on click events. */
export function isTap(delta: number): boolean {
  return delta <= DRAG_THRESHOLD_PX;
}
