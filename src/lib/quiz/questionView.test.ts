import { describe, expect, it } from "vitest";
import { demoDataset } from "@/data/anatomy/demo";
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
