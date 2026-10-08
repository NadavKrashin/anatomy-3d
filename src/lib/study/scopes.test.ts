import { describe, expect, it } from "vitest";
import { demoDataset } from "@/data/anatomy/demo";
import { createRegistry } from "@/lib/anatomy/registry";
import {
  builtInScopes,
  DISTINCTIONS_SCOPE_ID,
  findScope,
  summaryScopes,
  WHOLE_BODY_SCOPE_ID,
} from "./scopes";

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
    expect(ids.filter((id) => id.endsWith(":other"))).toEqual([]);
  });

  it("region scopes contain exactly that region's structures", () => {
    expect(findScope(scopes, "region:thorax")?.structureIds.sort()).toEqual([
      "heart",
      "lung-left",
      "lung-right",
    ]);
  });
});

describe("summaryScopes", () => {
  const note = (section: string) => ({
    text: "x",
    language: "he" as const,
    term: "x",
    section,
  });
  const many = (prefix: string, section: string, n: number) =>
    Array.from({ length: n }, (_, i) => ({
      ...demoDataset.structures[0]!,
      id: `${prefix}-${i}`,
      studyNotes: [note(section)],
    }));
  const registry = createRegistry([
    ...many("arm", "גפה עליונה", 4),
    ...many("hand", "השלמות גפה עליונה", 2),
    ...many("joint", "השלמות מפרקים", 5),
    ...many("skin", "השלמות עור ורקמות", 1),
  ]);
  const scopes = summaryScopes(
    registry,
    ["גפה עליונה", "השלמות גפה עליונה", "השלמות מפרקים", "השלמות עור ורקמות"],
    { heading: "הבחנות חשובות ללימוד", structureIds: ["arm-0"] },
  );

  it("puts her distinctions first, then her sections in her order", () => {
    expect(scopes.map((s) => s.id)).toEqual([
      DISTINCTIONS_SCOPE_ID,
      "summary:גפה עליונה",
      "summary:השלמות מפרקים",
    ]);
  });

  it("joins a supplement to its section and drops sections too small to quiz", () => {
    expect(scopes[1]?.structureIds).toHaveLength(6);
    expect(scopes.some((s) => s.id.includes("עור"))).toBe(false);
  });
});
