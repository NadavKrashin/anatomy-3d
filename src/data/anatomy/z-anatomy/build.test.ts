import { describe, expect, it } from "vitest";
import { createRegistry } from "@/lib/anatomy/registry";
import { validateDataset } from "@/lib/anatomy/validateDataset";
import { DETAIL_TAG } from "@/types/anatomy";
import {
  buildZAnatomyDataset,
  MODEL_SOURCES,
  parseName,
  toId,
  type ManifestEntry,
} from "./build";
import {
  createZAnatomyDataset,
  INCLUDE_NON_COMMERCIAL,
  zAnatomyDataset,
} from "./index";
import zManifest from "./manifest.json";
import open3dManifest from "./manifest-open3d.json";
import nonCommercialManifest from "./manifest-non-commercial.json";
import femaleManifest from "./manifest-female.json";
import { datasetForSex } from "@/lib/anatomy/bodySex";

/** The commercially usable manifests. */
const manifest = [...zManifest, ...open3dManifest, ...femaleManifest];

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
    expect(Object.keys(meshMap)).toHaveLength(
      manifest.length +
        (INCLUDE_NON_COMMERCIAL ? nonCommercialManifest.length : 0),
    );
  });

  it("adds the Open3DModel pieces with their own attribution", () => {
    for (const id of [
      "lateral-cord-of-brachial-plexus-left",
      "medial-cord-of-brachial-plexus-right",
      "psoas-minor-right",
      "inferior-gluteal-nerve-left",
      "lumbosacral-trunk-right",
    ]) {
      const structure = registry.get(id);
      expect(structure, id).toBeDefined();
      expect(structure?.modelSource).toBe("Open3DModel");
      expect(structure?.sourceLicense).toBe("CC BY-SA");
    }
    expect(registry.get("lateral-cord-of-brachial-plexus-left")?.region).toBe(
      "upper-limb",
    );
    expect(registry.get("lumbosacral-trunk-left")?.region).not.toBe(
      "upper-limb",
    );
    expect(registry.get("femur-left")?.modelSource).toBe("Z-Anatomy");
  });

  it("adds no Open3DModel piece that duplicates a Z-Anatomy one", () => {
    const zNames = new Set(zManifest.map((entry) => entry.name));
    expect(open3dManifest.filter((e) => zNames.has(e.name))).toEqual([]);
    for (const e of open3dManifest) expect(e.pack).toBe("extras");
  });

  it("keeps every non-commercial mesh in its own file, with its source", () => {
    for (const e of nonCommercialManifest)
      expect(e.pack, e.name).toBe("non-commercial");
    for (const e of nonCommercialManifest as ManifestEntry[])
      expect(e.source && MODEL_SOURCES[e.source].commercialUse, e.name).toBe(
        false,
      );
    for (const e of manifest as ManifestEntry[])
      expect(MODEL_SOURCES[e.source ?? "Z-Anatomy"].commercialUse).toBe(true);
  });

  it("adds the inner ear and kidney, credited, while non-commercial models are on", () => {
    const withNc = createZAnatomyDataset({ nonCommercial: true });
    const kidney = withNc.structures.find((s) => s.id === "kidney-left");
    expect(kidney?.region).toBe("abdomen");
    expect(kidney?.sourceLicense).toBe("CC BY-NC 4.0");
    expect(
      withNc.structures.find((s) => s.id === "cochlea-right")?.sourceLicense,
    ).toBe("CC BY-NC-SA 4.0");
    expect(withNc.info.attribution).toContain("lissiecowley");
    expect(withNc.info.models.map((m) => m.id)).toContain("non-commercial");
  });

  it("leaves every non-commercial model out with one switch", () => {
    const commercial = createZAnatomyDataset({ nonCommercial: false });
    const ncSources = Object.entries(MODEL_SOURCES)
      .filter(([, source]) => !source.commercialUse)
      .map(([id]) => id);
    expect(ncSources.length).toBeGreaterThan(0);
    for (const s of commercial.structures)
      expect(ncSources, s.id).not.toContain(s.modelSource);
    expect(
      Object.keys(commercial.meshMap).filter((mesh) =>
        nonCommercialManifest.some((e) => e.name === mesh),
      ),
    ).toEqual([]);
    expect(commercial.info.models.map((m) => m.url).join()).not.toMatch(
      /non-commercial/,
    );
    expect(commercial.info.attribution).not.toMatch(/NC/);
    expect(commercial.info.credits).not.toMatch(/lissiecowley|Dundee/);
  });

  it("shows the female organs in the female body and the male ones in the male", () => {
    const female = datasetForSex(zAnatomyDataset, "female");
    const male = datasetForSex(zAnatomyDataset, "male");
    const ids = (d: typeof female) => new Set(d.structures.map((s) => s.id));
    for (const id of [
      "uterus",
      "ovary-left",
      "uterine-tube-right",
      "vagina",
      "breast-left",
    ]) {
      expect(ids(female).has(id), id).toBe(true);
      expect(ids(male).has(id), id).toBe(false);
    }
    for (const id of [
      "prostate",
      "testis-left",
      "penis",
      "urethra",
      "testicular-artery-left",
    ]) {
      expect(ids(male).has(id), id).toBe(true);
      expect(ids(female).has(id), id).toBe(false);
    }
    // One bladder in both bodies: the male mesh, or the female bladder's parts.
    expect(ids(female).has("urinary-bladder")).toBe(true);
    expect(ids(male).has("urinary-bladder")).toBe(true);
    expect(male.meshMap["Urinary bladder"]).toBe("urinary-bladder");
    expect(female.meshMap["Urinary bladder"]).toBeUndefined();
    expect(female.partMeshMap?.["Trigone of urinary bladder"]).toBe(
      "trigone-of-urinary-bladder",
    );
    expect(male.partMeshMap?.["Trigone of urinary bladder"]).toBeUndefined();
    expect(female.info.models.map((m) => m.id)).toContain("female");
    expect(male.info.models.map((m) => m.id)).not.toContain("female");
  });

  it("places the female organs in the pelvis and the breasts on the chest", () => {
    const region = (id: string) => registry.get(id)?.region;
    expect(region("uterus")).toBe("pelvis");
    expect(region("ovary-left")).toBe("pelvis");
    expect(region("breast-right")).toBe("thorax");
    expect(registry.get("uterus")?.sourceLicense).toBe("CC BY 4.0");
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

  it("keeps the non-commercially licensed models out of the other files", () => {
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

  it("leaves coverings out but keeps structures named like them", () => {
    const names = manifest.map((entry) => entry.name);
    // Coverings (fasciae, bursae, meninges…) would hide what is inside.
    expect(names.filter((n) => /^Fascia lata|^Spinal dura/.test(n))).toEqual(
      [],
    );
    // …but a muscle, arteries and a brain part only share a word with them.
    for (const kept of [
      "Tensor fasciae latae.l",
      "Middle meningeal artery.r",
      "Septum pellucidum",
    ])
      expect(names).toContain(kept);
  });

  it("places organs by region", () => {
    const region = (id: string) => registry.get(id)?.region;
    expect(region("liver")).toBe("abdomen");
    expect(region("stomach")).toBe("abdomen");
    expect(region("ventricle-left")).toBe("thorax"); // "Left ventricle"
    expect(region("urinary-bladder")).toBe("pelvis");
    expect(region("thyroid-gland")).toBe("neck");
  });

  it("keeps pelvic veins out of the thorax (the source's collection lists them there)", () => {
    const region = (id: string) => registry.get(id)?.region;
    expect(region("internal-iliac-vein-left")).toBe("pelvis");
    expect(region("deep-dorsal-vein-of-penis")).toBe("pelvis");
    expect(region("azygos-vein")).toBe("thorax");
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
