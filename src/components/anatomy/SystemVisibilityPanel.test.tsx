// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useViewerStore } from "@/store/viewerStore";
import { SystemVisibilityPanel } from "./SystemVisibilityPanel";

describe("<SystemVisibilityPanel>", () => {
  it("lists only systems present in the dataset", () => {
    renderWithProviders(<SystemVisibilityPanel />);
    expect(
      screen
        .getAllByRole("switch")
        .map((s) => s.textContent?.replace(/\d+$/, "")),
    ).toEqual([
      "Skeletal",
      "Muscular",
      "Nervous",
      "Cardiovascular",
      "Respiratory",
      "Digestive",
    ]);
  });

  it("toggles a system's visibility", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SystemVisibilityPanel />);
    const skeletal = screen.getByRole("switch", { name: /Skeletal/ });

    await user.click(skeletal);
    expect(skeletal).toHaveAttribute("aria-checked", "false");
    expect(useViewerStore.getState().hiddenSystems.has("skeletal")).toBe(true);
  });
});
