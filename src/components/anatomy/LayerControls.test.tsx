// @vitest-environment jsdom
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useViewerStore } from "@/store/viewerStore";
import { LayerControls } from "./LayerControls";

describe("<LayerControls>", () => {
  it("requests a peel, then offers to restore the peeled layers", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LayerControls showLabel />);
    expect(screen.queryByRole("button", { name: /Restore layer/ })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Peel layer" }));
    expect(useViewerStore.getState().peelRequest).toBe(1);

    // The 3D scene answers a request with the layer it found.
    act(() => useViewerStore.getState().applyPeel(["deltoid"]));
    await user.click(screen.getByRole("button", { name: "Restore layer (1)" }));
    expect(useViewerStore.getState().hiddenStructureIds.size).toBe(0);
  });

  it("is not offered while isolating", () => {
    renderWithProviders(<LayerControls />);
    act(() => useViewerStore.getState().isolate("heart"));
    expect(screen.queryByRole("button")).toBeNull();
  });
});
