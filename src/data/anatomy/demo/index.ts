import type { AnatomyDataset, MeshMap } from "@/types/anatomy";
import meshMap from "./meshMap.json";
import { demoStructures } from "./structures";

export const demoDataset: AnatomyDataset = {
  info: {
    id: "demo",
    models: [{ id: "demo", url: "/models/anatomy-demo.glb" }],
    isDemo: true,
  },
  structures: demoStructures,
  meshMap: meshMap satisfies MeshMap,
};
