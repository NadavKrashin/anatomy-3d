import { describe, expect, it } from "vitest";
import type { AnatomicalStructure, AnatomyDataset } from "@/types/anatomy";
import { datasetForSex } from "./bodySex";

const structure = (
  id: string,
  sex?: AnatomicalStructure["sex"],
): AnatomicalStructure => ({
  id,
  names: { en: { text: id, verified: false } },
  aliases: {},
  system: "reproductive",
  region: "pelvis",
  tags: [],
  ...(sex ? { sex } : {}),
});

const dataset: AnatomyDataset = {
  info: {
    id: "test",
    isDemo: true,
    models: [
      { id: "body", url: "/body.glb" },
      { id: "female", url: "/female.glb", sex: "female" },
    ],
  },
  structures: [
    structure("bladder"),
    structure("trigone", "female"),
    structure("prostate", "male"),
    structure("uterus", "female"),
  ],
  meshMap: {
    Bladder: "bladder",
    Trigone: "bladder",
    Prostate: "prostate",
    Uterus: "uterus",
  },
  partMeshMap: { Trigone: "trigone" },
  meshSex: {
    Bladder: "male",
    Trigone: "female",
    Prostate: "male",
    Uterus: "female",
  },
};

describe("datasetForSex", () => {
  it("keeps one body's structures, meshes and model files", () => {
    const female = datasetForSex(dataset, "female");
    expect(female.structures.map((s) => s.id)).toEqual([
      "bladder",
      "trigone",
      "uterus",
    ]);
    expect(female.meshMap).toEqual({ Trigone: "bladder", Uterus: "uterus" });
    expect(female.partMeshMap).toEqual({ Trigone: "trigone" });
    expect(female.info.models.map((m) => m.id)).toEqual(["body", "female"]);

    const male = datasetForSex(dataset, "male");
    expect(male.structures.map((s) => s.id)).toEqual(["bladder", "prostate"]);
    expect(male.meshMap).toEqual({ Bladder: "bladder", Prostate: "prostate" });
    expect(male.partMeshMap).toEqual({});
    expect(male.info.models.map((m) => m.id)).toEqual(["body"]);
  });

  it("returns a dataset without sex-specific content unchanged", () => {
    const plain: AnatomyDataset = {
      ...dataset,
      structures: [structure("bladder")],
      meshMap: { Bladder: "bladder" },
      meshSex: undefined,
    };
    expect(datasetForSex(plain, "female")).toBe(plain);
  });

  it("leaves out study notes about the other body", () => {
    const note = (term: string, sex?: "male" | "female") => ({
      text: term,
      language: "he" as const,
      term,
      section: "x",
      ...(sex ? { sex } : {}),
    });
    const urethra: AnatomicalStructure = {
      ...structure("urethra"),
      studyNotes: [
        note("Urethra"),
        note("Prostatic urethra", "male"),
        note("Vesicouterine pouch", "female"),
      ],
    };
    const plain: AnatomyDataset = {
      ...dataset,
      structures: [urethra],
      meshMap: {},
      meshSex: undefined,
    };
    const terms = (sex: "male" | "female") =>
      datasetForSex(plain, sex).structures[0]?.studyNotes?.map((n) => n.term);
    expect(terms("male")).toEqual(["Urethra", "Prostatic urethra"]);
    expect(terms("female")).toEqual(["Urethra", "Vesicouterine pouch"]);
  });
});
