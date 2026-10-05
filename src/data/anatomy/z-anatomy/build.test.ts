import { describe, expect, it } from "vitest";
import { createRegistry } from "@/lib/anatomy/registry";
import { validateDataset } from "@/lib/anatomy/validateDataset";
import { DETAIL_TAG } from "@/types/anatomy";
import {
  buildZAnatomyDataset,
  parseName,
  toId,
  type ManifestEntry,
} from "./build";
import { zAnatomyDataset } from "./index";
import manifest from "./manifest.json";

const entry = (
  name: string,
  overrides: Partial<ManifestEntry> = {},
): ManifestEntry => ({
  name,
  system: "skeletal",
  tissue: "bone",
  region: "upper-limb",
  vertices: 100,
  ...overrides,
});

describe("parseName", () => {
  it("reads side suffixes", () => {
    expect(parseName("Humerus.l")).toEqual({
      base: "Humerus",
      side: "left",
      inconstant: false,
    });
    expect(parseName("Radius.r")).toEqual({
      base: "Radius",
      side: "right",
      inconstant: false,
    });
    expect(parseName("Frontal bone")).toEqual({
      base: "Frontal bone",
      side: "midline",
      inconstant: false,
    });
  });

  it("reads side prefixes on unsided names", () => {
    expect(parseName("Left subclavian artery")).toEqual({
      base: "Subclavian artery",
      side: "left",
      inconstant: false,
    });
  });

  it("marks parenthesised (inconstant) structures", () => {
    expect(parseName("(Ulnar recurrent artery).r")).toEqual({
      base: "Ulnar recurrent artery",
      side: "right",
      inconstant: true,
    });
  });
});

describe("toId", () => {
  it("makes kebab-case ids with the side", () => {
    expect(toId("Biceps brachii muscle", "left")).toBe(
      "biceps-brachii-muscle-left",
    );
    expect(toId("Atlas (C1)", "midline")).toBe("atlas-c1");
  });
});

describe("buildZAnatomyDataset", () => {
  it("groups muscle parts into a whole muscle, and keeps each part as a child structure", () => {
    const { structures, meshMap, partMeshMap } = buildZAnatomyDataset([
      entry("Long head of biceps brachii.l", {
        system: "muscular",
        tissue: "muscle",
        group: "Biceps brachii muscle",
      }),
      entry("Short head of biceps brachii.l", {
        system: "muscular",
        tissue: "muscle",
        group: "Biceps brachii muscle",
      }),
    ]);
    expect(structures.map((s) => [s.id, s.parentId])).toEqual([
      ["biceps-brachii-muscle-left", undefined],
      ["long-head-of-biceps-brachii-left", "biceps-brachii-muscle-left"],
      ["short-head-of-biceps-brachii-left", "biceps-brachii-muscle-left"],
    ]);
    expect(meshMap).toEqual({
      "Long head of biceps brachii.l": "biceps-brachii-muscle-left",
      "Short head of biceps brachii.l": "biceps-brachii-muscle-left",
    });
    expect(partMeshMap).toEqual({
      "Long head of biceps brachii.l": "long-head-of-biceps-brachii-left",
      "Short head of biceps brachii.l": "short-head-of-biceps-brachii-left",
    });
  });

  it("attaches curated content and Hebrew names where they exist", () => {
    const [humerus] = buildZAnatomyDataset([entry("Humerus.l")]).structures;
    expect(humerus?.names.he?.text).toBe("עצם הזרוע");
    expect(humerus?.details?.articulations?.length).toBeGreaterThan(0);
    expect(humerus).toMatchObject({
      side: "left",
      bilateralGroupId: "humerus",
    });
  });

  it("tags small branches and inconstant structures as detail", () => {
    const { structures } = buildZAnatomyDataset([
      entry("Dorsal branch of ulnar nerve.l", {
        system: "nervous",
        tissue: "nerve",
      }),
      entry("(Ulnar recurrent artery).l", {
        system: "cardiovascular",
        tissue: "artery",
      }),
      entry("Ulnar nerve.l", { system: "nervous", tissue: "nerve" }),
    ]);
    const tags = Object.fromEntries(structures.map((s) => [s.id, s.tags]));
    expect(tags["dorsal-branch-of-ulnar-nerve-left"]).toContain(DETAIL_TAG);
    expect(tags["ulnar-recurrent-artery-left"]).toEqual(
      expect.arrayContaining(["inconstant", DETAIL_TAG]),
    );
    expect(tags["ulnar-nerve-left"]).not.toContain(DETAIL_TAG);
  });

  it("puts ligaments in the 'other' system", () => {
    const [ligament] = buildZAnatomyDataset([
      entry("Superficial transverse metacarpal ligament.l", {
        system: "muscular",
        tissue: "ligament",
      }),
    ]).structures;
    expect(ligament?.system).toBe("other");
  });
});

describe("the Z-Anatomy whole-body dataset", () => {
  const { structures, meshMap } = zAnatomyDataset;
  const registry = createRegistry(structures);

  it("passes dataset validation without errors", () => {
    expect(
      validateDataset(zAnatomyDataset).filter((i) => i.severity === "error"),
    ).toEqual([]);
  });

  it("contains the core upper-limb structures on both sides", () => {
    for (const base of [
      "humerus",
      "radius",
      "ulna",
      "scapula",
      "clavicle",
      "biceps-brachii-muscle",
      "deltoid-muscle",
      "median-nerve",
      "ulnar-nerve",
      "radial-nerve",
      "musculocutaneous-nerve",
      "axillary-artery",
      "brachial-artery",
    ]) {
      for (const side of ["left", "right"])
        expect(registry.has(`${base}-${side}`), `${base}-${side}`).toBe(true);
    }
  });

  it("maps every exported mesh", () => {
    expect(Object.keys(meshMap)).toHaveLength(manifest.length);
  });

  it("covers every region and the organ systems", () => {
    const regions = new Set(registry.structures.map((s) => s.region));
    for (const region of [
      "head",
      "neck",
      "thorax",
      "abdomen",
      "pelvis",
      "back",
      "upper-limb",
      "lower-limb",
    ] as const)
      expect(regions.has(region), region).toBe(true);
    expect(registry.presentSystems()).toEqual(
      expect.arrayContaining([
        "respiratory",
        "digestive",
        "urinary",
        "reproductive",
        "endocrine",
        "lymphatic",
      ]),
    );
  });

  it("never contains the non-commercially licensed models", () => {
    const names = manifest.map((entry) => entry.name);
    for (const banned of [
      /^Kidney\b/,
      /^Renal pelvis/,
      /^Intrarenal/,
      /^Cochlea\./,
      /^Vestibule\./,
    ])
      expect(
        names.filter((n) => banned.test(n)),
        String(banned),
      ).toEqual([]);
  });

  it("places organs by region", () => {
    const region = (id: string) => registry.get(id)?.region;
    expect(region("liver")).toBe("abdomen");
    expect(region("stomach")).toBe("abdomen");
    expect(region("ventricle-left")).toBe("thorax"); // "Left ventricle"
    expect(region("urinary-bladder")).toBe("pelvis");
    expect(region("thyroid-gland")).toBe("neck");
  });

  it("groups organ pieces into whole organs, one per side where paired", () => {
    expect(registry.partsOf("heart").map((p) => p.id)).toEqual(
      expect.arrayContaining(["ventricle-left", "atrium-right"]),
    );
    expect(registry.partsOf("lung-right")).toHaveLength(3);
    expect(registry.partsOf("lung-left")).toHaveLength(2);
    expect(registry.get("frontal-lobe-left")?.side).toBe("left");
    expect(registry.get("cerebellum")?.side).toBe("midline");
    expect(registry.wholeOf("superior-lobe-of-right-lung")?.id).toBe(
      "lung-right",
    );
  });

  it("studyable structures include parts, the wholes list does not", () => {
    expect(registry.all.some((s) => s.id === "ventricle-left")).toBe(true);
    expect(registry.structures.some((s) => s.id === "ventricle-left")).toBe(
      false,
    );
  });
});
