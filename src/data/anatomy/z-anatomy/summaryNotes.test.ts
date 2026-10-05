import { describe, expect, it } from "vitest";
import type { AnatomicalStructure } from "@/types/anatomy";
import { zAnatomyDataset } from "./index";
import { withSummaryNotes, type SummaryEntry } from "./summaryNotes";

const ureter = (side: "left" | "right"): AnatomicalStructure => ({
  id: `ureter-${side}`,
  names: {
    en: { text: "Ureter", verified: false },
    he: { text: "צינור הכליה", verified: false },
  },
  aliases: {},
  system: "urinary",
  region: "abdomen",
  side,
  bilateralGroupId: "ureter",
  tags: [],
});

const summary: Record<string, SummaryEntry> = {
  ureter: {
    notes: [
      { text: "מוביל שתן לשלפוחית.", section: "מערכת השתן", term: "Ureters" },
    ],
    he: "שופכן",
    heHeading: "השופכנים",
  },
  "ureter-left": {
    notes: [{ text: "הערה לצד שמאל.", section: "x", term: "Left ureter" }],
  },
};

describe("withSummaryNotes", () => {
  it("adds her notes in Hebrew, with notes for one side on that side only", () => {
    const left = withSummaryNotes(ureter("left"), summary);
    const right = withSummaryNotes(ureter("right"), summary);
    expect(left.studyNotes?.map((n) => n.text)).toEqual([
      "מוביל שתן לשלפוחית.",
      "הערה לצד שמאל.",
    ]);
    expect(right.studyNotes).toHaveLength(1);
    expect(right.studyNotes?.[0]?.language).toBe("he");
  });

  it("shows her Hebrew name; the replaced name and her heading stay searchable", () => {
    const named = withSummaryNotes(ureter("left"), summary);
    expect(named.names.he?.text).toBe("שופכן");
    expect(named.aliases.he).toEqual(["צינור הכליה", "השופכנים"]);
  });

  it("leaves other structures alone", () => {
    const other = { ...ureter("left"), id: "x-left", bilateralGroupId: "x" };
    expect(withSummaryNotes(other, summary)).toBe(other);
  });
});

describe("her summary in the Z-Anatomy dataset", () => {
  const byId = new Map(zAnatomyDataset.structures.map((s) => [s.id, s]));

  it("gives structures her notes and Hebrew names", () => {
    expect(byId.get("liver")?.names.he?.text).toBe("כבד");
    expect(byId.get("trachea")?.names.he?.text).toBe("קנה הנשימה");
    expect(byId.get("median-nerve-left")?.studyNotes?.length).toBeGreaterThan(
      0,
    );
  });

  it("tells hand and foot muscles apart by the summary's region", () => {
    expect(
      byId.get("abductor-digiti-minimi-of-foot-left")?.studyNotes?.[0]?.section,
    ).toBe("גפה תחתונה");
  });
});
