import type { AnatomyDataset, BodySex, MeshMap } from "@/types/anatomy";

export const DEFAULT_BODY_SEX: BodySex = "male";

/**
 * The dataset as one body shows it: structures, meshes and model files of
 * the other body are left out, so the registry, search, legend counts and
 * quizzes only know what is on screen.
 */
export function datasetForSex(
  dataset: AnatomyDataset,
  sex: BodySex,
): AnatomyDataset {
  const meshSex = dataset.meshSex;
  if (!meshSex && !dataset.structures.some((s) => s.sex)) return dataset;
  const keep = (map: MeshMap): MeshMap =>
    Object.fromEntries(
      Object.entries(map).filter(([mesh]) => (meshSex?.[mesh] ?? sex) === sex),
    );
  return {
    ...dataset,
    info: {
      ...dataset.info,
      models: dataset.info.models.filter((m) => (m.sex ?? sex) === sex),
    },
    structures: dataset.structures.filter((s) => (s.sex ?? sex) === sex),
    meshMap: keep(dataset.meshMap),
    ...(dataset.partMeshMap ? { partMeshMap: keep(dataset.partMeshMap) } : {}),
  };
}
