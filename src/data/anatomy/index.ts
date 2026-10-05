import type { AnatomyDataset } from "@/types/anatomy";
import { zAnatomyDataset } from "./z-anatomy";

/**
 * The dataset the app runs on: real Z-Anatomy upper-limb anatomy. The
 * placeholder demo dataset (./demo) remains for tests and as a template.
 */
export const activeDataset: AnatomyDataset = zAnatomyDataset;
