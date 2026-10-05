import { describe, expect, it } from "vitest";
import { zAnatomyUpperLimbDataset as dataset } from "@/data/anatomy/z-anatomy";
import { createRegistry } from "./registry";
import { attachmentsFor, summarizeAttachments } from "./attachments";

const registry = createRegistry(dataset.structures);
const items = dataset.attachments?.items ?? [];
const rows = (id: string, perspective: "muscle" | "bone") =>
  summarizeAttachments(attachmentsFor(id, registry, items), perspective);

describe("muscle attachments", () => {
  it("a muscle shows its own and its parts' patches as bones per kind", () => {
    expect(rows("biceps-brachii-muscle-left", "muscle")).toEqual([
      { kind: "origin", structureIds: ["scapula-left"] },
      { kind: "insertion", structureIds: ["radius-left"] },
    ]);
  });

  it("a part also shows the whole muscle's shared patches", () => {
    const ids = attachmentsFor(
      "lateral-head-of-triceps-brachii-left",
      registry,
      items,
    ).map((a) => a.structureId);
    expect(new Set(ids)).toEqual(
      new Set([
        "lateral-head-of-triceps-brachii-left",
        "triceps-brachii-muscle-left",
      ]),
    );
  });

  it("a bone lists the muscles attached to it", () => {
    const origins = rows("humerus-left", "bone").find(
      (r) => r.kind === "origin",
    );
    expect(origins?.structureIds).toContain("brachialis-muscle-left");
  });

  it("muscles under review are never labelled origin or insertion", () => {
    expect(
      rows("serratus-anterior-muscle-left", "muscle").map((r) => r.kind),
    ).toEqual(["attachment"]);
  });

  it("every patch names a known muscle and a known bone", () => {
    expect(items.length).toBeGreaterThan(200);
    for (const item of items) {
      expect(registry.has(item.structureId)).toBe(true);
      expect(item.boneId && registry.get(item.boneId)?.system).toBe("skeletal");
    }
  });
});
