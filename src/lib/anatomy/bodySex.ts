import type {
  AnatomicalStructure,
  AnatomyDataset,
  BodySex,
  MeshMap,
} from "@/types/anatomy";

export const DEFAULT_BODY_SEX: BodySex = "male";

/**
 * The dataset as one body shows it: structures, meshes and model files of
 * the other body are left out, so the registry, search, legend counts and
 * quizzes only know what is on screen. Study notes about the other body
 * (her "Prostatic urethra" on the shared urethra) are left out too.
 */
export function datasetForSex(
  dataset: AnatomyDataset,
  sex: BodySex,
): AnatomyDataset {
  const meshSex = dataset.meshSex;
  const forBody = (s: AnatomicalStructure): AnatomicalStructure =>
    s.studyNotes?.some((n) => n.sex && n.sex !== sex)
      ? {
          ...s,
          studyNotes: s.studyNotes.filter((n) => (n.sex ?? sex) === sex),
        }
      : s;
  const hasSexNotes = dataset.structures.some((s) =>
    s.studyNotes?.some((n) => n.sex),
  );
  if (!meshSex && !hasSexNotes && !dataset.structures.some((s) => s.sex))
    return dataset;
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
    structures: dataset.structures
      .filter((s) => (s.sex ?? sex) === sex)
      .map(forBody),
    meshMap: keep(dataset.meshMap),
    ...(dataset.partMeshMap ? { partMeshMap: keep(dataset.partMeshMap) } : {}),
  };
}
