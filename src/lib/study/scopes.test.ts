import { describe, expect, it } from "vitest";
import { demoDataset } from "@/data/anatomy/demo";
import { createRegistry } from "@/lib/anatomy/registry";
import { builtInScopes, findScope, WHOLE_BODY_SCOPE_ID } from "./scopes";

const scopes = builtInScopes(createRegistry(demoDataset.structures));

describe("builtInScopes", () => {
  it("starts with the whole body containing every structure", () => {
    expect(scopes[0]).toMatchObject({ id: WHOLE_BODY_SCOPE_ID, kind: "all" });
    expect(scopes[0]?.structureIds).toHaveLength(demoDataset.structures.length);
  });

  it("creates region and system scopes only when they have structures", () => {
    const ids = scopes.map((s) => s.id);
    expect(ids).toContain("region:upper-limb");
    expect(ids).toContain("system:nervous");
    expect(ids).not.toContain("region:pelvis");
    expect(ids).not.toContain("system:urinary");
  });

  it("region scopes contain exactly that region's structures", () => {
    expect(findScope(scopes, "region:thorax")?.structureIds.sort()).toEqual([
      "heart",
      "lung-left",
      "lung-right",
    ]);
  });
});
