// @vitest-environment jsdom
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { zAnatomyUpperLimbDataset } from "@/data/anatomy/z-anatomy";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useViewerStore } from "@/store/viewerStore";
import { StructureInfoPanel } from "../StructureInfoPanel";

describe("<StructureRelations> (in the info panel)", () => {
  it("lists a muscle's parts and navigates part → whole", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StructureInfoPanel />, {
      dataset: zAnatomyUpperLimbDataset,
    });
    act(() => useViewerStore.getState().select("biceps-brachii-muscle-left"));

    const parts = screen.getByRole("heading", { name: "Parts" })
      .nextElementSibling as HTMLElement;
    expect(
      within(parts)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual([
      "Long head of biceps brachii (left)",
      "Short head of biceps brachii (left)",
    ]);

    await user.click(within(parts).getByRole("button", { name: /Long head/ }));
    expect(useViewerStore.getState().selectedStructureId).toBe(
      "long-head-of-biceps-brachii-left",
    );
    await user.click(
      screen.getByRole("button", { name: /^Biceps brachii muscle \(left\)/ }),
    );
    expect(useViewerStore.getState().selectedStructureId).toBe(
      "biceps-brachii-muscle-left",
    );
  });

  it("shows nothing for a structure without parts", () => {
    renderWithProviders(<StructureInfoPanel />, {
      dataset: zAnatomyUpperLimbDataset,
    });
    act(() => useViewerStore.getState().select("humerus-left"));
    expect(screen.queryByRole("heading", { name: /Parts|Part of/ })).toBeNull();
  });
});
