import { describe, expect, it } from "vitest";
import { demoDataset } from "@/data/anatomy/demo";
import { createRegistry } from "./registry";

describe("anatomy registry", () => {
  const registry = createRegistry(demoDataset.structures);

  it("looks structures up by id", () => {
    expect(registry.get("median-nerve-left")?.names.en.text).toBe(
      "Median nerve",
    );
    expect(registry.get("does-not-exist")).toBeUndefined();
  });

  it("lists only systems that have structures, in canonical order", () => {
    expect(registry.presentSystems()).toEqual([
      "skeletal",
      "muscular",
      "nervous",
      "cardiovascular",
      "respiratory",
      "digestive",
    ]);
  });

  it("rejects duplicate ids", () => {
    const [first] = demoDataset.structures;
    expect(() => createRegistry([first!, first!])).toThrow(/Duplicate/);
  });
});
