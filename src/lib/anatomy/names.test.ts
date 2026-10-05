import { describe, expect, it } from "vitest";
import { demoDataset } from "@/data/anatomy/demo";
import { resolveDisplayNames, resolveName } from "./names";

const get = (id: string) => {
  const structure = demoDataset.structures.find((s) => s.id === id);
  if (!structure) throw new Error(id);
  return structure;
};

describe("structure names", () => {
  it("appends a side label in the term's language", () => {
    expect(resolveName(get("biceps-brachii-left"), "en").text).toBe(
      "Biceps brachii (left)",
    );
    expect(resolveName(get("humerus-right"), "he").text).toBe(
      "עצם הזרוע (ימין)",
    );
    expect(resolveName(get("heart"), "en").text).toBe("Heart");
  });

  it("falls back to English when a language is missing", () => {
    const structure = {
      ...get("heart"),
      names: { en: { text: "Heart", verified: false } },
    };
    expect(resolveName(structure, "he")).toMatchObject({
      text: "Heart",
      language: "en",
    });
  });

  it("does not repeat a name as its own secondary", () => {
    const structure = {
      ...get("heart"),
      names: { en: { text: "Heart", verified: false } },
    };
    expect(
      resolveDisplayNames(structure, { primary: "en", secondary: "he" })
        .secondary,
    ).toBeNull();
  });
});
