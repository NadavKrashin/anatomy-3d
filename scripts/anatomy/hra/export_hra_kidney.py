"""
Kidneys from the Human Reference Atlas (HuBMAP, Visible Human Male, v1.2,
CC BY 4.0), fitted into the Z-Anatomy body for both bodies. They replace
the non-commercial kidney (docs/DECISIONS.md → "Atlas kidney").

    python scripts/anatomy/hra/export_hra_kidney.py -- <VH_Male dir> \
        <out kidney.glb> <out manifest-hra-kidney.json> [--fit <decoded dir>]

<VH_Male dir> is that folder of github.com/hubmapconsortium/
ccf-3d-reference-object-library (v1.2/VH_M_Kidney_L/R.glb,
v1.2/VH_M_Ureter_L/R.glb). Placement: per side, a similarity transform
(rotation, uniform scale, translation) found by trimmed ICP from the
Atlas's kidney capsule to the kidney it replaces (Z-Anatomy's "Kidney" by
lissiecowley, non-commercial). That kidney is gone from the shipped files,
so the transforms are kept in kidney-fit.json next to this script;
`--fit <decoded dir>` recomputes them from a decoded copy of the old
non-commercial file (`git show <commit>:public/models/non-commercial/
non-commercial.glb`, decoded as in scripts/anatomy/handmade/README.md).

Every run checks the placement against the body (out/decoded, the body
cache of scripts/anatomy/handmade/body_cache.py): hilum medial and forward,
the renal pelvis meeting Z-Anatomy's ureter and its renal artery and vein
reaching the hilum (≤ 3 mm), poles at T12 and L3 with the right kidney
lower, no overlap with the liver, spleen, psoas major or quadratus
lumborum.

Kept, per side (each a part of the whole "Kidney"): fibrous capsule,
renal cortex, renal columns, renal pyramids, renal papillae (several
Atlas meshes joined into one), hilum, minor and major calyces, renal
pelvis. Also the hilar end of the Atlas's renal vein, as "Renal vein.l/.r"
— the same structure as Z-Anatomy's "Left/Right renal vein", which stops
15–20 mm short of the kidney (the non-commercial kidney's intrarenal veins
bridged that): the Atlas vein lateral to where Z-Anatomy's ends, its
medial end blended onto that end. Left out: the Atlas's ureters and renal
arteries (Z-Anatomy has them — the artery's anterior and posterior
branches reach the kidney — joined to its aorta and bladder) and the rest
of its renal veins.
"""
import json
import re
import sys
from pathlib import Path

import bpy
import bmesh  # only importable after bpy
import numpy as np
from mathutils.kdtree import KDTree

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "scripts/anatomy/handmade"))
from body_cache import load_body  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1 :]
HRA_DIR, OUT_GLB, OUT_MANIFEST = (Path(p) for p in args[:3])
FIT_DIR = Path(args[args.index("--fit") + 1]) if "--fit" in args else None
FIT_FILE = Path(__file__).with_name("kidney-fit.json")
DECODED = ROOT / "out/decoded"

# Atlas mesh name pattern (per file) → app name (".l"/".r" added).
PARTS = (
    (r"VH_M_kidney_capsule_[LR]", "Fibrous capsule of kidney"),
    (r"VH_M_outer_cortex_of_kidney_[LR]", "Renal cortex"),
    (r"VH_M_renal_column_[LR]", "Renal columns"),
    (r"VH_M_renal_pyramid_.*", "Renal pyramids"),
    (r"VH_M_renal_papilla_.*", "Renal papillae"),
    (r"VH_M_hilum_of_kidney_[LR]", "Hilum of kidney"),
    (r"VH_M_minor_calyx_.*", "Minor calyces"),
    (r"VH_M_major_calyx_.*", "Major calyces"),
    (r"VH_M_renal_pelvis_[LR]", "Renal pelvis"),
)
LEFT_OUT = (r"VH_M_ureter_[LR]",)  # Z-Anatomy's ureter, joined to its bladder
VEINS = {"l": "VH_M_renal_vein_L", "r": "VH_M_renal_vein_R"}
MAX_VERTICES = 6000
COLORS = {"urinary": "#d1b04a", "vein": "#4a6fb5"}  # as TISSUE_COLORS in z-anatomy/export_glb.py
MM = 0.001


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


def icp(target: np.ndarray, source: np.ndarray) -> tuple[np.ndarray, np.ndarray, float]:
    """Similarity transform source → target by trimmed ICP (closest 90 %),
    from the centroids and the bounding boxes' size ratio; median distance."""
    tree = KDTree(len(target))
    for i, p in enumerate(target):
        tree.insert(p, i)
    tree.balance()
    src = source[np.random.default_rng(0).choice(len(source), min(4000, len(source)), replace=False)]
    s = np.cbrt(np.prod((target.max(0) - target.min(0)) / (source.max(0) - source.min(0))))
    A, t = np.eye(3) * s, target.mean(0) - s * source.mean(0)
    for _ in range(80):
        cur = src @ A.T + t
        nn = np.array([tree.find(p)[0] for p in cur])
        d = np.linalg.norm(nn - cur, axis=1)
        keep = d < np.quantile(d, 0.9)
        A, t = similarity(src[keep], nn[keep])
    d = np.array([tree.find(p)[2] for p in src @ A.T + t])
    return A, t, float(np.median(d))


def main() -> None:
    # The body first: (re)building its cache resets Blender's scene.
    raw = load_body(DECODED, exclude=("hra-kidney",))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if FIT_DIR is not None:
        nc = load(FIT_DIR / "non-commercial-non-commercial.glb")
        targets = {s: world(nc[f"Kidney.{s}"]) for s in "lr"}
        for o in nc.values():
            bpy.data.objects.remove(o, do_unlink=True)

    parts: dict[str, list[bpy.types.Object]] = {}
    for S in "LR":
        s = S.lower()
        for file in (f"v1.2/VH_M_Kidney_{S}.glb", f"v1.2/VH_M_Ureter_{S}.glb"):
            for name, o in load(HRA_DIR / file).items():
                app = next((a for pat, a in PARTS if re.fullmatch(pat, name)), None)
                if app is None:
                    assert any(re.fullmatch(p, name) for p in LEFT_OUT), f"unknown Atlas mesh {name} in {file}"
                    print("left out:", name)
                    bpy.data.objects.remove(o, do_unlink=True)
                    continue
                parts.setdefault(f"{app}.{s}", []).append(o)
    assert len(parts) == 2 * len(PARTS), sorted(parts)
    vessels = load(HRA_DIR / "v1.2/VH_M_Blood_Vasculature_Kidney.glb")
    for s, name in VEINS.items():
        parts[f"Renal vein.{s}"] = [vessels.pop(name)]
    for o in vessels.values():
        print("left out:", o.name)
        bpy.data.objects.remove(o, do_unlink=True)

    # Fit: per side, the capsule onto the kidney it replaces, then moved out
    # of its neighbours (the old kidney overlapped psoas by 5–8 %).
    if FIT_DIR is not None:
        from landmarks import Body  # noqa: PLC0415

        body = Body(raw)
        fit = {}
        for s in "lr":
            cap = world(parts[f"Fibrous capsule of kidney.{s}"][0])
            A, t, med = icp(targets[s], cap)
            A, t, moved, shrink = settle(body, cap @ A.T + t, A, t, s)
            fit[s] = {"A": A.tolist(), "t": t.tolist(), "scale": float(np.cbrt(np.linalg.det(A))),
                      "median_mm": round(med / MM, 2), "settle_max_move_mm": round(moved / MM, 2),
                      "shrunk_percent": round(shrink * 100, 1)}
            print(f"Kidney.{s} fit: median {med / MM:.1f} mm, then out of its neighbours (no point moved more "
                  f"than {moved / MM:.1f} mm) and {shrink * 100:.0f} % smaller: scale {fit[s]['scale']:.3f}")
        FIT_FILE.write_text(json.dumps(fit, indent=1) + "\n")
    fit = json.loads(FIT_FILE.read_text())

    # Place: vertices in world space (Blender frame), objects flat.
    for name, objs in parts.items():
        A, t = np.array(fit[name[-1]]["A"]), np.array(fit[name[-1]]["t"])
        for o in objs:
            P = world(o) @ A.T + t
            o.parent = None
            o.matrix_world = np.eye(4).tolist()
            for v, p in zip(o.data.vertices, P):
                v.co = p
    body = raw
    for s in "lr":
        hilar_vein(parts[f"Renal vein.{s}"][0], body, s)
        ureteropelvic_junction(parts[f"Renal pelvis.{s}"][0], body, s)

    # Join the multi-mesh parts, weld, decimate, name, material.
    mats = {}
    for tissue, color in COLORS.items():
        mat = bpy.data.materials.new(tissue)
        mat.use_nodes = True
        c = [int(color[i : i + 2], 16) / 255 for i in (1, 3, 5)]
        lin = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
        mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*lin, 1)
        mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.5 if tissue == "urinary" else 0.45
        mats[tissue] = mat
    manifest, keep = [], []
    for name, objs in sorted(parts.items()):
        bpy.ops.object.select_all(action="DESELECT")
        for o in objs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        if len(objs) > 1:
            bpy.ops.object.join()
        o = objs[0]
        bm = bmesh.new()
        bm.from_mesh(o.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
        # The Atlas's triangles face inwards in patches (the cortex's front):
        # the app draws front faces only, so it showed the inside there.
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(o.data)
        bm.free()
        n = len(o.data.vertices)
        if n > MAX_VERTICES:
            mod = o.modifiers.new("decimate", "DECIMATE")
            mod.ratio = MAX_VERTICES / n
            bpy.ops.object.modifier_apply(modifier=mod.name)
        o.name = o.data.name = name
        o.data.materials.clear()
        o.data.materials.append(mats["vein" if name.startswith("Renal vein") else "urinary"])
        for poly in o.data.polygons:
            poly.material_index = 0
        keep.append(o)
        vein = name.startswith("Renal vein")
        manifest.append({
            "name": name, "system": "cardiovascular" if vein else "urinary", "tissue": "vein" if vein else "urinary",
            "region": "abdomen", "pack": "hra-kidney", "vertices": len(o.data.vertices),
            "source": "Human Reference Atlas", **({} if vein else {"group": "Kidney"}),
        })

    check({o.name: (world(o), np.array([tuple(t.vertices) for t in o.data.loop_triangles]))
           for o in keep if not o.data.calc_loop_triangles()}, body)
    for o in list(bpy.data.objects):
        if o not in keep:
            bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(OUT_GLB), export_format="GLB", use_selection=True, export_yup=True,
        export_apply=True, export_normals=True, export_texcoords=False, export_materials="EXPORT",
        export_cameras=False, export_lights=False, export_animations=False,
    )
    OUT_MANIFEST.write_text(json.dumps(manifest, indent=1, ensure_ascii=False))
    print(f"kidney: {len(manifest)} meshes, {sum(m['vertices'] for m in manifest)} vertices")


def neighbours(s: str) -> tuple[str, ...]:
    return ("Liver", "Spleen", f"Psoas major.{s}", f"Quadratus lumborum muscle.{s}")


def rigid(P: np.ndarray, Q: np.ndarray, w: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Weighted least-squares rotation and translation P → Q (Kabsch)."""
    w = w / w.sum()
    mp, mq = w @ P, w @ Q
    U_, _, Vt = np.linalg.svd((P - mp).T @ ((Q - mq) * w[:, None]))
    S = np.eye(3)
    S[2, 2] = np.sign(np.linalg.det(Vt.T @ U_.T))
    R = Vt.T @ S @ U_.T
    return R, mq - R @ mp


def settle(body, cap: np.ndarray, A: np.ndarray, t: np.ndarray, s: str):
    """Move the placed capsule until none of its vertices is inside a
    neighbour, as little as possible: each round the rigid move (rotation
    and translation) that best takes its inside vertices out (to the
    nearest surface + 0.5 mm, weight 10) while the rest stay put (weight 1)
    — a kidney wedged between psoas below-medially and the liver
    above-laterally turns rather than slides; where that is not enough,
    1 % smaller every 30 rounds, at most 5 %. Inside: the winding number,
    as in the final check (the spleen's normals disagree with it in places).
    Returns the new A, t, the largest vertex move and the shrink."""
    names = set(neighbours(s))
    c = cap.mean(0)
    R, tr, f = np.eye(3), np.zeros(3), 1.0
    for k in range(300):
        P = f * (cap - c) @ R.T + c + tr
        obstacles = body.obstacles(P.min(0), P.max(0), None, only=names)
        Q, w = P.copy(), np.ones(len(P))
        for i, hits in enumerate(obstacles.hits(P, 0.0, exact=True)):
            for _, loc, _, sd in hits:
                if sd < 0:
                    d = loc - P[i]
                    Q[i] = P[i] + d + d / max(np.linalg.norm(d), 1e-9) * 0.0005
                    w[i] = 10.0
        if (w == 1).all():
            break
        Rk, tk = rigid(P, Q, w)
        R, tr = Rk @ R, Rk @ (c + tr) + tk - c
        if k % 30 == 29 and f > 0.951:
            f *= 0.99
    else:
        raise AssertionError(f"Kidney.{s} could not be moved out of its neighbours")
    P = f * (cap - c) @ R.T + c + tr
    return f * R @ A, f * R @ (t - c) + c + tr, float(np.linalg.norm(P - cap, axis=1).max()), 1 - f


def ureteropelvic_junction(o: bpy.types.Object, raw: dict, s: str) -> None:
    """Where the renal pelvis doesn't reach Z-Anatomy's ureter (on the right,
    the kidney had to turn out of psoas, whose surface the model's ureter
    runs up inside): its lower end (lowest 2 mm) is moved onto the nearest
    point of the ureter, 1 mm into it, the move fading to none 40 % of the
    way up the pelvis (its upper part stays in the renal sinus)."""
    from mathutils.bvhtree import BVHTree  # noqa: PLC0415

    V, F, _ = raw[f"Ureter.{s}"]
    tree = BVHTree.FromPolygons([tuple(p) for p in V.astype(float)], [tuple(f) for f in F])
    P = np.array([tuple(v.co) for v in o.data.vertices])
    gap = min(tree.find_nearest(p)[3] for p in P)
    if gap <= 1 * MM:
        print(f"Renal pelvis.{s}: meets the ureter ({gap / MM:.1f} mm)")
        return
    z0, z1 = P[:, 2].min(), P[:, 2].max()
    end = P[P[:, 2] < z0 + 2 * MM].mean(0)
    loc = np.array(tree.find_nearest(end)[0])
    move = loc - end
    move += move / np.linalg.norm(move) * 1 * MM
    for v in o.data.vertices:
        w = np.clip(1 - (v.co.z - z0) / (0.4 * (z1 - z0)), 0, 1)
        v.co += type(v.co)(move * w)
    print(f"Renal pelvis.{s}: {gap / MM:.1f} mm from the ureter; lower end moved {np.linalg.norm(move) / MM:.1f} mm onto it")


def hilar_vein(o: bpy.types.Object, raw: dict, s: str) -> None:
    """The Atlas renal vein's part lateral to the end of Z-Anatomy's (from
    1 mm medial to it), its medial end moved onto that end, fading to no
    move 60 % of the way to the hilum."""
    sx = 1 if s == "l" else -1
    za = raw[f"{'Left' if s == 'l' else 'Right'} renal vein"][0].astype(float)
    x_end = sx * (sx * za[:, 0]).max()
    end = za[sx * za[:, 0] > sx * x_end - 3 * MM].mean(0)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    cut = [f for f in bm.faces if any(sx * v.co.x < sx * x_end - 1 * MM for v in f.verts)]
    bmesh.ops.delete(bm, geom=cut, context="FACES")
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    P = np.array([tuple(v.co) for v in bm.verts])
    assert len(P), f"the Atlas renal vein.{s} does not reach past Z-Anatomy's"
    x0, x1 = (sx * P[:, 0]).min(), (sx * P[:, 0]).max()
    medial = P[sx * P[:, 0] < x0 + 1.5 * MM].mean(0)
    move = end - medial
    for v in bm.verts:
        w = np.clip(1 - (sx * v.co.x - x0) / (0.6 * (x1 - x0)), 0, 1)
        v.co += type(v.co)(move * w)
    bm.to_mesh(o.data)
    bm.free()
    print(f"Renal vein.{s}: hilar segment {(x1 - x0) / MM:.0f} mm, medial end moved {np.linalg.norm(move) / MM:.1f} mm "
          f"onto Z-Anatomy's vein")


def check(K: dict[str, np.ndarray], raw: dict) -> None:
    """The placement checks of HANDMADE_MODELS_PROMPT.md item 25 (asserted)."""
    from landmarks import Body  # noqa: PLC0415 — the handmade tooling's geometry

    body = Body(raw)
    zs = {v: body.V(f"Vertebra {v}")[:, 2] for v in ("T11", "T12", "L1", "L2", "L3", "L4")}
    low = {}
    for name, (V, F) in K.items():
        body.add(name, V, F, None)
    K = {name: V for name, (V, _) in K.items()}
    for s, sx in (("l", 1), ("r", -1)):
        cap = K[f"Fibrous capsule of kidney.{s}"]
        c, h = cap.mean(0), K[f"Hilum of kidney.{s}"].mean(0)
        d = (h - c) / np.linalg.norm(h - c)
        top, bottom = cap[:, 2].max(), cap[:, 2].min()
        low[s] = bottom
        side = "Left" if s == "l" else "Right"

        def gap(mesh: str, points: np.ndarray) -> float:
            # Distance from the points to the mesh; 0 where they enter it.
            inside = body.winding(mesh, points[:: max(1, len(points) // 400)]) > 0.5
            if inside.any():
                return 0.0
            return min(body.nearest(mesh, p)[2] for p in points[:: max(1, len(points) // 400)])

        pelvis_ureter = gap(f"Ureter.{s}", K[f"Renal pelvis.{s}"])
        kidney = np.vstack([K[f"Hilum of kidney.{s}"], K[f"Renal pelvis.{s}"], cap])
        # The artery through its anterior and posterior branches; the vein
        # through the hilar segment (which must also meet Z-Anatomy's vein).
        artery = min(gap(m, kidney) for m in (f"{side} renal artery", f"Anterior branch of renal artery.{s}",
                                                  f"Posterior branch of renal artery.{s}"))
        vein = max(gap(f"Renal vein.{s}", kidney), gap(f"{side} renal vein", K[f"Renal vein.{s}"]))
        print(f"Kidney.{s}: hilum direction {np.round(d, 2)} (medial {sx * -d[0]:.2f}, forward {-d[1]:.2f}); "
              f"upper pole {top / MM:.0f} mm (T12 {zs['T12'].min() / MM:.0f}–{zs['T12'].max() / MM:.0f}), "
              f"lower pole {bottom / MM:.0f} mm (L3 {zs['L3'].min() / MM:.0f}–{zs['L3'].max() / MM:.0f}); "
              f"renal pelvis–ureter {pelvis_ureter / MM:.1f} mm, renal artery {artery / MM:.1f} mm, "
              f"renal vein {vein / MM:.1f} mm")
        assert -sx * d[0] > 0.3 and -d[1] > 0, "the hilum must face medially and forward"
        assert zs["T12"].min() <= top <= zs["T11"].max(), "upper pole at T12"
        assert zs["L3"].min() <= bottom <= zs["L2"].max(), "lower pole at L3"
        for what, g in (("renal pelvis–ureter", pelvis_ureter), ("renal artery", artery), ("renal vein", vein)):
            assert g <= 3 * MM, f"{what} gap {g / MM:.1f} mm > 3 mm"
        for organ in neighbours(s):
            V, P = body.V(organ), cap
            box = ((P >= V.min(0)) & (P <= V.max(0))).all(1)
            n_in = int((body.winding(organ, P[box]) > 0.5).sum()) if box.any() else 0
            print(f"   capsule vertices inside {organ}: {n_in} of {len(P)}")
            assert n_in == 0, f"Kidney.{s} overlaps {organ}"
    print(f"right lower pole {(low['l'] - low['r']) / MM:.0f} mm below the left")
    assert low["r"] < low["l"], "the right kidney sits lower"


main()
