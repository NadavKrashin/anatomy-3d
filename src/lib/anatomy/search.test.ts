import { describe, expect, it } from "vitest";
import { demoDataset } from "@/data/anatomy/demo";
import { createStructureSearch, normalizeSearchText } from "./search";

const ids = (results: { id: string }[]) => results.map((r) => r.id);

describe("normalizeSearchText", () => {
  it("normalizes Hebrew final letters, niqqud, quotes and the definite article", () => {
    expect(normalizeSearchText("הָעֶצֶב")).toBe(normalizeSearchText("עצב"));
    expect(normalizeSearchText("ריאה ימין")).toBe("ריאה ימינ");
    expect(normalizeSearchText("דו־ראשי")).toBe("דו ראשי");
    expect(normalizeSearchText("ע״ש")).toBe("עש");
  });

  it("normalizes case, hyphens and Latin diacritics", () => {
    expect(normalizeSearchText("  Biceps-Brachii ")).toBe("biceps brachii");
    expect(normalizeSearchText("Crâne")).toBe("crane");
  });
});

describe("structure search", () => {
  const search = createStructureSearch(demoDataset.structures);

  it("finds by English name", () => {
    expect(ids(search.search("median"))[0]).toBe("median-nerve-left");
  });

  it("returns both sides of a paired structure", () => {
    expect(ids(search.search("biceps")).slice(0, 2).sort()).toEqual([
      "biceps-brachii-left",
      "biceps-brachii-right",
    ]);
  });

  it("narrows by side words", () => {
    expect(ids(search.search("biceps right"))[0]).toBe("biceps-brachii-right");
  });

  it("finds by Hebrew name with or without the definite article", () => {
    expect(ids(search.search("עצב מדיאני"))[0]).toBe("median-nerve-left");
    expect(ids(search.search("עצם הגומד"))[0]).toMatch(/^ulna-/);
  });

  it("finds by Latin name", () => {
    expect(ids(search.search("nervus radialis"))[0]).toBe("radial-nerve-left");
  });

  it("tolerates small typos", () => {
    expect(ids(search.search("humerous"))).toContain("humerus-left");
  });

  it("returns nothing for an empty query", () => {
    expect(search.search("   ")).toEqual([]);
  });
});
