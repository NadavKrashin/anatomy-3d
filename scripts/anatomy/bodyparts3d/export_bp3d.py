"""
Structures Z-Anatomy lacks, from BodyParts3D 4.0 (DBCLS, CC BY-SA 2.1 JP) —
the model Z-Anatomy itself was built from — fitted into the Z-Anatomy body.

    python export_bp3d.py -- <z-anatomy raw packs dir> <BodyParts3D dir> \
        <out bodyparts3d.glb> <out manifest-bp3d.json>

<BodyParts3D dir> holds isa_element_parts.txt, partof_element_parts.txt and
the OBJ files (isa_BP3D_4.0_obj_99/FJ*.obj). See README.md.

Fit (README.md → "Fit"): BodyParts3D is in millimetres in its own frame,
and Z-Anatomy remodelled parts of it, so one global transform is ~13 mm off.
  1. Anchors: Z-Anatomy meshes whose name matches a BodyParts3D concept
     with exactly one file ("Femur.l" ↔ "left femur").
  2. Global affine from the anchors' centroids (trimmed least squares).
  3. Per structure: ICP of the nearby anchors (BodyParts3D vertices after
     step 2 → their Z-Anatomy meshes) gives a local similarity correction.
"""
import csv
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import bpy
import numpy as np
from mathutils.kdtree import KDTree

ZA_DIR, BP_DIR, OUT_GLB, OUT_MANIFEST = (Path(p) for p in sys.argv[sys.argv.index("--") + 1 :])
OBJ_DIR = BP_DIR / "isa_BP3D_4.0_obj_99"

# BodyParts3D concept → (app name, system, tissue, region). Every file of the
# concept is joined into one mesh.
# Not the rectum: Z-Anatomy has it, mislabelled "Sigmoid colon" (README.md).
A, V, N, M = "artery", "vein", "nerve", "muscle"
CV, NS, MU = "cardiovascular", "nervous", "muscular"
STRUCTURES = {
    "small cardiac vein": ("Small cardiac vein", CV, V, "thorax"),
    "anterior cardiac vein": ("Anterior cardiac veins", CV, V, "thorax"),
    "right gastric artery": ("Right gastric artery", CV, A, "abdomen"),
    "dorsal pancreatic artery": ("Dorsal pancreatic artery", CV, A, "abdomen"),
    "anterior superior pancreaticoduodenal artery": ("Anterior superior pancreaticoduodenal artery", CV, A, "abdomen"),
    "posterior superior pancreaticoduodenal artery": ("Posterior superior pancreaticoduodenal artery", CV, A, "abdomen"),
    "right gastro-epiploic artery": ("Right gastro-omental artery", CV, A, "abdomen"),
    "left gastro-epiploic artery": ("Left gastro-omental artery", CV, A, "abdomen"),
    "right gastric vein": ("Right gastric vein", CV, V, "abdomen"),
    "left gastric vein": ("Left gastric vein", CV, V, "abdomen"),
    "bronchial artery": ("Bronchial artery", CV, A, "thorax"),
    **{
        f"{side} {concept}": (f"{name}.{side[0]}", system, tissue, region)
        for side in ("left", "right")
        for concept, (name, system, tissue, region) in {
            "frontal nerve": ("Frontal nerve", NS, N, "head"),
            "lacrimal nerve": ("Lacrimal nerve", NS, N, "head"),
            "supra-orbital nerve": ("Supra-orbital nerve", NS, N, "head"),
            "levator veli palatini": ("Levator veli palatini muscle", MU, M, "head"),
            "semispinalis capitis": ("Semispinalis capitis muscle", MU, M, "neck"),
            "dorsal scapular artery": ("Dorsal scapular artery", CV, A, "upper-limb"),
        }.items()
    },
}
TISSUE_COLORS = {"artery": "#c43a3f", "vein": "#4a6fb5", "nerve": "#e3c14e", "muscle": "#b4564c"}
PACKS = ("skeleton", "muscles", "nerves", "vessels", "organs")
LOCAL_RADIUS = 0.07  # m: anchors whose centre is this close take part in the local fit
MIN_ANCHORS = 6


def concept_files() -> dict[str, set[str]]:
    files = defaultdict(set)
    for name in ("isa_element_parts.txt", "partof_element_parts.txt"):
        with open(BP_DIR / name, encoding="utf-8") as f:
            for row in list(csv.reader(f, delimiter="\t"))[1:]:
                files[row[1]].add(row[2])
    return files


def bp_name(za_name: str) -> list[str]:
    """'Femur.l' → ['left femur', 'femur']; 'Biceps brachii muscle' → ['biceps brachii']."""
    base = re.sub(r"\.(l|r)$", "", za_name).lower().replace(" muscle", "")
    side = {"l": "left ", "r": "right "}.get(za_name[-1], "") if re.search(r"\.(l|r)$", za_name) else ""
    return [side + base, base]


def read_obj(fj: str) -> tuple[np.ndarray, list[tuple[int, ...]]]:
    verts, faces = [], []
    for line in open(OBJ_DIR / f"{fj}.obj"):
        if line.startswith("v "):
            verts.append([float(x) for x in line.split()[1:4]])
        elif line.startswith("f "):
            faces.append(tuple(int(p.split("/")[0]) - 1 for p in line.split()[1:]))
    return np.array(verts), faces


def world(obj: bpy.types.Object) -> np.ndarray:
    m = np.array(obj.matrix_world)
    return np.array([tuple(v.co) for v in obj.data.vertices]) @ m[:3, :3].T + m[:3, 3]


def similarity(P: np.ndarray, Q: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    mp, mq = P.mean(0), Q.mean(0)
    X, Y = P - mp, Q - mq
    U, D_, Vt = np.linalg.svd(Y.T @ X / len(P))
    S = np.eye(3)
    S[2, 2] = np.sign(np.linalg.det(U @ Vt))
    R = (np.trace(np.diag(D_) @ S) / (X**2).sum(1).mean()) * (U @ S @ Vt)
    return R, mq - R @ mp


def main() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for pack in PACKS:
        bpy.ops.import_scene.gltf(filepath=str(ZA_DIR / f"{pack}.glb"))
    za = {o.name: o for o in bpy.data.objects if o.type == "MESH"}
    files = concept_files()
    leaf = {n: next(iter(f)) for n, f in files.items() if len(f) == 1}

    anchors = []  # (Z-Anatomy vertices, BodyParts3D vertices)
    for name, obj in za.items():
        concept = next((c for c in bp_name(name) if c in leaf), None)
        if concept:
            anchors.append((world(obj), read_obj(leaf[concept])[0]))
    zc = np.array([a.mean(0) for a, _ in anchors])
    bc = np.array([b.mean(0) for _, b in anchors])

    # Global affine, trimmed twice to the best-matching 70%.
    keep = np.ones(len(anchors), bool)
    for _ in range(3):
        X = np.c_[bc[keep], np.ones(keep.sum())]
        G = np.linalg.lstsq(X, zc[keep], rcond=None)[0]
        err = np.linalg.norm(np.c_[bc, np.ones(len(bc))] @ G - zc, axis=1)
        keep = err <= np.quantile(err, 0.7)
    to_za = lambda P: np.c_[P, np.ones(len(P))] @ G  # noqa: E731
    print(f"{len(anchors)} anchors; global fit median {np.median(err) * 1000:.1f} mm")

    mats = {}
    for tissue, color in TISSUE_COLORS.items():
        mat = bpy.data.materials.new(tissue)
        mat.use_nodes = True
        c = [int(color[i : i + 2], 16) / 255 for i in (1, 3, 5)]
        lin = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
        mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*lin, 1)
        mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.5
        mats[tissue] = mat

    rng = np.random.default_rng(0)
    manifest, made = [], []
    for concept, (name, system, tissue, region) in STRUCTURES.items():
        parts = [read_obj(fj) for fj in sorted(files[concept])]
        assert parts, f"no BodyParts3D file for {concept!r}"
        P = to_za(np.vstack([p[0] for p in parts]))
        centre = P.mean(0)
        # Local correction from the anchors around it (only well-matching ones).
        near = [i for i in np.argsort(np.linalg.norm(zc - centre, axis=1)) if keep[i]]
        local = [i for i in near if np.linalg.norm(zc[i] - centre) < LOCAL_RADIUS] or []
        local = local if len(local) >= MIN_ANCHORS else near[:MIN_ANCHORS]
        src = np.vstack([to_za(anchors[i][1]) for i in local])
        dst = np.vstack([anchors[i][0] for i in local])
        src = src[rng.choice(len(src), min(5000, len(src)), replace=False)]
        tree = KDTree(len(dst))
        for j, p in enumerate(dst):
            tree.insert(p, j)
        tree.balance()
        R, t = np.eye(3), np.zeros(3)
        for _ in range(40):
            cur = src @ R.T + t
            nn = np.array([tree.find(p)[0] for p in cur])
            d = np.linalg.norm(nn - cur, axis=1)
            sel = d < np.quantile(d, 0.8)
            R, t = similarity(src[sel], nn[sel])
        d = np.array([tree.find(p)[2] for p in src @ R.T + t])
        shift = np.linalg.norm((centre @ R.T + t) - centre)
        print(f"{name:48} {len(local):2} anchors, fit median {np.median(d) * 1000:4.1f} mm, moved {shift * 1000:4.1f} mm")

        verts, faces, base = [], [], 0
        for V_, F_ in parts:
            verts += (to_za(V_) @ R.T + t).tolist()
            faces += [tuple(base + i for i in f) for f in F_]
            base += len(V_)
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(verts, [], faces)
        mesh.validate()
        mesh.materials.append(mats[tissue])
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        made.append(obj)
        manifest.append({"name": name, "system": system, "tissue": tissue, "region": region,
                         "pack": "bodyparts3d", "vertices": len(verts), "source": "BodyParts3D"})

    for o in list(bpy.data.objects):
        if o not in made:
            bpy.data.objects.remove(o, do_unlink=True)
    for o in made:
        o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUT_GLB), export_format="GLB", use_selection=True, export_yup=True,
        export_apply=True, export_normals=True, export_texcoords=False, export_materials="EXPORT",
        export_cameras=False, export_lights=False, export_animations=False,
    )
    manifest.sort(key=lambda m: m["name"])
    OUT_MANIFEST.write_text(json.dumps(manifest, indent=1, ensure_ascii=False))
    print(f"bodyparts3d: {len(manifest)} meshes, {sum(m['vertices'] for m in manifest)} vertices")


main()
