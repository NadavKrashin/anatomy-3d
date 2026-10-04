/**
 * Prints a summary of a glTF/GLB model, to help map a new anatomy dataset.
 *
 *   npm run anatomy:inspect public/models/anatomy.glb
 *   npm run anatomy:inspect public/models/anatomy.glb -- --all   (list every mesh)
 */
import { statSync } from "node:fs";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";

const EXAMPLE_LIMIT = 25;

async function main() {
  const args = process.argv.slice(2);
  const path = args.find((a) => !a.startsWith("--"));
  const listAll = args.includes("--all");
  if (!path) {
    console.error("Usage: npm run anatomy:inspect <model.glb> [-- --all]");
    process.exit(1);
  }

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(path);
  const root = doc.getRoot();

  const meshNodes = root.listNodes().flatMap((node) => {
    const mesh = node.getMesh();
    return mesh ? [{ node, mesh }] : [];
  });
  let vertices = 0;
  let triangles = 0;
  for (const { mesh } of meshNodes) {
    for (const primitive of mesh.listPrimitives()) {
      const count = primitive.getAttribute("POSITION")?.getCount() ?? 0;
      vertices += count;
      triangles += (primitive.getIndices()?.getCount() ?? count) / 3;
    }
  }

  const names = meshNodes.map(
    ({ node, mesh }) => node.getName() || mesh.getName(),
  );
  const unnamed = names.filter((name) => name.trim() === "").length;
  const counts = new Map<string, number>();
  for (const name of names)
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  const duplicates = [...counts].filter(([, n]) => n > 1);

  const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
  console.log(
    `File:       ${path} (${(statSync(path).size / 1024 / 1024).toFixed(2)} MiB)`,
  );
  console.log(`Meshes:     ${fmt(meshNodes.length)} mesh nodes`);
  console.log(`Vertices:   ${fmt(vertices)}`);
  console.log(`Triangles:  ${fmt(triangles)}`);
  console.log(`Materials:  ${fmt(root.listMaterials().length)}`);
  console.log(`Textures:   ${fmt(root.listTextures().length)}`);
  console.log(
    `Extensions: ${
      root
        .listExtensionsUsed()
        .map((e) => e.extensionName)
        .join(", ") || "none"
    }`,
  );
  console.log(`Unnamed:    ${fmt(unnamed)}`);
  console.log(
    `Duplicates: ${fmt(duplicates.length)} names used more than once`,
  );
  for (const [name, n] of duplicates.slice(0, EXAMPLE_LIMIT))
    console.log(`  ${name} ×${n}`);

  const shown = listAll ? names : names.slice(0, EXAMPLE_LIMIT);
  console.log(`\n${listAll ? "Mesh names" : "Examples"}:`);
  for (const name of shown) console.log(`  ${name || "(unnamed)"}`);
  if (!listAll && names.length > shown.length)
    console.log(`  … ${fmt(names.length - shown.length)} more (use --all)`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
