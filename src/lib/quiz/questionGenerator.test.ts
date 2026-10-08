import { describe, expect, it } from "vitest";
import { demoDataset } from "@/data/anatomy/demo";
import { zAnatomyDataset } from "@/data/anatomy/z-anatomy";
import { createRegistry } from "@/lib/anatomy/registry";
import { builtInScopes, findScope } from "@/lib/study/scopes";
import { eligibleStructures } from "./eligibility";
import {
  generateQuiz,
  IDENTIFY_OPTION_COUNT,
  pickDistractors,
} from "./questionGenerator";
import { createRng, shuffle } from "./random";

const registry = createRegistry(demoDataset.structures);
const allIds = new Set(registry.structures.map((s) => s.id));
const scope = (id: string) => {
  const found = findScope(builtInScopes(registry), id);
  if (!found) throw new Error(`no scope ${id}`);
  return found;
};

describe("random helpers", () => {
  it("is deterministic for a seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("shuffle keeps every element", () => {
    const items = [1, 2, 3, 4, 5, 6];
    expect(shuffle(items, createRng(1)).sort()).toEqual(items);
  });
});

describe("eligibleStructures", () => {
  it("keeps only in-scope structures that are selectable in the model", () => {
    const upperLimb = scope("region:upper-limb");
    const selectable = new Set(["humerus-left", "median-nerve-left", "heart"]);
    expect(
      eligibleStructures(upperLimb, registry, selectable)
        .map((s) => s.id)
        .sort(),
    ).toEqual(["humerus-left", "median-nerve-left"]);
  });
});

describe("eligibleStructures — detail structures", () => {
  const detailed = createRegistry([
    ...demoDataset.structures,
    { ...demoDataset.structures[0]!, id: "tiny-branch", tags: ["detail"] },
  ]);
  const selectable = new Set(detailed.structures.map((s) => s.id));

  it("skips detail structures in built-in scopes", () => {
    const scope = {
      id: "all",
      kind: "all" as const,
      structureIds: ["heart", "tiny-branch"],
    };
    expect(
      eligibleStructures(scope, detailed, selectable).map((s) => s.id),
    ).toEqual(["heart"]);
  });

  it("keeps them in custom scopes the student chose", () => {
    const scope = {
      id: "c",
      kind: "custom" as const,
      name: "Mine",
      structureIds: ["heart", "tiny-branch"],
    };
    expect(
      eligibleStructures(scope, detailed, selectable).map((s) => s.id),
    ).toEqual(["heart", "tiny-branch"]);
  });
});

describe("generateQuiz", () => {
  const structures = eligibleStructures(
    scope("region:upper-limb"),
    registry,
    allIds,
  );

  it("asks about distinct in-scope structures, capped at the requested count", () => {
    const questions = generateQuiz({
      structures,
      mode: "find",
      count: 10,
      rng: createRng(7),
    });
    expect(questions).toHaveLength(10);
    const ids = questions.map((q) => q.structureId);
    expect(new Set(ids).size).toBe(10);
    for (const id of ids) expect(registry.get(id)?.region).toBe("upper-limb");
  });

  it("returns every structure when the scope is smaller than the count", () => {
    expect(
      generateQuiz({
        structures: structures.slice(0, 3),
        mode: "find",
        count: 10,
        rng: createRng(1),
      }),
    ).toHaveLength(3);
  });

  it("find questions accept the target structure", () => {
    const [question] = generateQuiz({
      structures,
      mode: "find",
      count: 1,
      rng: createRng(3),
    });
    expect(question).toMatchObject({
      type: "find",
      acceptedStructureIds: [question?.structureId],
    });
  });

  it("identify questions include the answer among distinct options", () => {
    const questions = generateQuiz({
      structures,
      distractorPool: registry.structures,
      mode: "identify",
      count: 5,
      rng: createRng(9),
    });
    for (const q of questions) {
      if (q.type !== "identify") throw new Error("expected identify");
      expect(q.optionIds).toContain(q.structureId);
      expect(q.optionIds).toHaveLength(IDENTIFY_OPTION_COUNT);
      expect(new Set(q.optionIds).size).toBe(IDENTIFY_OPTION_COUNT);
    }
  });

  it("mixed mode produces both question types", () => {
    const types = new Set(
      generateQuiz({
        structures,
        distractorPool: registry.structures,
        mode: "mixed",
        count: 12,
        rng: createRng(5),
      }).map((q) => q.type),
    );
    expect(types).toEqual(new Set(["find", "identify"]));
  });

  it("falls back to find when no distractor exists", () => {
    const [only] = structures;
    const [question] = generateQuiz({
      structures: [only!],
      mode: "identify",
      count: 1,
      rng: createRng(2),
    });
    expect(question?.type).toBe("find");
  });

  it("is reproducible with the same seed", () => {
    const run = () =>
      generateQuiz({ structures, mode: "mixed", count: 6, rng: createRng(99) });
    expect(run()).toEqual(run());
  });
});

describe("pickDistractors", () => {
  const radial = registry.get("radial-nerve-left")!;

  it("prefers structures from the same system and region", () => {
    const picks = pickDistractors(radial, registry.structures, 2, createRng(4))
      .map((s) => s.id)
      .sort();
    expect(picks).toEqual(["median-nerve-left", "ulnar-nerve-left"]);
  });

  it("never offers the other side of the target, or both sides of one pair", () => {
    const biceps = registry.get("biceps-brachii-left")!;
    for (let seed = 0; seed < 20; seed++) {
      const picks = pickDistractors(
        biceps,
        registry.structures,
        3,
        createRng(seed),
      );
      expect(picks.map((p) => p.id)).not.toContain("biceps-brachii-right");
      const groups = picks.map((p) => p.bilateralGroupId).filter(Boolean);
      expect(new Set(groups).size).toBe(groups.length);
    }
  });
});

describe("pickDistractors — parts of a whole", () => {
  const z = createRegistry(zAnatomyDataset.structures);
  const ventricle = z.get("ventricle-left")!;

  it("prefers other parts of the same organ", () => {
    const picks = pickDistractors(ventricle, z.all, 3, createRng(1));
    expect(picks.every((p) => p.parentId === "heart")).toBe(true);
  });

  it("never offers the target's own whole or its parts", () => {
    for (let seed = 0; seed < 20; seed++) {
      const ids = pickDistractors(ventricle, z.all, 3, createRng(seed)).map(
        (p) => p.id,
      );
      expect(ids).not.toContain("heart");
      const heart = z.get("heart")!;
      const forHeart = pickDistractors(heart, z.all, 3, createRng(seed));
      expect(forHeart.some((p) => p.parentId === "heart")).toBe(false);
    }
  });
});

describe("generateQuiz — summary mode", () => {
  const z = createRegistry(zAnatomyDataset.structures);
  const clue = (answerIds: string[], distractorIds?: string[]) => ({
    text: "תיאור ארוך מספיק של המבנה.",
    answerIds,
    ...(distractorIds ? { distractorIds } : {}),
  });
  const clues = new Map([
    ["ureter-left", [clue(["ureter-left", "ureter-right"], ["urethra"])]],
    ["ureter-right", [clue(["ureter-left", "ureter-right"], ["urethra"])]],
    ["liver", [clue(["liver"])]],
  ]);
  const structures = ["ureter-left", "ureter-right", "liver", "heart"].map(
    (id) => z.get(id)!,
  );
  const quiz = (seed: number) =>
    generateQuiz({
      structures,
      distractorPool: z.all,
      mode: "summary",
      count: 10,
      rng: createRng(seed),
      clues,
    });

  it("asks only structures with a clue, one question per pair", () => {
    for (let seed = 0; seed < 10; seed++) {
      const asked = quiz(seed).map((q) =>
        q.structureId.replace(/-(left|right)$/, ""),
      );
      expect(asked.sort()).toEqual(["liver", "ureter"]);
    }
  });

  it("finds by clue (either side counts) or chooses a name from the clue", () => {
    const questions = Array.from({ length: 10 }, (_, seed) =>
      quiz(seed),
    ).flat();
    const ureter = questions.filter((q) => q.structureId.startsWith("ureter"));
    const finds = ureter.filter((q) => q.type === "find");
    const describes = ureter.filter((q) => q.type === "describe");
    expect(finds.length).toBeGreaterThan(0);
    expect(describes.length).toBeGreaterThan(0);
    for (const q of finds) {
      expect(q.clue).toBe("תיאור ארוך מספיק של המבנה.");
      expect(q.acceptedStructureIds).toEqual(["ureter-left", "ureter-right"]);
    }
    // A distinction's options are fixed: the ureter or the urethra.
    for (const q of describes)
      expect(q.optionIds.sort()).toEqual([q.structureId, "urethra"].sort());
    const liver = questions.filter(
      (q) => q.type === "describe" && q.structureId === "liver",
    );
    for (const q of liver)
      expect(q.type === "describe" && q.optionIds).toHaveLength(
        IDENTIFY_OPTION_COUNT,
      );
  });

  it("asks nothing without clues", () => {
    expect(
      generateQuiz({
        structures,
        mode: "summary",
        count: 5,
        rng: createRng(1),
      }),
    ).toEqual([]);
  });
});
