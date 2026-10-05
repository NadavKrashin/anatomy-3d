import type { AnatomySystem } from "@/types/anatomy";

/** Swatch colours for the systems panel; roughly match the demo model palette. */
export const SYSTEM_COLORS: Record<AnatomySystem, string> = {
  skeletal: "#e6dac3",
  muscular: "#b4564c",
  nervous: "#e3c14e",
  cardiovascular: "#c43a3f",
  respiratory: "#d49c9a",
  digestive: "#9a5a3c",
  urinary: "#d1b04a",
  reproductive: "#c77d9b",
  lymphatic: "#7fb48a",
  endocrine: "#8f7cc4",
  integumentary: "#d9b29a",
  other: "#8a9099",
};
