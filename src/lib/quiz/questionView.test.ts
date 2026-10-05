import { describe, expect, it } from "vitest";
import { demoDataset } from "@/data/anatomy/demo";
import type { AnatomicalStructure } from "@/types/anatomy";
import { systemsToHideFor } from "./questionView";

const get = (id: string) => {
  const s = demoDataset.structures.find((x) => x.id === id);
  if (!s) throw new Error(id);
  return s;
};

describe("systemsToHideFor", () => {
  it("hides muscles for deep targets (nerves, vessels, bones)", () => {
    expect(systemsToHideFor(get("median-nerve-left"))).toEqual(["muscular"]);
    expect(systemsToHideFor(get("brachial-artery-left"))).toEqual(["muscular"]);
    expect(systemsToHideFor(get("humerus-left"))).toEqual(["muscular"]);
  });

  it("keeps everything visible for muscle targets", () => {
    expect(systemsToHideFor(get("biceps-brachii-left"))).toEqual([]);
  });
});

describe("systemsToHideFor — encased targets", () => {
  const structure = (
    system: AnatomicalStructure["system"],
    tags: string[],
  ) => ({
    ...get("humerus-left"),
    system,
    tags,
  });

  it("hides muscles and bones for organs, the brain and the heart", () => {
    expect(systemsToHideFor(structure("digestive", ["digestive"]))).toEqual([
      "muscular",
      "skeletal",
    ]);
    expect(systemsToHideFor(structure("nervous", ["brain"]))).toEqual([
      "muscular",
      "skeletal",
    ]);
    expect(systemsToHideFor(structure("cardiovascular", ["heart"]))).toEqual([
      "muscular",
      "skeletal",
    ]);
  });

  it("peripheral nerves and vessels only hide muscles", () => {
    expect(systemsToHideFor(structure("nervous", ["nerve"]))).toEqual([
      "muscular",
    ]);
  });
});
