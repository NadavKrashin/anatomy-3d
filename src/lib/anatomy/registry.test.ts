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

describe("anatomy registry — parts", () => {
  const whole = demoDataset.structures[0];
  if (!whole) throw new Error("demo dataset is empty");
  const part = {
    ...whole,
    id: `${whole.id}-part`,
    parentId: whole.id,
  };
  const registry = createRegistry([...demoDataset.structures, part]);

  it("lists whole structures only, but looks parts up by id", () => {
    expect(registry.structures.some((s) => s.id === part.id)).toBe(false);
    expect(registry.bySystem(whole.system).some((s) => s.id === part.id)).toBe(
      false,
    );
    expect(registry.get(part.id)).toBe(part);
  });

  it("relates parts and wholes", () => {
    expect(registry.partsOf(whole.id)).toEqual([part]);
    expect(registry.wholeOf(part.id)).toBe(whole);
    expect(registry.wholeOf(whole.id)).toBe(whole);
  });
});
