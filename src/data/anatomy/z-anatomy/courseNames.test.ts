import { describe, expect, it } from "vitest";
import type { AnatomicalStructure } from "@/types/anatomy";
import { withCourseName, type CourseName } from "./courseNames";
import { zAnatomyDataset } from "./index";

const structure = (
  overrides: Partial<AnatomicalStructure> = {},
): AnatomicalStructure => ({
  id: "biceps-brachii-muscle-left",
  names: {
    en: { text: "Biceps brachii muscle", verified: false },
    he: { text: "השריר הדו־ראשי של הזרוע", verified: false },
  },
  aliases: {},
  system: "muscular",
  region: "upper-limb",
  side: "left",
  bilateralGroupId: "biceps-brachii-muscle",
  tags: [],
  ...overrides,
});

const course: Record<string, CourseName> = {
  "biceps-brachii-muscle": {
    en: "Biceps brachii",
    source: "https://medintzfat.com/anatomy/lab1",
    aliases: ["Biceps"],
    he: "הַשְּׁרִיר הַדוּ-רֹאשִׁי",
    heSource: "https://medintzfat.com/anatomy/class6",
  },
  "biceps-brachii-muscle-left": { aliases: ["Left biceps"] },
};

describe("withCourseName", () => {
  it("shows the course's English and Hebrew names with their source", () => {
    const named = withCourseName(structure(), course);
    expect(named.names.en).toEqual({
      text: "Biceps brachii",
      verified: false,
      source: "https://medintzfat.com/anatomy/lab1",
    });
    expect(named.names.he?.text).toBe("הַשְּׁרִיר הַדוּ-רֹאשִׁי");
    expect(named.names.he?.source).toBe(
      "https://medintzfat.com/anatomy/class6",
    );
  });

  it("keeps the replaced names and the other wordings searchable", () => {
    const named = withCourseName(structure(), course);
    expect(named.aliases.en).toEqual([
      "Biceps brachii muscle",
      "Biceps",
      "Left biceps",
    ]);
    expect(named.aliases.he).toEqual(["השריר הדו־ראשי של הזרוע"]);
  });

  it("gives both sides the same name; side aliases stay on their side", () => {
    const right = withCourseName(
      structure({ id: "biceps-brachii-muscle-right", side: "right" }),
      course,
    );
    expect(right.names.en.text).toBe("Biceps brachii");
    expect(right.aliases.en).not.toContain("Left biceps");
  });

  it("drops Hebrew the course doesn't use when it names the structure in English only", () => {
    const named = withCourseName(structure(), {
      "biceps-brachii-muscle": { en: "Biceps brachii" },
    });
    expect(named.names.he).toBeUndefined();
    expect(named.aliases.he).toEqual(["השריר הדו־ראשי של הזרוע"]);
  });

  it("leaves structures the course doesn't name alone", () => {
    const other = structure({
      id: "humerus-left",
      bilateralGroupId: "humerus",
    });
    expect(withCourseName(other, course)).toBe(other);
  });
});

describe("course names in the Z-Anatomy dataset", () => {
  const byId = new Map(zAnatomyDataset.structures.map((s) => [s.id, s]));

  it("names structures as the course does", () => {
    expect(byId.get("biceps-brachii-muscle-left")?.names.en.text).toBe(
      "Biceps brachii",
    );
    expect(byId.get("oesophagus")?.names.en.text).toBe("Esophagus");
    expect(byId.get("ulnar-nerve-left")?.names.he?.text).toBe("העצב האולנרי");
  });

  it("gives every course name to one structure only", () => {
    const owners = new Map<string, Set<string>>();
    for (const s of zAnatomyDataset.structures) {
      if (!s.names.en.source?.startsWith("https://medintzfat.com/")) continue;
      const set = owners.get(s.names.en.text) ?? new Set<string>();
      set.add(s.bilateralGroupId ?? s.id);
      owners.set(s.names.en.text, set);
    }
    const shared = [...owners].filter(([, ids]) => ids.size > 1);
    expect(shared).toEqual([]);
  });
});
