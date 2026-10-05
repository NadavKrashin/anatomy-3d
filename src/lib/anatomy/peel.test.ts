import { describe, expect, it } from "vitest";
import { demoStructures } from "@/data/anatomy/demo/structures";
import {
  countFrontPixels,
  decodePixel,
  encodeIndex,
  isPeelable,
  outerLayer,
} from "./peel";

function buffer(indices: number[]): Uint8Array {
  const pixels = new Uint8Array(indices.length * 4);
  indices.forEach((index, i) => {
    pixels.set([...encodeIndex(index), 255], i * 4);
  });
  return pixels;
}

describe("layer peeling", () => {
  it("round-trips indices through RGB", () => {
    for (const index of [0, 1, 255, 256, 610, 70_000]) {
      expect(decodePixel(...encodeIndex(index))).toBe(index);
    }
  });

  it("counts front pixels per structure, skipping background and unknown indices", () => {
    const ids = ["", "deltoid", "deltoid", "biceps"]; // two meshes for the deltoid
    const counts = countFrontPixels(
      buffer([0, 1, 2, 2, 3, 0, 9]),
      (i) => ids[i] || undefined,
    );
    expect(Object.fromEntries(counts)).toEqual({ deltoid: 3, biceps: 1 });
  });

  it("the outer layer drops slivers and unpeelable structures", () => {
    const counts = new Map([
      ["deltoid", 40],
      ["cephalic-vein", 5],
      ["humerus", 300],
      ["sliver", 2],
    ]);
    expect(outerLayer(counts, (id) => id !== "humerus")).toEqual([
      "cephalic-vein",
      "deltoid",
    ]);
  });

  it("bones are never peeled", () => {
    expect(isPeelable({ ...anyStructure(), system: "skeletal" })).toBe(false);
    expect(isPeelable({ ...anyStructure(), system: "muscular" })).toBe(true);
  });
});

function anyStructure() {
  const structure = demoStructures[0];
  if (!structure) throw new Error("demo dataset is empty");
  return structure;
}
