import { describe, expect, it } from "vitest";
import type { AnatomySystem } from "@/types/anatomy";
import { getStructureVisibility, type VisibilityState } from "./visibility";

const state = (overrides: Partial<VisibilityState> = {}): VisibilityState => ({
  hiddenStructureIds: new Set<string>(),
  hiddenSystems: new Set<AnatomySystem>(),
  isolatedStructureId: null,
  ...overrides,
});

describe("getStructureVisibility", () => {
  it("is visible by default", () => {
    expect(getStructureVisibility("heart", "cardiovascular", state())).toBe(
      "visible",
    );
  });

  it("hides individually hidden structures and hidden systems", () => {
    expect(
      getStructureVisibility(
        "heart",
        "cardiovascular",
        state({ hiddenStructureIds: new Set(["heart"]) }),
      ),
    ).toBe("hidden");
    expect(
      getStructureVisibility(
        "heart",
        "cardiovascular",
        state({ hiddenSystems: new Set(["cardiovascular"]) }),
      ),
    ).toBe("hidden");
  });

  it("ghosts everything except the isolated structure", () => {
    const isolated = state({ isolatedStructureId: "heart" });
    expect(getStructureVisibility("heart", "cardiovascular", isolated)).toBe(
      "visible",
    );
    expect(getStructureVisibility("liver", "digestive", isolated)).toBe(
      "ghosted",
    );
  });

  it("keeps the isolated structure visible even if its system is hidden", () => {
    const s = state({
      isolatedStructureId: "heart",
      hiddenSystems: new Set(["cardiovascular"]),
    });
    expect(getStructureVisibility("heart", "cardiovascular", s)).toBe(
      "visible",
    );
  });

  it("keeps filtered-out structures hidden while isolating", () => {
    const s = state({
      isolatedStructureId: "heart",
      hiddenSystems: new Set(["digestive"]),
    });
    expect(getStructureVisibility("liver", "digestive", s)).toBe("hidden");
  });
});

describe("getStructureVisibility — parts of a whole", () => {
  const of = (s: VisibilityState, part: string) =>
    getStructureVisibility("biceps", "muscular", s, part);

  it("hiding the whole or the part hides the part's mesh", () => {
    expect(of(state({ hiddenStructureIds: new Set(["biceps"]) }), "long")).toBe(
      "hidden",
    );
    expect(of(state({ hiddenStructureIds: new Set(["long"]) }), "long")).toBe(
      "hidden",
    );
    expect(of(state({ hiddenStructureIds: new Set(["long"]) }), "short")).toBe(
      "visible",
    );
  });

  it("isolating a part ghosts the whole's other parts", () => {
    const isolatingLong = state({ isolatedStructureId: "long" });
    expect(of(isolatingLong, "long")).toBe("visible");
    expect(of(isolatingLong, "short")).toBe("ghosted");
    expect(of(state({ isolatedStructureId: "biceps" }), "short")).toBe(
      "visible",
    );
  });
});
