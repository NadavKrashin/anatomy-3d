/**
 * Splits named branches out of Z-Anatomy meshes that carry them unnamed, so
 * they become their own structures (user decision 2026-10-07):
 *
 *   - "Maxillary nerve" runs on through the inferior orbital fissure into the
 *     orbit floor and out on the face: the part in front of the fissure — taken
 *     where the infra-orbital artery (which enters the orbit through it) begins —
 *     becomes "Infra-orbital nerve".
 *   - "Femoral nerve" continues below its division in the femoral triangle down
 *     the adductor canal into vastus medialis: the part below the division —
 *     taken where the saphenous nerve begins — becomes "Nerve to vastus
 *     medialis".
 *
 *   npx tsx scripts/anatomy/z-anatomy/split-meshes.ts public/models/z-anatomy/nerves.glb \
 *     public/models/z-anatomy/vessels.glb src/data/anatomy/z-anatomy/manifest.json
 *
 * Rewrites the nerves GLB and the manifest in place; a no-op when the new
 * meshes already exist. Run after optimize-glb.ts (scripts/anatomy/z-anatomy/
 * README.md). Triangles are assigned by their centroid (world, glTF frame:
 * y up, +z front).
 */
import { readFileSync, writeFileSync } from "node:fs";
import {
  type Accessor,
  type Document,
  type Node,
  type Primitive,
} from "@gltf-transform/core";
import { EXTMeshoptCompression } from "@gltf-transform/extensions";
import {
  dequantize,
  meshopt,
  prune,
  quantize,
} from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import { createIO } from "../io";

type Vec3 = [number, number, number];

interface ManifestEntry {
  name: string;
  system: string;
  tissue: string;
  region: string;
  pack: string;
  vertices: number;
  [key: string]: unknown;
}

interface Rule {
  source: string;
  target: string;
  region: string;
  /** Whether a triangle (by its world centroid) goes to the target. */
  test: (c: Vec3) => boolean;
}

function transform(m: readonly number[], [x, y, z]: Vec3): Vec3 {
  const at = (i: number) => m[i] ?? 0;
  return [0, 1, 2].map(
    (r) => at(r) * x + at(4 + r) * y + at(8 + r) * z + at(12 + r),
  ) as Vec3;
}

function worldPositions(node: Node): Vec3[] {
  const matrix = node.getWorldMatrix();
  const points: Vec3[] = [];
  for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
    const positions = primitive.getAttribute("POSITION");
    if (!positions) continue;
    const element: number[] = [];
    for (let i = 0; i < positions.getCount(); i++) {
      positions.getElement(i, element);
      const [x = 0, y = 0, z = 0] = element;
      points.push(transform(matrix, [x, y, z]));
    }
  }
  return points;
}

function findNode(doc: Document, name: string): Node | undefined {
  return doc
    .getRoot()
    .listNodes()
    .find((n) => (n.getName() || n.getMesh()?.getName()) === name);
}

/** A copy of `accessor` holding only the elements listed in `keep`. */
function subset(doc: Document, accessor: Accessor, keep: number[]): Accessor {
  const size = accessor.getElementSize();
  const source = accessor.getArray();
  if (!source) throw new Error(`accessor without data`);
  type Data = NonNullable<ReturnType<Accessor["getArray"]>>;
  const Ctor = source.constructor as new (n: number) => Data;
  const out: Data = new Ctor(keep.length * size);
  keep.forEach((v, i) => {
    for (let k = 0; k < size; k++)
      out[i * size + k] = source[v * size + k] ?? 0;
  });
  return doc
    .createAccessor()
    .setType(accessor.getType())
    .setNormalized(accessor.getNormalized())
    .setArray(out)
    .setBuffer(accessor.getBuffer());
}

/** Triangles of `primitive` kept by `keepTri`, as a new primitive. */
function split(
  doc: Document,
  primitive: Primitive,
  keepTri: (tri: number) => boolean,
): Primitive {
  const indices = primitive.getIndices();
  const index = (i: number) => (indices ? indices.getScalar(i) : i);
  const count = indices
    ? indices.getCount()
    : (primitive.getAttribute("POSITION")?.getCount() ?? 0);
  const used = new Map<number, number>();
  const order: number[] = [];
  const tris: number[] = [];
  for (let t = 0; t < count / 3; t++) {
    if (!keepTri(t)) continue;
    for (let k = 0; k < 3; k++) {
      const v = index(t * 3 + k);
      if (!used.has(v)) {
        used.set(v, order.length);
        order.push(v);
      }
      tris.push(used.get(v) ?? 0);
    }
  }
  const out = doc.createPrimitive().setMode(primitive.getMode());
  const material = primitive.getMaterial();
  if (material) out.setMaterial(material);
  for (const semantic of primitive.listSemantics()) {
    const accessor = primitive.getAttribute(semantic);
    if (accessor) out.setAttribute(semantic, subset(doc, accessor, order));
  }
  const IndexArray = order.length > 65535 ? Uint32Array : Uint16Array;
  out.setIndices(
    doc
      .createAccessor()
      .setType("SCALAR")
      .setArray(new IndexArray(tris))
      .setBuffer(indices?.getBuffer() ?? null),
  );
  return out;
}

function vertexCount(node: Node): number {
  return (node.getMesh()?.listPrimitives() ?? []).reduce(
    (n, p) => n + (p.getAttribute("POSITION")?.getCount() ?? 0),
    0,
  );
}

async function main() {
  const [nervesPath, vesselsPath, manifestPath] = process.argv.slice(2);
  if (!nervesPath || !vesselsPath || !manifestPath)
    throw new Error(
      "Usage: split-meshes.ts <nerves.glb> <vessels.glb> <manifest.json>",
    );
  const io = await createIO();
  const doc = await io.read(nervesPath);
  const vessels = await io.read(vesselsPath);

  const rules: Rule[] = [];
  for (const side of ["l", "r"] as const) {
    const artery = findNode(vessels, `Infra-orbital artery.${side}`);
    const saphenous = findNode(doc, `Saphenous nerve.${side}`);
    if (!artery || !saphenous)
      throw new Error(`landmark meshes missing (${side})`);
    // The artery's posterior end (smallest z: +z is the front).
    const back = Math.min(...worldPositions(artery).map((p) => p[2]));
    // The saphenous nerve's upper end (largest y: y is up).
    const top = Math.max(...worldPositions(saphenous).map((p) => p[1]));
    rules.push(
      {
        source: `Maxillary nerve.${side}`,
        target: `Infra-orbital nerve.${side}`,
        region: "head",
        test: (c) => c[2] > back,
      },
      {
        source: `Femoral nerve.${side}`,
        target: `Nerve to vastus medialis.${side}`,
        region: "lower-limb",
        test: (c) => c[1] < top,
      },
    );
  }

  const todo = rules.filter((r) => !findNode(doc, r.target));
  if (todo.length === 0) {
    console.log("already split");
    return;
  }
  await doc.transform(dequantize());

  const manifest = JSON.parse(
    readFileSync(manifestPath, "utf8"),
  ) as ManifestEntry[];
  for (const rule of todo) {
    const node = findNode(doc, rule.source);
    const shared = node?.getMesh();
    if (!node || !shared) throw new Error(`${rule.source} not found`);
    // Left and right often share one mesh, mirrored by the node: split a
    // copy of it, so the other side keeps its own.
    const mesh = shared.clone().setName(shared.getName());
    node.setMesh(mesh);
    const matrix = node.getWorldMatrix();
    const newMesh = doc.createMesh(rule.target);
    for (const primitive of mesh.listPrimitives()) {
      const positions = primitive.getAttribute("POSITION");
      const indices = primitive.getIndices();
      if (!positions) continue;
      const element: number[] = [];
      const centroid = (t: number): Vec3 => {
        const c: Vec3 = [0, 0, 0];
        for (let k = 0; k < 3; k++) {
          const v = indices ? indices.getScalar(t * 3 + k) : t * 3 + k;
          positions.getElement(v, element);
          const [x = 0, y = 0, z = 0] = element;
          const [wx, wy, wz] = transform(matrix, [x, y, z]);
          c[0] += wx / 3;
          c[1] += wy / 3;
          c[2] += wz / 3;
        }
        return c;
      };
      const goes = (t: number) => rule.test(centroid(t));
      newMesh.addPrimitive(split(doc, primitive, goes));
      const stays = split(doc, primitive, (t) => !goes(t));
      mesh.removePrimitive(primitive);
      mesh.addPrimitive(stays);
    }
    const newNode = doc
      .createNode(rule.target)
      .setMesh(newMesh)
      .setTranslation(node.getTranslation())
      .setRotation(node.getRotation())
      .setScale(node.getScale());
    const parent = node.getParentNode();
    if (parent) parent.addChild(newNode);
    else
      for (const scene of doc.getRoot().listScenes())
        if (scene.listChildren().includes(node)) scene.addChild(newNode);

    const source = manifest.find((e) => e.name === rule.source);
    if (!source) throw new Error(`${rule.source} not in the manifest`);
    source.vertices = vertexCount(node);
    manifest.splice(manifest.indexOf(source) + 1, 0, {
      ...source,
      name: rule.target,
      region: rule.region,
      vertices: vertexCount(newNode),
    });
    console.log(
      `${rule.source} → ${rule.target}: ${vertexCount(newNode)} vertices split off, ${source.vertices} left`,
    );
  }

  await doc.transform(
    prune({ keepLeaves: true }),
    quantize(),
    meshopt({ encoder: MeshoptEncoder, level: "high" }),
  );
  doc.createExtension(EXTMeshoptCompression).setRequired(true);
  await io.write(nervesPath, doc);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
