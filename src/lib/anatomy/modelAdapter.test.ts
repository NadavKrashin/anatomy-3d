import { describe, expect, it } from "vitest";
import { demoDataset } from "@/data/anatomy/demo";
import { createMeshMapAdapter, findMeshMapIssues } from "./modelAdapter";
import { getSourceName } from "./meshNames";
import { createRegistry } from "./registry";

describe("mesh map model adapter", () => {
  const registry = createRegistry(demoDataset.structures);
  const adapter = createMeshMapAdapter(registry, {
    Biceps_Brachii_L: "biceps-brachii-left",
    "Biceps_Brachii_L-part2": "biceps-brachii-left",
  });

  it("maps a raw mesh name to a normalized structure", () => {
    expect(adapter.getStructureForMesh("Biceps_Brachii_L")?.id).toBe(
      "biceps-brachii-left",
    );
  });

  it("ignores Blender duplicate suffixes", () => {
    expect(adapter.getStructureForMesh("Biceps_Brachii_L.001")?.id).toBe(
      "biceps-brachii-left",
    );
  });

  it("returns undefined for unmapped meshes", () => {
    expect(adapter.getStructureForMesh("Mystery_Mesh")).toBeUndefined();
  });

  it("lists every mesh that belongs to a structure", () => {
    expect(adapter.getMeshesForStructure("biceps-brachii-left")).toEqual([
      "Biceps_Brachii_L",
      "Biceps_Brachii_L-part2",
    ]);
    expect(adapter.getMeshesForStructure("liver")).toEqual([]);
  });

  it("the demo mesh map is complete and consistent", () => {
    expect(findMeshMapIssues(registry, demoDataset.meshMap)).toEqual({
      unknownStructureIds: [],
      unmappedStructureIds: [],
    });
  });

  it("reports ids missing from the registry", () => {
    const issues = findMeshMapIssues(registry, { X: "not-a-structure" });
    expect(issues.unknownStructureIds).toEqual(["not-a-structure"]);
  });
});

describe("getSourceName", () => {
  it("prefers the original glTF name that GLTFLoader keeps in userData", () => {
    expect(
      getSourceName({
        name: "Biceps_Brachii_L001",
        userData: { name: "Biceps_Brachii_L.001" },
        parent: null,
      }),
    ).toBe("Biceps_Brachii_L.001");
    expect(
      getSourceName({ name: "demo_heart", userData: {}, parent: null }),
    ).toBe("demo_heart");
  });
});
