import type { AnatomyRegion, AnatomySystem } from "./anatomy";

/**
 * A set of structures to explore or be quizzed on. Built-in scopes are derived
 * from metadata (region/system); custom scopes are user lists (e.g. "Exam 1").
 */
export type StudyScope =
  | { id: string; kind: "all"; structureIds: string[] }
  | {
      id: string;
      kind: "region";
      region: AnatomyRegion;
      structureIds: string[];
    }
  | {
      id: string;
      kind: "system";
      system: AnatomySystem;
      structureIds: string[];
    }
  | { id: string; kind: "custom"; name: string; structureIds: string[] };
