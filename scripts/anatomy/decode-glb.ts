/**
 * Writes a shipped model file without meshopt compression and quantization,
 * so Blender can import it (e.g. to build new pieces against the exact
 * geometry the app shows).
 *
 *   npx tsx scripts/anatomy/decode-glb.ts public/models/z-anatomy/skeleton.glb out/skeleton.glb
 */
import { dequantize } from "@gltf-transform/functions";
import { createIO } from "./io";

async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) {
    console.error(
      "Usage: npx tsx scripts/anatomy/decode-glb.ts <in.glb> <out.glb>",
    );
    process.exit(1);
  }
  const io = await createIO();
  const doc = await io.read(input);
  await doc.transform(dequantize());
  for (const extension of doc.getRoot().listExtensionsUsed())
    extension.dispose();
  await io.write(output, doc);
  console.log(`${input} → ${output} (uncompressed)`);
}

void main();
