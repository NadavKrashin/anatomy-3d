/**
 * Validates the active dataset: metadata quality (shared with the unit tests)
 * plus a cross-check of its mesh map against the actual model file.
 *
 *   npm run anatomy:validate
 *
 * Exits non-zero on errors; warnings are printed but don't fail.
 */
import { resolve } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { activeDataset } from "../../src/data/anatomy";
import { stripDuplicateSuffix } from "../../src/lib/anatomy/meshNames";
import {
  validateDataset,
  type DatasetIssue,
} from "../../src/lib/anatomy/validateDataset";

async function modelIssues(): Promise<DatasetIssue[]> {
  const { info, meshMap } = activeDataset;
  const modelPath = resolve(
    process.cwd(),
    "public",
    info.modelUrl.replace(/^\//, ""),
  );
  const nodes = (
    await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(modelPath)
  )
    .getRoot()
    .listNodes();
  const nodeNames = new Set(
    nodes.map((n) => stripDuplicateSuffix(n.getName())),
  );
  const mapped = (name: string) =>
    name in meshMap || stripDuplicateSuffix(name) in meshMap;

  return [
    ...Object.keys(meshMap)
      .filter((name) => !nodeNames.has(name))
      .map((name) => ({
        severity: "error" as const,
        message: `mesh map entry "${name}" not found in the model`,
      })),
    ...nodes
      .filter((n) => n.getMesh() && !mapped(n.getName()))
      .map((n) => ({
        severity: "warning" as const,
        message: `model mesh "${n.getName()}" is not mapped (ignored)`,
      })),
  ];
}

async function main() {
  const { info, structures, meshMap } = activeDataset;
  const issues = [...validateDataset(activeDataset), ...(await modelIssues())];
  const errors = issues.filter((i) => i.severity === "error");

  console.log(
    `Dataset "${info.id}": ${structures.length} structures, ${Object.keys(meshMap).length} mapped meshes`,
  );
  for (const issue of issues) {
    const where = issue.structureId ? ` [${issue.structureId}]` : "";
    console.log(
      `${issue.severity === "error" ? "✗" : "!"} ${issue.message}${where}`,
    );
  }
  console.log(
    issues.length === 0
      ? "✓ No issues"
      : `${errors.length} error(s), ${issues.length - errors.length} warning(s)`,
  );
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
