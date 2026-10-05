// @vitest-environment jsdom
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useViewerStore } from "@/store/viewerStore";
import { LayerControls, PeelModeHint } from "./LayerControls";

describe("<LayerControls>", () => {
  it("toggles peel mode, shows the hint, then offers to restore", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <LayerControls showLabel />
        <PeelModeHint />
      </>,
    );
    const toggle = screen.getByRole("button", { name: "Tap to peel" });
    await user.click(toggle);
    expect(useViewerStore.getState().peelMode).toBe(true);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Tap a structure to peel it away")).toBeTruthy();

    // A tap on the model while in peel mode.
    act(() => useViewerStore.getState().pick("deltoid"));
    await user.click(screen.getByRole("button", { name: "Restore (1)" }));
    expect(useViewerStore.getState().hiddenStructureIds.size).toBe(0);
  });

  it("is not offered while isolating", () => {
    renderWithProviders(<LayerControls />);
    act(() => useViewerStore.getState().isolate("heart"));
    expect(screen.queryByRole("button")).toBeNull();
  });
});
