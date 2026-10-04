import { Color, MeshStandardMaterial, type Material, type Mesh } from "three";

export type MeshVisualState =
  "default" | "hovered" | "selected" | "ghosted" | "hidden";

const HIGHLIGHT_COLOR = new Color("#5ac8fa");
const HOVER_EMISSIVE_INTENSITY = 0.08;
const SELECTED_EMISSIVE_INTENSITY = 0.2;
const GHOST_OPACITY = 0.1;

/**
 * Swaps mesh materials to reflect hover/selection/isolation without ever
 * mutating the model's own materials.
 *
 * Variants are cloned lazily, once per (base material, state) pair, and shared
 * by every mesh using that base — so highlighting never allocates per frame,
 * and a real model with a few dozen shared materials yields a few dozen
 * variants rather than one per mesh. `dispose()` restores the originals.
 */
export class MaterialStateController {
  private readonly originals = new Map<Mesh, Material | Material[]>();
  private readonly variants = new Map<string, Material>();

  apply(mesh: Mesh, state: MeshVisualState): void {
    let original = this.originals.get(mesh);
    if (original === undefined) {
      original = mesh.material;
      this.originals.set(mesh, original);
    }

    mesh.visible = state !== "hidden";
    mesh.userData.interactive = state !== "hidden" && state !== "ghosted";
    if (state === "hidden") return;

    mesh.material = Array.isArray(original)
      ? original.map((material) => this.variantFor(material, state))
      : this.variantFor(original, state);
  }

  dispose(): void {
    for (const [mesh, original] of this.originals) {
      mesh.material = original;
      mesh.visible = true;
      delete mesh.userData.interactive;
    }
    for (const variant of this.variants.values()) variant.dispose();
    this.originals.clear();
    this.variants.clear();
  }

  private variantFor(
    base: Material,
    state: Exclude<MeshVisualState, "hidden">,
  ): Material {
    if (state === "default") return base;
    const key = `${base.uuid}:${state}`;
    let variant = this.variants.get(key);
    if (!variant) {
      variant = createVariant(base, state);
      this.variants.set(key, variant);
    }
    return variant;
  }
}

function createVariant(
  base: Material,
  state: Exclude<MeshVisualState, "default" | "hidden">,
): Material {
  const variant = base.clone();
  if (state === "ghosted") {
    variant.transparent = true;
    variant.opacity = GHOST_OPACITY;
    // Ghosts must not occlude the isolated structure behind them.
    variant.depthWrite = false;
    return variant;
  }
  if (variant instanceof MeshStandardMaterial) {
    variant.emissive.copy(HIGHLIGHT_COLOR);
    variant.emissiveIntensity =
      state === "selected"
        ? SELECTED_EMISSIVE_INTENSITY
        : HOVER_EMISSIVE_INTENSITY;
  } else if ("color" in variant && variant.color instanceof Color) {
    variant.color.lerp(HIGHLIGHT_COLOR, state === "selected" ? 0.45 : 0.2);
  }
  return variant;
}
