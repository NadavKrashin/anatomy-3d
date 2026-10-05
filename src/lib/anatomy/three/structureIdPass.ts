import {
  Color,
  FrontSide,
  LinearSRGBColorSpace,
  MeshBasicMaterial,
  Vector2,
  WebGLRenderTarget,
  type Camera,
  type Material,
  type Mesh,
  type Object3D,
  type WebGLRenderer,
} from "three";
import { BACKGROUND_INDEX, countFrontPixels, encodeIndex } from "../peel";

/** Longest side of the off-screen pass: enough to resolve thin nerves, cheap to read back. */
const PASS_MAX_SIDE = 512;

const isMesh = (object: Object3D): object is Mesh =>
  (object as Mesh).isMesh === true;

/**
 * Renders `roots` (the loaded model files, sharing one depth buffer) once
 * from `camera` into an off-screen target with every mesh
 * in a flat colour encoding its index, reads the pixels back and returns the
 * number of front pixels per structure id. Meshes that aren't interactive
 * (ghosted, hidden) are skipped; unmapped meshes still occlude.
 *
 * Colours are written in linear space, untone-mapped, into a target with no
 * colour-space conversion, so the bytes read back are exactly the encoded
 * index. Everything touched is restored before returning.
 */
export function countFrontPixelsByStructure(
  gl: WebGLRenderer,
  roots: readonly Object3D[],
  camera: Camera,
  structureIdOf: (mesh: Mesh) => string | undefined,
): Map<string, number> {
  const size = gl.getSize(new Vector2());
  const scale = PASS_MAX_SIDE / Math.max(size.x, size.y, 1);
  const width = Math.max(1, Math.round(size.x * scale));
  const height = Math.max(1, Math.round(size.y * scale));

  const structureAtIndex: (string | undefined)[] = [undefined];
  const saved = new Map<
    Mesh,
    { material: Material | Material[]; visible: boolean }
  >();
  const materials: MeshBasicMaterial[] = [];

  const prepare = (object: Object3D) => {
    if (!isMesh(object)) return;
    saved.set(object, { material: object.material, visible: object.visible });
    if (object.userData.interactive === false) {
      object.visible = false;
      return;
    }
    const id = structureIdOf(object);
    let index = BACKGROUND_INDEX;
    if (id !== undefined) {
      index = structureAtIndex.length;
      structureAtIndex.push(id);
    }
    const original = Array.isArray(object.material)
      ? object.material[0]
      : object.material;
    const [r, g, b] = encodeIndex(index);
    const material = new MeshBasicMaterial({
      side: original?.side ?? FrontSide,
      toneMapped: false,
    });
    material.color.setRGB(r / 255, g / 255, b / 255, LinearSRGBColorSpace);
    materials.push(material);
    object.material = material;
  };
  for (const root of roots) root.traverse(prepare);

  const target = new WebGLRenderTarget(width, height);
  const pixels = new Uint8Array(width * height * 4);
  const previousTarget = gl.getRenderTarget();
  const previousClear = gl.getClearColor(new Color());
  const previousAlpha = gl.getClearAlpha();
  const previousAutoClear = gl.autoClear;
  try {
    gl.setRenderTarget(target);
    gl.setClearColor(0x000000, 0);
    gl.clear();
    gl.autoClear = false; // one depth buffer across all files
    for (const root of roots) gl.render(root, camera);
    gl.readRenderTargetPixels(target, 0, 0, width, height, pixels);
  } finally {
    gl.autoClear = previousAutoClear;
    gl.setRenderTarget(previousTarget);
    gl.setClearColor(previousClear, previousAlpha);
    for (const [mesh, { material, visible }] of saved) {
      mesh.material = material;
      mesh.visible = visible;
    }
    for (const material of materials) material.dispose();
    target.dispose();
  }

  return countFrontPixels(pixels, (index) => structureAtIndex[index]);
}
