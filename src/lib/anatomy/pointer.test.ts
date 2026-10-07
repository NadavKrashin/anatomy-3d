import { describe, expect, it } from "vitest";
import { DRAG_THRESHOLD_PX, isTap } from "./pointer";

describe("isTap", () => {
  it("counts a still or slightly wobbling press as a tap", () => {
    expect(isTap(0)).toBe(true);
    expect(isTap(DRAG_THRESHOLD_PX)).toBe(true);
  });

  it("treats a drag that turned the camera as no tap", () => {
    expect(isTap(DRAG_THRESHOLD_PX + 1)).toBe(false);
    expect(isTap(120)).toBe(false);
  });
});
