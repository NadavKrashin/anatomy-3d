// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { AnatomicalStructure } from "@/types/anatomy";
import { StructureNotes } from "./StructureNotes";

const ring: AnatomicalStructure = {
  id: "deep-inguinal-ring-left",
  names: { en: { text: "Deep inguinal ring", verified: false } },
  aliases: {},
  system: "other",
  region: "abdomen",
  side: "left",
  tags: [],
  studyNotes: [
    {
      text: "פתח בפאסיה הרוחבית.",
      language: "he",
      term: "Deep inguinal ring",
      section: "דופן הבטן",
    },
    {
      text: "פתחי התעלה המפשעתית.",
      language: "he",
      term: "Superficial & Deep inguinal ring",
      section: "דופן הבטן",
      shared: true,
    },
  ],
};

describe("<StructureNotes>", () => {
  it("shows her notes right-to-left under a summary heading", () => {
    renderWithProviders(<StructureNotes structure={ring} />, { locale: "he" });
    expect(screen.getByRole("heading", { name: "סיכום" })).toBeDefined();
    const note = screen.getByText("פתח בפאסיה הרוחבית.");
    expect(note.getAttribute("dir")).toBe("rtl");
    expect(note.getAttribute("lang")).toBe("he");
  });

  it("names the entry only when it is about more than this structure", () => {
    renderWithProviders(<StructureNotes structure={ring} />);
    expect(screen.getByText("Superficial & Deep inguinal ring")).toBeDefined();
    expect(screen.queryByText("Deep inguinal ring")).toBeNull();
  });

  it("renders nothing without notes", () => {
    const { container } = renderWithProviders(
      <StructureNotes structure={{ ...ring, studyNotes: [] }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
