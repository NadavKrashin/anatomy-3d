import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import { describe, expect, it } from "vitest";
import { demoDataset } from "@/data/anatomy/demo";
import { createMeshMapAdapter } from "../modelAdapter";
import { createRegistry } from "../registry";
import { MaterialStateController } from "./materialStates";
import { buildSceneIndex } from "./sceneIndex";
import { framingSphere, unobstructedCenterShift } from "./cameraFraming";

const adapter = createMeshMapAdapter(createRegistry(demoDataset.structures), {
  Heart: "heart",
  "Liver.001": "liver",
});

const mesh = (name: string, material = new MeshStandardMaterial()) => {
  const m = new Mesh(new BoxGeometry(), material);
  m.name = name;
  return m;
};

describe("buildSceneIndex", () => {
  it("maps meshes by their own name or an ancestor's", () => {
    const root = new Group();
    const heart = mesh("Heart");
    const liverGroup = new Group();
    // GLTFLoader sanitizes "Liver.001" → "Liver001" but keeps the original in userData.
    liverGroup.name = "Liver001";
    liverGroup.userData.name = "Liver.001";
    const liverPart = mesh("Liver_primitive_0");
    liverGroup.add(liverPart);
    const unmapped = mesh("Unknown");
    root.add(heart, liverGroup, unmapped);

    const index = buildSceneIndex(root, adapter);
    expect(index.structureByMesh.get(heart)?.id).toBe("heart");
    expect(index.structureByMesh.get(liverPart)?.id).toBe("liver");
    expect(index.structureByMesh.has(unmapped)).toBe(false);
    expect(liverPart.userData.structureId).toBe("liver");
  });
});

describe("MaterialStateController", () => {
  it("highlights without mutating the original and restores on dispose", () => {
    const original = new MeshStandardMaterial();
    const a = mesh("a", original);
    const b = mesh("b", original);
    const controller = new MaterialStateController();

    controller.apply(a, "selected");
    controller.apply(b, "selected");
    expect(a.material).not.toBe(original);
    expect(a.material).toBe(b.material); // shared variant, not one clone per mesh
    expect(original.emissiveIntensity).toBe(1);
    expect(original.emissive.getHex()).toBe(0);

    controller.apply(a, "hidden");
    expect(a.visible).toBe(false);
    expect(a.userData.interactive).toBe(false);

    controller.dispose();
    expect(a.material).toBe(original);
    expect(a.visible).toBe(true);
  });

  it("ghosts are transparent and not interactive", () => {
    const m = mesh("m");
    const controller = new MaterialStateController();
    controller.apply(m, "ghosted");
    const material = m.material as MeshStandardMaterial;
    expect(material.transparent).toBe(true);
    expect(material.depthWrite).toBe(false);
    expect(m.userData.interactive).toBe(false);
  });
});

describe("framingSphere", () => {
  it("pads the bounding sphere", () => {
    const sphere = framingSphere([mesh("x")], 2);
    expect(sphere?.radius).toBeCloseTo((Math.sqrt(3) / 2) * 2);
  });

  it("returns null for nothing", () => {
    expect(framingSphere([])).toBeNull();
  });
});

describe("unobstructedCenterShift", () => {
  const viewport = { width: 1000, height: 800 };

  it("does nothing without a panel", () => {
    expect(unobstructedCenterShift(viewport, null)).toEqual({ x: 0, y: 0 });
  });

  it("shifts right when a side panel covers the left", () => {
    expect(
      unobstructedCenterShift(viewport, {
        left: 0,
        right: 400,
        top: 80,
        bottom: 700,
      }),
    ).toEqual({ x: 200, y: 0 });
  });

  it("shifts left when a side panel covers the right", () => {
    expect(
      unobstructedCenterShift(viewport, {
        left: 600,
        right: 1000,
        top: 80,
        bottom: 700,
      }),
    ).toEqual({ x: -200, y: 0 });
  });

  it("shifts up when a bottom sheet covers the lower part", () => {
    expect(
      unobstructedCenterShift(viewport, {
        left: 8,
        right: 992,
        top: 400,
        bottom: 792,
      }),
    ).toEqual({ x: 0, y: -200 });
  });
});
