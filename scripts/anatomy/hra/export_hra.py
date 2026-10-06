"""
Female organs from the Human Reference Atlas (HuBMAP, Visible Human Female,
CC BY 4.0), fitted into the Z-Anatomy body for the app's female mode.

    python export_hra.py -- <z-anatomy raw packs dir> <VH_Female dir> \
        <out female.glb> <out manifest-female.json>

<z-anatomy raw packs dir> holds skeleton.glb, muscles.glb and organs.glb as
written by ../z-anatomy/export_glb.py; <VH_Female dir> is that folder of
github.com/hubmapconsortium/ccf-3d-reference-object-library (v1.2/, v1.3/).

Placement (scripts/anatomy/hra/README.md):
  - Pelvic organs: a similarity transform (rotation, uniform scale,
    translation) found by ICP from the Atlas's bony pelvis to Z-Anatomy's
    hip bones, sacrum and coccyx, then a translation so the Atlas's bladder
    sits where Z-Anatomy's does (a female pelvis is shallower: the pure
    pelvis fit leaves the bladder in the pubic symphysis, away from the
    ureters).
  - Breasts: the same rotation and scale; the nipple on the midclavicular
    line at the 4th intercostal space; then each vertex is moved front/back
    so the breast's back surface lies on Z-Anatomy's chest wall.
Names follow MESHES; everything else in the files (uterine walls that
duplicate the body/fundus surfaces, peritoneal folds) is left out.
"""
import json
import sys
from pathlib import Path

import bpy
import bmesh  # only importable after bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

ZA_DIR, HRA_DIR, OUT_GLB, OUT_MANIFEST = (Path(p) for p in sys.argv[sys.argv.index("--") + 1 :])

# Atlas file → {Atlas mesh name: (app name, group, system, tissue, region)}.
# A group is the whole the part belongs to ("Uterus"); None = a whole itself.
R, U, LIG = "reproductive", "urinary", "ligament"
MESHES = {
    "v1.2/VH_F_Uterus.glb": {
        "VH_F_fundus_of_uterus": ("Fundus of uterus", "Uterus", R, R, "pelvis"),
        "VH_F_body_of_uterus": ("Body of uterus", "Uterus", R, R, "pelvis"),
        "VH_F_lower_uterine_segment": ("Lower uterine segment", "Uterus", R, R, "pelvis"),
        "VH_F_cervix": ("Cervix of uterus", "Uterus", R, R, "pelvis"),
        "VH_F_internal_cervical_os": ("Internal cervical os", "Uterus", R, R, "pelvis"),
        "VH_F_external_cervical_os": ("External cervical os", "Uterus", R, R, "pelvis"),
        "VH_F_cornua": ("Cornua of uterus", "Uterus", R, R, "pelvis"),
    },
    "v1.2/VH_F_Vagina.glb": {
        "VH_F_vagina": ("Vagina", "Vagina", R, R, "pelvis"),
        "VH_F_cervicovaginal_junction": ("Cervicovaginal junction", "Vagina", R, R, "pelvis"),
    },
    "v1.2/VH_F_Ovary_L.glb": {"VH_F_left_ovary": ("Ovary.l", None, R, R, "pelvis")},
    "v1.2/VH_F_Ovary_R.glb": {"VH_F_right_ovary": ("Ovary.r", None, R, R, "pelvis")},
    **{
        f"v1.2/VH_F_Fallopian_Tube_{s}.glb": {
            f"VH_F_ampulla_of_uterine_tube_{s}": (f"Ampulla of uterine tube.{s.lower()}", "Uterine tube", R, R, "pelvis"),
            f"VH_F_isthmus_of_fallopian_tube_{s}": (f"Isthmus of uterine tube.{s.lower()}", "Uterine tube", R, R, "pelvis"),
            f"VH_F_uterine_tube_infundibulum_{s}": (f"Infundibulum of uterine tube.{s.lower()}", "Uterine tube", R, R, "pelvis"),
            f"VH_F_fibria_of_uterine_tube_{s}": (f"Fimbriae of uterine tube.{s.lower()}", "Uterine tube", R, R, "pelvis"),
        }
        for s in "LR"
    },
    "v1.2/VH_F_Ligaments_Uterus_Ovaries.glb": {
        # The Atlas swaps the round ligaments: its "left" one lies on the
        # body's right (its ovaries are the right way round).
        "VH_F_left_round_ligament_of_uterus": ("Round ligament of uterus.r", None, R, LIG, "pelvis"),
        "VH_F_right_round_ligament_of_uterus": ("Round ligament of uterus.l", None, R, LIG, "pelvis"),
        **{
            f"VH_F_{side}_{n}": (f"{name}.{side[0]}", None, R, LIG, "pelvis")
            for side in ("left", "right")
            for n, name in (
                ("cardinal_ligament_of_uterus", "Cardinal ligament"),
                ("uterosacral_ligament", "Uterosacral ligament"),
            )
        },
        **{
            f"VH_F_{n}_{s}": (f"{name}.{s.lower()}", None, R, LIG, "pelvis")
            for s in "LR"
            for n, name in (
                ("ovarian_ligament", "Ovarian ligament"),
                ("suspensory_ligament_of_ovary", "Suspensory ligament of ovary"),
            )
        },
    },
    "v1.2/VH_F_Urinary_Bladder.glb": {
        "VH_F_fundus_of_urinary_bladder_base": ("Fundus of urinary bladder", "Urinary bladder", U, U, "pelvis"),
        "VH_F_fundus_of_urinary_bladder_dome": ("Dome of urinary bladder", "Urinary bladder", U, U, "pelvis"),
        "VH_F_trigone_of_urinary_bladder": ("Trigone of urinary bladder", "Urinary bladder", U, U, "pelvis"),
        "VH_F_urinary_bladder_neck_smooth_muscle": ("Neck of urinary bladder", "Urinary bladder", U, U, "pelvis"),
        "VH_F_ureteral_orifice_L": ("Ureteric orifice.l", "Urinary bladder", U, U, "pelvis"),
        "VH_F_ureteral_orifice_R": ("Ureteric orifice.r", "Urinary bladder", U, U, "pelvis"),
    },
    **{
        f"v1.3/VH_F_mammary_gland_{s}.glb": {
            f"VH_F_{n}_{s}": (f"{name}.{s.lower()}", "Breast", R, R, "thorax")
            for n, name in (
                ("nipple", "Nipple"),
                ("areola", "Areola"),
                ("areolar_tubercles", "Areolar tubercles"),
                ("fat", "Fatty tissue of breast"),
                ("mammary_lobes", "Lobes of mammary gland"),
                ("main_lactiferous_ducts", "Lactiferous ducts"),
                ("main_lactiferous_sinuses", "Lactiferous sinuses"),
                ("suspensory_ligaments", "Suspensory ligaments of breast"),
            )
        }
        for s in "LR"
    },
}
# The midline whole of a part whose name says it is in the middle (the
# bladder's ureteric orifices are parts of the one bladder).
MIDLINE_GROUPS = {"Uterus", "Vagina", "Urinary bladder"}
# Vertex budget: the breasts come with ~1M vertices.
MAX_VERTICES = 6000
TISSUE_COLORS = {"reproductive": "#c77d9b", "urinary": "#d1b04a", "ligament": "#d8cfa8"}


def load(path: Path) -> dict[str, bpy.types.Object]:
    bpy.ops.import_scene.gltf(filepath=str(path))
    return {o.name: o for o in bpy.context.selected_objects if o.type == "MESH"}


def world(obj: bpy.types.Object) -> np.ndarray:
    m = np.array(obj.matrix_world)
    v = np.array([tuple(p.co) for p in obj.data.vertices])
    return v @ m[:3, :3].T + m[:3, 3]


def similarity(P: np.ndarray, Q: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Least-squares Q ≈ s·R·P + t (Umeyama)."""
    mp, mq = P.mean(0), Q.mean(0)
    X, Y = P - mp, Q - mq
    U_, D, Vt = np.linalg.svd(Y.T @ X / len(P))
    S = np.eye(3)
    S[2, 2] = np.sign(np.linalg.det(U_ @ Vt))
    A = (np.trace(np.diag(D) @ S) / (X**2).sum(1).mean()) * (U_ @ S @ Vt)
    return A, mq - A @ mp


def fit_pelvis(za: np.ndarray, hra: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """ICP, trimmed to the closest 85% (the pelvises differ in shape)."""
    tree = KDTree(len(za))
    for i, p in enumerate(za):
        tree.insert(p, i)
    tree.balance()
    src = hra[np.random.default_rng(0).choice(len(hra), min(6000, len(hra)), replace=False)]
    s = np.cbrt(np.prod((za.max(0) - za.min(0)) / (hra.max(0) - hra.min(0))))
    A, t = np.eye(3) * s, za.mean(0) - s * hra.mean(0)
    for _ in range(60):
        cur = src @ A.T + t
        nn = np.array([tree.find(p)[0] for p in cur])
        d = np.linalg.norm(nn - cur, axis=1)
        keep = d < np.quantile(d, 0.85)
        A, t = similarity(src[keep], nn[keep])
    d = np.array([tree.find(p)[2] for p in src @ A.T + t])
    print(f"Pelvis fit: scale {np.cbrt(np.linalg.det(A)):.3f}, median {np.median(d) * 1000:.1f} mm, p90 {np.quantile(d, 0.9) * 1000:.1f} mm")
    return A, t


def bvh(objs: list[bpy.types.Object]) -> BVHTree:
    verts, faces = [], []
    for o in objs:
        base = len(verts)
        verts += [tuple(p) for p in world(o)]
        faces += [tuple(base + i for i in poly.vertices) for poly in o.data.polygons]
    return BVHTree.FromPolygons(verts, faces)


def depth_map(tree: BVHTree, xs, zs, from_front: bool) -> np.ndarray:
    """First hit along y from the front (−y) or the back, per (x, z); NaN = miss."""
    out = np.full((len(xs), len(zs)), np.nan)
    y0, d = (-1.0, Vector((0, 1, 0))) if from_front else (1.0, Vector((0, -1, 0)))
    for i, x in enumerate(xs):
        for j, z in enumerate(zs):
            hit = tree.ray_cast(Vector((x, y0, z)), d)
            if hit[0] is not None:
                out[i, j] = hit[0].y
    return out


def fill_nearest(grid: np.ndarray) -> np.ndarray:
    known = np.argwhere(~np.isnan(grid))
    out = grid.copy()
    for i, j in np.argwhere(np.isnan(grid)):
        k = known[np.argmin(((known - (i, j)) ** 2).sum(1))]
        out[i, j] = grid[tuple(k)]
    return out


def rib_height_at(rib: bpy.types.Object, x: float) -> float:
    """Height of a rib's front arc where it crosses x (the midclavicular line)."""
    P = world(rib)
    near = P[(np.abs(P[:, 0] - x) < 0.008) & (P[:, 1] < -0.02)]
    return float(near[:, 2].mean())


def main() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    skeleton = load(ZA_DIR / "skeleton.glb")
    muscles = load(ZA_DIR / "muscles.glb")
    organs = load(ZA_DIR / "organs.glb")
    za_pelvis = np.vstack([world(skeleton[n]) for n in ("Hip bone.l", "Hip bone.r", "Sacrum", "Coccyx")])
    hra_pelvis_objs = load(HRA_DIR / "v1.2/VH_F_Pelvis.glb")
    hra_pelvis = np.vstack([world(o) for n, o in hra_pelvis_objs.items() if "spongy" not in n])
    A, t = fit_pelvis(za_pelvis, hra_pelvis)
    for o in hra_pelvis_objs.values():
        bpy.data.objects.remove(o, do_unlink=True)

    parts: dict[str, tuple[bpy.types.Object, tuple]] = {}
    for file, meshes in MESHES.items():
        objs = load(HRA_DIR / file)
        for name, o in objs.items():
            if name in meshes:
                parts[name] = (o, meshes[name])
            else:
                print("left out:", name)
                bpy.data.objects.remove(o, do_unlink=True)
    missing = {n for m in MESHES.values() for n in m} - set(parts)
    assert not missing, f"missing in the Atlas files: {missing}"

    def place(o: bpy.types.Object, A: np.ndarray, t: np.ndarray) -> None:
        P = world(o) @ A.T + t
        o.matrix_world = np.eye(4).tolist()  # identity; vertices now in world space
        for v, p in zip(o.data.vertices, P):
            v.co = p

    # Pelvic organs: pelvis fit, then the bladder onto Z-Anatomy's bladder.
    pelvic = [o for o, info in parts.values() if info[4] == "pelvis"]
    for o in pelvic:
        place(o, A, t)
    bladder = np.vstack([world(o) for o, info in parts.values() if info[1] == "Urinary bladder"])
    shift = world(organs["Urinary bladder"]).mean(0) - bladder.mean(0)
    print("Bladder shift (mm):", np.round(shift * 1000, 1))
    for o in pelvic:
        place(o, np.eye(3), shift)

    # Breasts: nipple on the midclavicular line at the 4th intercostal space,
    # back surface on the chest wall.
    chest = bvh([o for o in [*skeleton.values(), *muscles.values()] if world(o)[:, 2].max() > 0.95])
    for side, sign in (("L", 1), ("R", -1)):
        objs = [o for o, info in parts.values() if info[4] == "thorax" and info[0].endswith("." + side.lower())]
        for o in objs:
            place(o, A, np.zeros(3))
        clav = world(skeleton["Clavicle." + side.lower()])
        mcl = float((clav[:, 0].min() + clav[:, 0].max()) / 2)
        z4 = (rib_height_at(skeleton["Fourth rib." + side.lower()], mcl) + rib_height_at(skeleton["Fifth rib." + side.lower()], mcl)) / 2
        nipple = world(parts[f"VH_F_nipple_{side}"][0]).mean(0)
        move = np.array([mcl - nipple[0], 0.0, z4 - nipple[2]])
        for o in objs:
            place(o, np.eye(3), move)
        allp = np.vstack([world(o) for o in objs])
        xs = np.arange(allp[:, 0].min() - 0.004, allp[:, 0].max() + 0.004, 0.003)
        zs = np.arange(allp[:, 2].min() - 0.004, allp[:, 2].max() + 0.004, 0.003)
        wall = fill_nearest(depth_map(chest, xs, zs, from_front=True))
        back = fill_nearest(depth_map(bvh(objs), xs, zs, from_front=False))
        offset = wall - back - 0.0015  # just in front of the chest wall
        for o in objs:
            for v in o.data.vertices:
                i = int(np.clip(round((v.co.x - xs[0]) / 0.003), 0, len(xs) - 1))
                j = int(np.clip(round((v.co.z - zs[0]) / 0.003), 0, len(zs) - 1))
                v.co.y += offset[i, j]
        print(f"Breast {side}: midclavicular x {mcl:.3f}, 4th intercostal z {z4:.3f}, back moved {np.nanmedian(offset) * 1000:.0f} mm")

    # Decimate, name, material.
    materials = {}
    for tissue, color in TISSUE_COLORS.items():
        mat = bpy.data.materials.new(tissue)
        mat.use_nodes = True
        c = [int(color[i : i + 2], 16) / 255 for i in (1, 3, 5)]
        lin = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
        mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*lin, 1)
        mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.55
        materials[tissue] = mat
    manifest = []
    for o, (name, group, system, tissue, region) in parts.values():
        # glTF import splits vertices along normal seams; weld them first so
        # decimation can collapse across them.
        bm = bmesh.new()
        bm.from_mesh(o.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
        bm.to_mesh(o.data)
        bm.free()
        n = len(o.data.vertices)
        if n > MAX_VERTICES:
            mod = o.modifiers.new("decimate", "DECIMATE")
            mod.ratio = MAX_VERTICES / n
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.modifier_apply(modifier=mod.name)
        o.name = o.data.name = name
        o.data.materials.clear()
        o.data.materials.append(materials[tissue])
        for poly in o.data.polygons:
            poly.material_index = 0
        entry = {
            "name": name,
            "system": system,
            "tissue": tissue,
            "region": region,
            "pack": "female",
            "vertices": len(o.data.vertices),
            "source": "Human Reference Atlas",
            "sex": "female",
        }
        if group:
            entry["group"] = group
            if group in MIDLINE_GROUPS:
                entry["groupSide"] = "midline"
        manifest.append(entry)

    keep = {o for o, _ in parts.values()}
    for o in keep:  # flat, like the other packs (the Atlas nests cervix → os)
        matrix = o.matrix_world.copy()
        o.parent = None
        o.matrix_world = matrix
    for o in list(bpy.data.objects):
        if o not in keep:
            bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(OUT_GLB), export_format="GLB", use_selection=True, export_yup=True,
        export_apply=True, export_normals=True, export_texcoords=False, export_materials="EXPORT",
        export_cameras=False, export_lights=False, export_animations=False,
    )
    manifest.sort(key=lambda m: m["name"])
    OUT_MANIFEST.write_text(json.dumps(manifest, indent=1, ensure_ascii=False))
    print(f"female: {len(manifest)} meshes, {sum(m['vertices'] for m in manifest)} vertices")


main()
