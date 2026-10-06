/**
 * For audits of the shipped model files: per mesh node, its world bounding
 * box, centre and up to ~1,500 sampled vertices (glTF frame: y up, +z front,
 * +x the body's left). How the audit uses it: docs/DECISIONS.md → "Audit".
 *
 *   npx tsx scripts/anatomy/audit-extract.ts out.json public/models/z-anatomy/*.glb …
 */
import { writeFileSync } from "node:fs";
import { createIO } from "./io";

type Vec = [number, number, number];

function transform(m: readonly number[], [x, y, z]: Vec): Vec {
  const at = (i: number) => m[i] ?? 0;
  return [0, 1, 2].map(
    (r) => at(r) * x + at(4 + r) * y + at(8 + r) * z + at(12 + r),
  ) as Vec;
}

async function main() {
  const [out, ...files] = process.argv.slice(2);
  if (!out || files.length === 0) {
    console.error(
      "Usage: npx tsx scripts/anatomy/audit-extract.ts out.json <model.glb>…",
    );
    process.exit(1);
  }
  const io = await createIO();
  const nodes: object[] = [];
  for (const file of files) {
    const doc = await io.read(file);
    for (const node of doc.getRoot().listNodes()) {
      const mesh = node.getMesh();
      if (!mesh) continue;
      const matrix = node.getWorldMatrix();
      const points: Vec[] = [];
      for (const primitive of mesh.listPrimitives()) {
        const positions = primitive.getAttribute("POSITION");
        if (!positions) continue;
        const element: number[] = [];
        for (let i = 0; i < positions.getCount(); i++) {
          positions.getElement(i, element);
          // getElement already decodes quantized (normalized) positions.
          const [x = 0, y = 0, z = 0] = element;
          points.push(transform(matrix, [x, y, z]));
        }
      }
      if (points.length === 0) continue;
      const axis = (k: 0 | 1 | 2) => points.map((p) => p[k]);
      const step = Math.max(1, Math.floor(points.length / 1500));
      nodes.push({
        file,
        name: node.getName() || mesh.getName(),
        n: points.length,
        lo: ([0, 1, 2] as const).map((k) => Math.min(...axis(k))),
        hi: ([0, 1, 2] as const).map((k) => Math.max(...axis(k))),
        c: ([0, 1, 2] as const).map(
          (k) => axis(k).reduce((a, b) => a + b, 0) / points.length,
        ),
        sample: points.filter((_, i) => i % step === 0),
      });
    }
  }
  writeFileSync(out, JSON.stringify(nodes));
  console.log(`${nodes.length} mesh nodes → ${out}`);
}

void main();
