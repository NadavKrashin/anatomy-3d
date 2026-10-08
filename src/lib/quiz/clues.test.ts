import { describe, expect, it } from "vitest";
import { SUMMARY_DISTINCTIONS } from "@/data/anatomy/z-anatomy/summaryDistinctions";
import { zAnatomyDataset } from "@/data/anatomy/z-anatomy";
import { datasetForSex } from "@/lib/anatomy/bodySex";
import type { AnatomicalStructure, StudyNote } from "@/types/anatomy";
import {
  distinctionClues,
  distinctionStructureIds,
  MASK,
  maskNames,
  summaryClues,
} from "./clues";

const note = (text: string, shared = false): StudyNote => ({
  text,
  language: "he",
  term: "Liver",
  section: "x",
  ...(shared ? { shared } : {}),
});

const structure = (
  id: string,
  extra: Partial<AnatomicalStructure> = {},
): AnatomicalStructure => ({
  id,
  names: { en: { text: id, verified: false } },
  aliases: {},
  system: "digestive",
  region: "abdomen",
  tags: [],
  ...extra,
});

describe("maskNames", () => {
  it("masks the structure's names, with Hebrew prefixes, whole words only", () => {
    expect(
      maskNames("הכבד הוא איבר מטבולי; Liver, כבדי", ["כבד", "liver"]),
    ).toBe(`${MASK} הוא איבר מטבולי; ${MASK}, כבדי`);
  });

  it("masks the longest name first", () => {
    expect(maskNames("צינור הזרע מוביל", ["צינור", "צינור הזרע"])).toBe(
      `${MASK} מוביל`,
    );
  });
});

describe("summaryClues", () => {
  const liver = structure("liver", {
    names: {
      en: { text: "Liver", verified: false },
      he: { text: "כבד", verified: false },
    },
    studyNotes: [
      note("הכבד הוא איבר מטבולי ומפריש מרה, בבטן הימנית העליונה."),
      note("קצר מדי"),
      note("הערה משותפת לכמה מבנים, ארוכה מספיק.", true),
    ],
  });
  const ureter = (side: "left" | "right") =>
    structure(`ureter-${side}`, {
      side,
      bilateralGroupId: "ureter",
      studyNotes: [note("צינור שרירי המוביל שתן מהכליה לשלפוחית.")],
    });

  it("uses her own notes, masked, and skips short and shared ones", () => {
    const clues = summaryClues([liver]).get("liver");
    expect(clues?.map((c) => c.text)).toEqual([
      `${MASK} הוא איבר מטבולי ומפריש מרה, בבטן הימנית העליונה.`,
    ]);
    expect(clues?.[0]?.answerIds).toEqual(["liver"]);
  });

  it("gives both sides of a pair the same clue, answered by either side", () => {
    const clues = summaryClues([ureter("left"), ureter("right")]);
    expect(clues.get("ureter-left")).toBe(clues.get("ureter-right"));
    expect(clues.get("ureter-left")?.[0]?.answerIds).toEqual([
      "ureter-left",
      "ureter-right",
    ]);
  });
});

describe("her distinctions", () => {
  const male = datasetForSex(zAnatomyDataset, "male").structures;
  const female = datasetForSex(zAnatomyDataset, "female").structures;

  it("name structures the model has, each with what it is told apart from", () => {
    const ids = new Set(
      male.flatMap((s) => [s.id, s.bilateralGroupId ?? s.id]),
    );
    for (const d of SUMMARY_DISTINCTIONS)
      for (const id of [d.answer, ...d.others])
        expect(ids.has(id), `${d.text} → ${id}`).toBe(true);
  });

  it("become clues with their pair as the wrong options", () => {
    const clues = distinctionClues(SUMMARY_DISTINCTIONS, male);
    const ureter = clues.get("ureter-left")?.[0];
    expect(ureter?.text).toBe("מחבר כליה לשלפוחית.");
    expect(ureter?.answerIds).toEqual(["ureter-left", "ureter-right"]);
    expect(ureter?.distractorIds).toEqual(["urethra"]);
    expect(clues.get("testis-left")?.[0]?.distractorIds).toEqual([
      "epididymis-left",
    ]);
  });

  it("leave out what the body doesn't have", () => {
    const ids = distinctionStructureIds(SUMMARY_DISTINCTIONS, female);
    expect(ids).not.toContain("testis-left");
    expect(ids).toContain("ureter-left");
    // Both halves of each pair: the rotator cuff muscles beside teres major.
    expect(ids).toContain("subscapularis-muscle-left");
  });
});
