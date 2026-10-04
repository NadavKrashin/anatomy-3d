/**
 * Cross-checks the active dataset's mesh map against its model file and its
 * structure metadata. Run after changing either.
 *
 *   npm run anatomy:validate
 */
import { resolve } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { activeDataset } from "../../src/data/anatomy";
import { findMeshMapIssues } from "../../src/lib/anatomy/modelAdapter";
import { stripDuplicateSuffix } from "../../src/lib/anatomy/meshNames";
import { createRegistry } from "../../src/lib/anatomy/registry";

async function main() {
  const { info, meshMap, structures } = activeDataset;
  const modelPath = resolve(
    process.cwd(),
    "public",
    info.modelUrl.replace(/^\//, ""),
  );
  const doc = await new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .read(modelPath);
  const nodeNames = new Set(
    doc
      .getRoot()
      .listNodes()
      .map((n) => stripDuplicateSuffix(n.getName())),
  );
  const meshNodeNames = doc
    .getRoot()
    .listNodes()
    .filter((n) => n.getMesh())
    .map((n) => n.getName());

  const issues = findMeshMapIssues(createRegistry(structures), meshMap);
  const missingInModel = Object.keys(meshMap).filter(
    (name) => !nodeNames.has(name),
  );
  const unmappedMeshes = meshNodeNames.filter(
    (name) => !(name in meshMap) && !(stripDuplicateSuffix(name) in meshMap),
  );

  const report: [string, string[]][] = [
    [
      "Mesh map entries pointing at unknown structure ids",
      issues.unknownStructureIds,
    ],
    [
      "Structures with no mesh (not selectable in this model)",
      issues.unmappedStructureIds,
    ],
    ["Mesh map entries not found in the model", missingInModel],
    ["Model meshes with no mapping (ignored by the app)", unmappedMeshes],
  ];

  console.log(
    `Dataset "${info.id}" — ${structures.length} structures, ${Object.keys(meshMap).length} mapped meshes`,
  );
  let errors = 0;
  for (const [title, items] of report) {
    console.log(`${items.length === 0 ? "✓" : "✗"} ${title}: ${items.length}`);
    for (const item of items.slice(0, 30)) console.log(`    ${item}`);
    if (title !== "Model meshes with no mapping (ignored by the app)")
      errors += items.length;
  }
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
