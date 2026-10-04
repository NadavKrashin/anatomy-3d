import type { AnatomyDataset } from "@/types/anatomy";
import { demoDataset } from "./demo";

/**
 * The dataset the app runs on. Swapping in a real model means adding a new
 * dataset folder (structures + mesh map + GLB) and pointing this at it.
 */
export const activeDataset: AnatomyDataset = demoDataset;
