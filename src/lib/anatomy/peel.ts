import type { AnatomicalStructure } from "@/types/anatomy";

/**
 * Layer peeling, view-based: the scene is rendered once off-screen with each
 * mesh drawn in a flat colour that encodes its index (see
 * `three/structureIdPass.ts`); the structures that own the most front pixels
 * from the current camera are the outer layer. No anatomical layer data is
 * needed, so nothing is invented and it works for any model.
 */

/** Index 0 is the background and unmapped meshes (they occlude but are never peeled). */
export const BACKGROUND_INDEX = 0;
/** Fewer front pixels than this (in the ≤512px pass) is a sliver, not a layer. */
export const MIN_LAYER_PIXELS = 3;

export function encodeIndex(index: number): [number, number, number] {
  return [(index >> 16) & 0xff, (index >> 8) & 0xff, index & 0xff];
}

export function decodePixel(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b;
}

/** Front-pixel count per structure, from an RGBA buffer of encoded indices. */
export function countFrontPixels(
  pixels: Uint8Array,
  structureAt: (index: number) => string | undefined,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    const index = decodePixel(
      pixels[i] ?? 0,
      pixels[i + 1] ?? 0,
      pixels[i + 2] ?? 0,
    );
    if (index === BACKGROUND_INDEX) continue;
    const id = structureAt(index);
    if (id !== undefined) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/** Bones are the core the layers are peeled down to; everything else can go. */
export function isPeelable(structure: AnatomicalStructure): boolean {
  return structure.system !== "skeletal";
}

/** The structures to peel from front-pixel counts, sorted for stable output. */
export function outerLayer(
  counts: ReadonlyMap<string, number>,
  canPeel: (structureId: string) => boolean,
  minPixels = MIN_LAYER_PIXELS,
): string[] {
  return [...counts]
    .filter(([id, pixels]) => pixels >= minPixels && canPeel(id))
    .map(([id]) => id)
    .sort();
}
