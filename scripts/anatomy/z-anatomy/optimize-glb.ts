/**
 * Compresses the raw Z-Anatomy export for the web without merging meshes —
 * every structure must stay a separately named node for picking.
 *
 *   npx tsx scripts/anatomy/z-anatomy/optimize-glb.ts <in.glb> <out.glb> [--simplify 0.5]
 *
 * Steps: dedup → prune → weld → (optional) simplify → quantize → meshopt
 * compression (EXT_meshopt_compression; three's GLTFLoader decodes it with
 * the MeshoptDecoder that drei's useGLTF enables by default).
 */
import { statSync } from "node:fs";
import { EXTMeshoptCompression } from "@gltf-transform/extensions";
import {
  dedup,
  meshopt,
  prune,
  quantize,
  simplify,
  weld,
} from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import { createIO } from "../io";

async function main() {
  const args = process.argv.slice(2);
  const [input, output] = args.filter((a) => !a.startsWith("--"));
  const ratioArg = args.indexOf("--simplify");
  const ratio = ratioArg >= 0 ? Number(args[ratioArg + 1]) : null;
  if (!input || !output)
    throw new Error(
      "Usage: optimize-glb.ts <in.glb> <out.glb> [--simplify <ratio>]",
    );

  await MeshoptSimplifier.ready;
  const io = await createIO();
  const doc = await io.read(input);

  await doc.transform(
    dedup(),
    prune({ keepLeaves: true }),
    weld(),
    ...(ratio
      ? [simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.0005 })]
      : []),
    quantize(),
    meshopt({ encoder: MeshoptEncoder, level: "high" }),
  );
  doc.createExtension(EXTMeshoptCompression).setRequired(true);

  await io.write(output, doc);
  const mb = (path: string) => (statSync(path).size / 1024 / 1024).toFixed(2);
  console.log(`${input} (${mb(input)} MiB) → ${output} (${mb(output)} MiB)`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
