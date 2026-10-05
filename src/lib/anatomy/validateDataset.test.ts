import { describe, expect, it } from "vitest";
import { activeDataset } from "@/data/anatomy";
import { demoDataset } from "@/data/anatomy/demo";
import type { AnatomicalStructure, AnatomyDataset } from "@/types/anatomy";
import { validateDataset } from "./validateDataset";

const structure = (
  overrides: Partial<AnatomicalStructure>,
): AnatomicalStructure => ({
  id: "thing",
  names: {
    en: { text: "Thing", verified: false },
    he: { text: "דבר", verified: false },
  },
  aliases: {},
  system: "other",
  region: "other",
  tags: [],
  ...overrides,
});

const dataset = (structures: AnatomicalStructure[]): AnatomyDataset => ({
  info: { id: "test", models: [{ id: "x", url: "/x.glb" }], isDemo: true },
  structures,
  meshMap: Object.fromEntries(structures.map((s) => [s.id, s.id])),
});

describe("validateDataset", () => {
  it("the shipped datasets have no errors", () => {
    expect(validateDataset(demoDataset)).toEqual([]);
    // The real dataset has warnings (Hebrew names not yet written) but no errors.
    expect(
      validateDataset(activeDataset).filter((i) => i.severity === "error"),
    ).toEqual([]);
  });

  it("flags non-kebab ids and empty names", () => {
    const issues = validateDataset(
      dataset([
        structure({
          id: "Bad_ID",
          names: { en: { text: " ", verified: false } },
        }),
      ]),
    );
    expect(issues.map((i) => i.message)).toEqual(
      expect.arrayContaining([
        "id must be kebab-case",
        "English name is empty",
        "missing Hebrew name",
      ]),
    );
  });

  it("requires paired structures to carry their side and group", () => {
    const issues = validateDataset(
      dataset([structure({ id: "arm", side: "left" })]),
    );
    expect(issues.map((i) => i.message)).toEqual(
      expect.arrayContaining([
        'id should end with "-left"',
        "paired structure needs a bilateralGroupId",
      ]),
    );
  });

  it("flags inconsistent bilateral groups", () => {
    const left = structure({
      id: "arm-left",
      side: "left",
      bilateralGroupId: "arm",
    });
    const right = structure({
      id: "arm-right",
      side: "right",
      bilateralGroupId: "arm",
      system: "muscular",
    });
    expect(
      validateDataset(dataset([left, right])).some((i) =>
        i.message.includes("mixes"),
      ),
    ).toBe(true);
  });

  it("reports duplicate ids", () => {
    expect(validateDataset(dataset([structure({}), structure({})]))).toEqual([
      {
        severity: "error",
        structureId: "thing",
        message: "duplicate structure id",
      },
    ]);
  });
});
