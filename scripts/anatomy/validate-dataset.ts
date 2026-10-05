/**
 * Validates the active dataset: metadata quality (shared with the unit tests)
 * plus a cross-check of its mesh map against the actual model file.
 *
 *   npm run anatomy:validate
 *
 * Exits non-zero on errors; warnings are printed but don't fail.
 */
import { resolve } from "node:path";
import { activeDataset } from "../../src/data/anatomy";
import { stripDuplicateSuffix } from "../../src/lib/anatomy/meshNames";
import { createIO } from "./io";
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
  const nodes = (await (await createIO()).read(modelPath))
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

/** Every attachment must name a patch node in the attachments model. */
async function attachmentModelIssues(): Promise<DatasetIssue[]> {
  const { attachments } = activeDataset;
  if (!attachments) return [];
  const path = resolve(
    process.cwd(),
    "public",
    attachments.modelUrl.replace(/^\//, ""),
  );
  const names = new Set(
    (await (await createIO()).read(path))
      .getRoot()
      .listNodes()
      .map((n) => n.getName()),
  );
  return attachments.items
    .filter((item) => !names.has(item.meshName))
    .map((item) => ({
      severity: "error" as const,
      message: `attachment "${item.meshName}" not found in ${attachments.modelUrl}`,
    }));
}

async function main() {
  const { info, structures, meshMap } = activeDataset;
  const issues = [
    ...validateDataset(activeDataset),
    ...(await modelIssues()),
    ...(await attachmentModelIssues()),
  ];
  const errors = issues.filter((i) => i.severity === "error");

  console.log(
    `Dataset "${info.id}": ${structures.length} structures, ${Object.keys(meshMap).length} mapped meshes`,
  );
  for (const issue of errors) {
    console.log(
      `✗ ${issue.message}${issue.structureId ? ` [${issue.structureId}]` : ""}`,
    );
  }
  // Warnings are grouped: e.g. hundreds of "missing Hebrew name" are one line.
  const warnings = new Map<string, string[]>();
  for (const issue of issues.filter((i) => i.severity === "warning")) {
    warnings.set(issue.message, [
      ...(warnings.get(issue.message) ?? []),
      issue.structureId ?? "",
    ]);
  }
  for (const [message, ids] of warnings) {
    console.log(
      `! ${message}: ${ids.length} (e.g. ${ids.slice(0, 3).join(", ")})`,
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
