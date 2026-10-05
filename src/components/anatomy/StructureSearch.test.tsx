// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useViewerStore } from "@/store/viewerStore";
import { StructureSearch } from "./StructureSearch";

describe("<StructureSearch>", () => {
  it("finds a structure by its Hebrew name and selects + focuses it on Enter", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StructureSearch />);

    await user.type(screen.getByRole("combobox"), "עצב החישור");
    expect(screen.getAllByRole("option")[0]).toHaveTextContent("Radial nerve");

    await user.keyboard("{Enter}");
    const state = useViewerStore.getState();
    expect(state.selectedStructureId).toBe("radial-nerve-left");
    expect(state.cameraCommand).toMatchObject({
      type: "focus",
      structureId: "radial-nerve-left",
    });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("moves the active option with the arrow keys", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StructureSearch />);

    await user.type(screen.getByRole("combobox"), "biceps");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(useViewerStore.getState().selectedStructureId).toMatch(
      /^biceps-brachii-/,
    );
  });

  it("reveals a hidden structure when it is chosen", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StructureSearch />);
    useViewerStore.getState().hide("heart");
    useViewerStore.getState().toggleSystem("cardiovascular");

    await user.type(screen.getByRole("combobox"), "heart");
    await user.keyboard("{Enter}");
    const state = useViewerStore.getState();
    expect(state.hiddenStructureIds.has("heart")).toBe(false);
    expect(state.hiddenSystems.has("cardiovascular")).toBe(false);
  });

  it("says when nothing matches", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StructureSearch />);
    await user.type(screen.getByRole("combobox"), "zzzzqqq");
    expect(screen.getByText("No structures found")).toBeDefined();
  });
});
