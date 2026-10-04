/**
 * Generates public/models/anatomy-demo.glb: a handful of separately named
 * placeholder meshes laid out roughly like a body. Shapes are NOT
 * anatomically accurate — they only exist to exercise the app architecture.
 *
 *   npm run anatomy:generate-demo
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Document, NodeIO, type Material } from "@gltf-transform/core";
import {
  type BufferGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  Matrix4,
  Quaternion,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";

type Vec3 = [number, number, number];
type MaterialKey =
  "bone" | "muscle" | "nerve" | "artery" | "heart" | "lung" | "liver";

const OUTPUT = resolve(process.cwd(), "public/models/anatomy-demo.glb");

const COLORS: Record<MaterialKey, string> = {
  bone: "#e6dac3",
  muscle: "#b4564c",
  nerve: "#e3c14e",
  artery: "#c43a3f",
  heart: "#a5333c",
  lung: "#d49c9a",
  liver: "#7c3c2f",
};

function hexToLinear(hex: string): [number, number, number, number] {
  const channel = (offset: number) => {
    const srgb = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return [channel(1), channel(3), channel(5), 1];
}

/** Capsule spanning two points (CapsuleGeometry is built along +Y). */
function limbSegment(
  from: Vec3,
  to: Vec3,
  radius: number,
  scale: Vec3 = [1, 1, 1],
): BufferGeometry {
  const start = new Vector3(...from);
  const end = new Vector3(...to);
  const direction = end.clone().sub(start);
  const length = direction.length();
  const geometry = new CapsuleGeometry(
    radius,
    Math.max(length - 2 * radius, 0.001),
    8,
    20,
  );
  geometry.scale(...scale);
  const rotation = new Quaternion().setFromUnitVectors(
    new Vector3(0, 1, 0),
    direction.normalize(),
  );
  const midpoint = start.add(end).multiplyScalar(0.5);
  return geometry.applyMatrix4(
    new Matrix4().compose(midpoint, rotation, new Vector3(1, 1, 1)),
  );
}

function ellipsoid(center: Vec3, radii: Vec3): BufferGeometry {
  const geometry = new SphereGeometry(1, 40, 28);
  geometry.scale(...radii);
  geometry.translate(...center);
  return geometry;
}

function tube(points: Vec3[], radius: number): BufferGeometry {
  const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)));
  return new TubeGeometry(curve, 64, radius, 10, false);
}

const mirror = ([x, y, z]: Vec3): Vec3 => [-x, y, z];

interface DemoPart {
  name: string;
  material: MaterialKey;
  geometry: BufferGeometry;
}

/*
 * The figure faces +Z, so its anatomical LEFT side is at +X (the viewer's
 * right when looking at it from the front). Units are metres.
 */
function buildLeftArm(): { bones: DemoPart[]; soft: DemoPart[] } {
  const shoulder: Vec3 = [0.2, 1.42, 0];
  const elbow: Vec3 = [0.245, 1.12, 0];
  return {
    bones: [
      {
        name: "humerus",
        material: "bone",
        geometry: limbSegment(shoulder, elbow, 0.02),
      },
      // Radius lateral (away from the midline), ulna medial.
      {
        name: "radius",
        material: "bone",
        geometry: limbSegment(
          [0.258, 1.11, 0.006],
          [0.292, 0.87, 0.012],
          0.012,
        ),
      },
      {
        name: "ulna",
        material: "bone",
        geometry: limbSegment([0.232, 1.115, -0.006], [0.262, 0.87, 0], 0.012),
      },
    ],
    soft: [
      {
        name: "biceps",
        material: "muscle",
        geometry: limbSegment(
          [0.21, 1.37, 0.03],
          [0.24, 1.16, 0.03],
          0.026,
          [1, 1, 0.85],
        ),
      },
    ],
  };
}

function mirrorGeometry(geometry: BufferGeometry): BufferGeometry {
  const mirrored = geometry
    .clone()
    .applyMatrix4(new Matrix4().makeScale(-1, 1, 1));
  // A negative scale flips triangle winding; swap two indices per face.
  const index = mirrored.getIndex();
  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i + 1);
      index.setX(i + 1, index.getX(i + 2));
      index.setX(i + 2, a);
    }
  }
  mirrored.computeVertexNormals();
  return mirrored;
}

function buildParts(): DemoPart[] {
  const leftArm = buildLeftArm();
  const armParts = [...leftArm.bones, ...leftArm.soft];

  return [
    {
      name: "demo_skull",
      material: "bone",
      geometry: ellipsoid([0, 1.63, 0], [0.085, 0.105, 0.1]),
    },
    ...armParts.map((p) => ({ ...p, name: `demo_${p.name}_left` })),
    ...armParts.map((p) => ({
      ...p,
      name: `demo_${p.name}_right`,
      geometry: mirrorGeometry(p.geometry),
    })),
    {
      name: "demo_femur_left",
      material: "bone",
      geometry: limbSegment([0.1, 0.94, 0], [0.11, 0.5, 0.01], 0.024),
    },
    {
      name: "demo_femur_right",
      material: "bone",
      geometry: limbSegment(
        mirror([0.1, 0.94, 0]),
        mirror([0.11, 0.5, 0.01]),
        0.024,
      ),
    },
    {
      name: "demo_brachial_artery_left",
      material: "artery",
      geometry: tube(
        [
          [0.17, 1.4, 0.02],
          [0.2, 1.26, 0.035],
          [0.235, 1.13, 0.045],
        ],
        0.0045,
      ),
    },
    {
      name: "demo_median_nerve_left",
      material: "nerve",
      geometry: tube(
        [
          [0.163, 1.41, 0.012],
          [0.192, 1.26, 0.026],
          [0.228, 1.12, 0.036],
          [0.258, 0.98, 0.026],
          [0.276, 0.87, 0.02],
        ],
        0.0032,
      ),
    },
    {
      name: "demo_ulnar_nerve_left",
      material: "nerve",
      geometry: tube(
        [
          [0.158, 1.41, -0.002],
          [0.185, 1.26, -0.012],
          [0.215, 1.125, -0.03],
          [0.244, 0.98, -0.014],
          [0.258, 0.87, -0.006],
        ],
        0.0032,
      ),
    },
    {
      name: "demo_radial_nerve_left",
      material: "nerve",
      geometry: tube(
        [
          [0.172, 1.41, -0.008],
          [0.205, 1.31, -0.032],
          [0.248, 1.21, -0.018],
          [0.265, 1.12, 0.018],
          [0.288, 0.98, 0.022],
          [0.3, 0.87, 0.016],
        ],
        0.0032,
      ),
    },
    {
      name: "demo_lung_left",
      material: "lung",
      geometry: ellipsoid([0.085, 1.31, -0.005], [0.068, 0.135, 0.07]),
    },
    {
      name: "demo_lung_right",
      material: "lung",
      geometry: ellipsoid([-0.088, 1.31, -0.005], [0.075, 0.14, 0.072]),
    },
    {
      name: "demo_heart",
      material: "heart",
      geometry: ellipsoid([0.022, 1.255, 0.045], [0.055, 0.068, 0.05]),
    },
    {
      name: "demo_liver",
      material: "liver",
      geometry: ellipsoid([-0.045, 1.115, 0.012], [0.125, 0.058, 0.075]),
    },
  ];
}

function addPart(
  doc: Document,
  materials: Map<MaterialKey, Material>,
  part: DemoPart,
) {
  const buffer = doc.getRoot().listBuffers()[0];
  const material = materials.get(part.material);
  if (!buffer || !material)
    throw new Error(`${part.name}: buffer/material missing`);
  const { geometry } = part;
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const index = geometry.getIndex();
  if (!index) throw new Error(`${part.name}: expected indexed geometry`);

  const primitive = doc
    .createPrimitive()
    .setAttribute(
      "POSITION",
      doc
        .createAccessor()
        .setType("VEC3")
        .setArray(new Float32Array(position.array))
        .setBuffer(buffer),
    )
    .setAttribute(
      "NORMAL",
      doc
        .createAccessor()
        .setType("VEC3")
        .setArray(new Float32Array(normal.array))
        .setBuffer(buffer),
    )
    .setIndices(
      doc
        .createAccessor()
        .setType("SCALAR")
        .setArray(new Uint32Array(index.array))
        .setBuffer(buffer),
    )
    .setMaterial(material);

  const mesh = doc.createMesh(part.name).addPrimitive(primitive);
  return doc.createNode(part.name).setMesh(mesh);
}

async function main() {
  const doc = new Document();
  doc.createBuffer();
  const materials = new Map<MaterialKey, Material>();
  for (const [key, hex] of Object.entries(COLORS) as [MaterialKey, string][]) {
    materials.set(
      key,
      doc
        .createMaterial(key)
        .setBaseColorFactor(hexToLinear(hex))
        .setRoughnessFactor(key === "bone" ? 0.75 : 0.55)
        .setMetallicFactor(0),
    );
  }

  const root = doc.createNode("anatomy_demo_root");
  for (const part of buildParts()) root.addChild(addPart(doc, materials, part));
  doc.createScene("anatomy-demo").addChild(root);
  doc.getRoot().getAsset().extras = {
    notice: "Development demo model — not anatomically accurate.",
  };

  const glb = await new NodeIO().writeBinary(doc);
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, glb);
  console.log(`Wrote ${OUTPUT} (${(glb.byteLength / 1024).toFixed(1)} KiB)`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
