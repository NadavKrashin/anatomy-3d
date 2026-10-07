"""
Hand-built nerves and vessels of the neck and the root of the neck, with the
phrenic nerves (neck + thorax). Courses: Gray's Anatomy for Students, Moore's
Clinically Oriented Anatomy, Netter — the textbook-typical pattern where
variants exist. Every landmark is measured on the named meshes; offsets are
stated with their reason. Frame: metres, +x = the body's left, −y =
anterior, +z = up. `sx` = +1 on the left, −1 on the right.
"""
import re

import numpy as np

from landmarks import Allow
from parts import MM, Builder, Part, point_at, unit

SIDES = {"l": 1.0, "r": -1.0}
NODES = r".*nodes.*"
LUNG = r"(Superior|Middle|Inferior) lobe of (left|right) lung"  # lymph-node groups: nerves and vessels run past them in fat


def sided(name: str, side: str) -> str:
    """'Left subclavian artery' → 'Right subclavian artery' on the right; '{s}' → l/r."""
    if name.startswith("Left ") and side == "r":
        return "Right " + name[5:]
    return name.replace("{s}", side)


# ---------------------------------------------------------------- phrenic
PHRENIC_R = 1.25 * MM  # Ø 2.5 mm


def scalenus_front(b: Builder, side: str, z: float, frac: float, offset: float) -> np.ndarray:
    """
    A point on the anterior surface of scalenus anterior at height z,
    `frac` of the way from its lateral (0) to its medial (1) border (< 0:
    beyond the lateral border, level with its front), `offset` in front of
    the surface (ray cast from the front).
    """
    sx, sa = SIDES[side], f"Scalenus anterior muscle.{side}"
    S = b.body.slab(sa, 2, z, 0.0015)
    lateral, medial = (S[:, 0].max(), S[:, 0].min()) if sx > 0 else (S[:, 0].min(), S[:, 0].max())
    # Stay 1.5 mm inside the borders so the ray meets the front, not the edge.
    x = lateral + (medial - lateral) * frac - sx * 1.5 * MM * (1 - 2 * frac)
    hit = b.body.ray(sa, (x if frac >= 0 else lateral - sx * 1.5 * MM, -0.10, z), (0, 1, 0))
    hit[0] = x
    assert hit is not None, f"no front of {sa} at z={z}"
    return hit - np.array([0, offset, 0])


def anterior_tubercle(b: Builder, vertebra: str, side: str) -> np.ndarray:
    """Tip of the anterior tubercle of a cervical transverse process: the most
    lateral vertex in front of the foramen transversarium (y < 12.5 mm)."""
    return b.body.extreme(vertebra, (SIDES[side], 0, 0), lambda V: V[:, 1] < 12.5 * MM)


def heart_border(b: Builder, side: str, z: float, y_max: float, out: float, r: float) -> np.ndarray:
    """
    The heart's border on one side at height z — its most lateral point in
    front of the lung root (y < y_max) — pushed `out` along the surface
    normal: the nerve runs on the fibrous pericardium, which is not modelled.
    Where the lung lies closer than that (the model has no pleura), halfway
    to the lung, but at least r + 0.8 mm off the heart.
    """
    sx = SIDES[side]
    names = ["Left ventricle", "Left atrium", "Right ventricle", "Right atrium", "Pulmonary trunk",
             "Ascending aorta", "Superior vena cava"]
    best, best_name = None, None
    for n in names:
        S = b.body.slab(n, 2, z, 0.0015)
        S = S[S[:, 1] < y_max]
        if len(S):
            v = S[np.argmax(sx * S[:, 0])]
            if best is None or sx * v[0] > sx * best[0]:
                best, best_name = v, n
    assert best is not None, f"no heart at z={z}"
    _, normal, _ = b.body.nearest(best_name, best)
    n = np.array([normal[0], normal[1], 0.0])
    n = unit(n) if n @ np.array([sx, 0, 0]) > 0.3 else np.array([sx, 0, 0])
    gaps = [b.body.ray(lobe, best + n * 1e-4, n, 0.05) for lobe in b.body.names if re.fullmatch(LUNG, lobe)]
    gap = min((np.linalg.norm(g - best) for g in gaps if g is not None), default=1.0)
    return best + n * max(min(out, gap / 2), r + 0.8 * MM)


def lateral_surface(b: Builder, mesh: str, side: str, z: float, y_range) -> np.ndarray:
    """Most lateral point of a mesh at height z among y in `y_range`, by rays
    cast from the side every 1 mm (coarse vessel meshes have few vertices)."""
    sx, best = SIDES[side], None
    for y in np.arange(y_range[0], y_range[1] + 1e-9, 1 * MM):
        hit = b.body.ray(mesh, (sx * 0.15, y, z), (-sx, 0, 0))
        if hit is not None and (best is None or sx * hit[0] > sx * best[0]):
            best = hit
    assert best is not None, f"{mesh} not found at z={z}"
    return best


def on_diaphragm(b: Builder, p, lift: float) -> np.ndarray:
    """The diaphragm's upper surface below p (vertical ray), lifted by `lift` along its normal."""
    hit, normal = b.body.ray("Diaphragm", np.asarray(p) + np.array([0, 0, 0.03]), (0, 0, -1), 0.12, normal=True)
    assert hit is not None, f"no diaphragm below {np.round(np.asarray(p) * 1000)}"
    return hit + unit(normal if normal[2] > 0 else -normal) * lift


def phrenic(b: Builder, side: str) -> None:
    """
    Phrenic nerve (C3–C5, mainly C4). Neck: three roots from the anterior
    rami at the anterior tubercles of C3–C5 join at the lateral border of
    scalenus anterior (upper thyroid cartilage level); the nerve descends on
    the muscle's anterior surface, crossing it obliquely from lateral to
    medial border, deep to the IJV/SCM and behind the transverse cervical
    artery. Root of the neck: in front of the subclavian artery, behind the
    subclavian vein, medial to the internal thoracic artery's origin.
    Thorax, right: lateral to the right brachiocephalic vein, SVC and right
    atrium (on the pericardium), in front of the lung root, to the diaphragm
    beside the IVC. Left: over the left side of the aortic arch in front of
    the vagus, then over the left auricle/ventricle, in front of the lung
    root, to the diaphragm near the apex. Each ends in 3–4 branches on and
    through the diaphragm.
    """
    sx = SIDES[side]
    name = f"Phrenic nerve.{side}"
    part = Part(name, "nervous", "nerve", "thorax")
    sa = f"Scalenus anterior muscle.{side}"
    # Lies on scalenus anterior under the prevertebral fascia: may touch it.
    # The lateral pericardial / prepericardial nodes sit on its course.
    # The model's lungs lie directly on the heart (no pleura or pericardium):
    # where they leave no room the nerve keeps clear of the heart and sinks
    # into the lung surface, at most 5 mm (reported).
    # Scalenus medius lies against the junction's back at the top, and the
    # nerve lies against the back of the carotid sheath (common carotid).
    # The ansa's inferior root and its twig to the omohyoid's inferior belly
    # cross in front of it on the muscle (the model's neck is compressed).
    ansa = rf"(Superior root|Inferior root|Muscular branches) of ansa cervicalis\.{side}"
    trunk_allow = Allow(touch=(sa, NODES, rf"Scalenus medius muscle\.{side}", sided("Left common carotid artery", side),
                               ansa), start=(sa, r"Longus (capitis|colli) muscle\..", rf"Vagus nerve \(X\)\.{side}"), end=("Diaphragm",), zone=0.004,
                        squeeze=(LUNG,), depth=5.0 * MM)

    # On the muscle: centre 1 mm + radius in front of its surface.
    on_sa = PHRENIC_R + 1.0 * MM
    z_join = 1.487  # roots join here: lateral border of scalenus anterior, upper thyroid cartilage level
    # Junction and the first 2 cm: just lateral to the muscle's lateral
    # border (radius + 1.8 mm), level with its middle — behind the carotid, in
    # front of scalenus medius (the model's carotid covers the muscle's front
    # here, see below); then on the muscle's front.
    def beside(z):
        S = b.body.slab(sa, 2, z, 0.0015)
        lat = S[np.argmax(sx * S[:, 0])]
        return np.array([lat[0] + sx * (PHRENIC_R + 1.8 * MM), (S[:, 1].min() + S[:, 1].max()) / 2 + 0.5 * MM, z])

    neck = [beside(z_join), beside(1.477), beside(1.467)] + [scalenus_front(b, side, z, f, on_sa) for z, f in
                                                           ((1.455, 0.5), (1.442, 0.92))]
    # Model quirk: at z ≈ 1.47–1.49 the common carotid mesh encloses the
    # front of scalenus anterior; there the nerve runs just lateral to the
    # artery (radius + 1 mm), still in front of the muscle's lateral part.
    cca = sided("Left common carotid artery", side)
    for i, p in enumerate(neck):
        if b.body.inside(cca, p) or b.body.nearest(cca, p)[2] < PHRENIC_R + 0.8 * MM:
            C = b.body.V(cca)
            C = C[np.abs(C[:, 2] - p[2]) < 3 * MM]
            x_lat = C[np.argmax(SIDES[side] * C[:, 0]), 0]  # (the top of the coarse mesh: by vertices)
            neck[i] = np.array([x_lat + SIDES[side] * (PHRENIC_R + 1.0 * MM), p[1], p[2]])

    # Root of the neck (z ≈ 1.415): between the subclavian vein (in front)
    # and the subclavian artery (behind), 8 mm medial to the internal
    # thoracic artery's origin (its highest point).
    ita_origin = b.body.extreme(f"Internal thoracic artery.{side}", (0, 0, 1))
    z_root = 1.415
    x_root = ita_origin[0] - sx * 8 * MM
    near = lambda V: V[(np.abs(V[:, 0] - x_root) < 3 * MM) & (np.abs(V[:, 2] - z_root) < 3 * MM)]  # noqa: E731
    vein = near(b.body.V(sided("Left subclavian vein", side)))
    artery = near(b.body.V(sided("Left subclavian artery", side)))
    y_root = (vein[:, 1].max() + artery[:, 1].min()) / 2 if len(vein) and len(artery) else neck[-1][1]
    root = np.array([x_root, y_root, z_root])

    if side == "l":
        # Then down and medially past the lung's apex (which bulges medially
        # above the arch in the model): 3 mm lateral to and 9 mm in front of
        # the left common carotid's axis (z 1.400).
        cc = b.body.centre_at("Left common carotid artery", 2, 1.400, 0.006)
        lat = lateral_surface(b, "Left common carotid artery", side, 1.400, (cc[1] - 4 * MM, cc[1] + 4 * MM))
        upper = [np.array([lat[0] + 3 * MM, cc[1] - 9 * MM, 1.400])]
        # Left side of the aortic arch, in front of the vagus (which the
        # model runs through the arch at y ≈ 0–3 mm): the arch's most lateral
        # point among y in [−16, −4] mm, + radius + 1.2 mm laterally.
        for z in (1.386, 1.374, 1.364):
            v = lateral_surface(b, "Aortic arch", side, z, (-16 * MM, -4 * MM))
            upper.append(v + np.array([PHRENIC_R + 1.2 * MM, 0, 0]))
        heart_z = (1.345, 1.330, 1.315, 1.300, 1.285, 1.270)
    else:
        # Lateral to the right brachiocephalic vein, then the SVC: their
        # lateral surface (ray cast from the right through the vessel's
        # centre) + radius + 1.2 mm.
        upper = []
        for vessel, z in (("Right brachiocephalic vein", 1.398), ("Right brachiocephalic vein", 1.385),
                          ("Superior vena cava", 1.370), ("Superior vena cava", 1.352)):
            c = b.body.centre_at(vessel, 2, z, 0.004)
            v = b.body.ray(vessel, (-0.10, c[1], z), (1, 0, 0))
            upper.append(v - np.array([PHRENIC_R + 1.2 * MM, 0, 0]))
        heart_z = (1.335, 1.318, 1.300, 1.282, 1.265)
    # On the pericardium, in front of the lung root — left: y < −2 mm (the
    # left pulmonary veins/artery start at y ≈ 0); right: y < −14 mm (the
    # right pulmonary artery reaches y = −12 mm) — centre 4 mm outside the
    # heart (HANDMADE_MODELS_PROMPT.md §4).
    root_front = -2 * MM if side == "l" else -14 * MM
    heart = [heart_border(b, side, z, root_front, 4 * MM, PHRENIC_R) for z in heart_z]
    # Down the heart's side to where it rests on the diaphragm (the lung base
    # slips under the heart beside it): the most lateral point of the
    # ventricle's / atrium's lowest 6 mm, 4.5 mm further out, on the diaphragm.
    # On the right that is just lateral to the IVC's entry into the atrium.
    L = b.body.V("Left ventricle" if side == "l" else "Right atrium")
    L = L[L[:, 2] < L[:, 2].min() + 6 * MM]
    low = L[np.argmax(sx * L[:, 0])]
    end = on_diaphragm(b, low + np.array([sx * 4.5 * MM, 0, 0]), PHRENIC_R + 0.3 * MM)
    heart.append((heart[-1] + end) / 2 + np.array([-sx * 1.5 * MM, 0, 0]))
    trunk_ctrl = neck + [root] + upper + heart + [end]
    # The trunk thickens over its first 15 mm as the roots join (Ø 1.75 → 2.5 mm).
    trunk = b.vessel(part, "trunk", trunk_ctrl, PHRENIC_R, trunk_allow, start_taper=0.015, tip=0.7, end_taper=0.0)

    # Roots: C3 and C4 to the junction, C5 to the trunk 15 mm lower. Each
    # starts 1.5 mm lateral to the anterior tubercle tip (the anterior ramus
    # emerges between the tubercles) and may touch its vertebra there.
    # Roots end on the trunk at the junction, which lies against longus
    # capitis at the top of scalenus anterior: may touch both there.
    root_allow = Allow(end=(r"Longus (capitis|colli) muscle\..", sa), start=(r"Vertebra C[345]", r"Intertransverse ligaments.*", r"Longus .*", sa,
                              rf"Scalenus (medius|posterior) muscle.{side}", rf"Levator scapulae.{side}",
                              r"(Iliocostalis|Longissimus) colli muscle\..",
                              sided("Roots of brachial plexus.{s}", side)),
                       touch=(sa, rf"Scalenus medius muscle\.{side}"), zone=0.006)
    join = trunk.path[0]
    for vertebra, target in (("Vertebra C3", join), ("Vertebra C4", join),
                             ("Vertebra C5", point_at(trunk.path, z_join - 0.015))):
        t = anterior_tubercle(b, vertebra, side) + np.array([sx * 1.5 * MM, -0.5 * MM, 0])
        mid = (t + target) / 2 + np.array([0, -1.5 * MM, 0])
        b.vessel(part, f"root {vertebra[-2:]}", [t, mid, target], 0.9 * MM, root_allow,
                 start_taper=0.0, end_taper=0.0)

    # Terminal branches on the diaphragm (anterior, lateral, posterior) and
    # one through it to its abdominal surface; 0.6 mm, 18–22 mm long.
    E = trunk.path[-1]
    # The lung bases rest on the diaphragm in the model: same lung allowance.
    branch_allow = Allow(touch=("Diaphragm",), start=("Diaphragm", "Right atrium", r"Inferior vena cava.*"),
                         zone=0.004, squeeze=(LUNG,), depth=3.0 * MM)
    # Right: the atrium rests on the diaphragm in front of and medial to the
    # end point, so the branches fan out laterally and backwards.
    fan = ((("anterior", (0, -1, 0)), ("lateral", (sx, 0, 0)), ("posterior", (0, 1, 0))) if side == "l" else
           (("anterolateral", (-0.8, -0.6, 0)), ("lateral", (-1, 0.2, 0)), ("posterolateral", (-0.7, 0.7, 0))))
    for label, d in fan:
        d = np.array(d, float)
        pts = [E] + [on_diaphragm(b, E + d * k * MM, 0.9 * MM) for k in (7, 14, 20)]
        b.vessel(part, f"branch {label}", pts, 0.6 * MM, branch_allow, end_taper=0.008, do_relax=True)
    # The branch through the muscle ends in its thickness: the liver and
    # stomach lie directly on its underside in the model (may touch them).
    below = b.body.ray("Diaphragm", E - np.array([0, 0, 0.5 * MM]), (0, 0, -1), 0.03)
    depth = 0.5 * (E[2] - below[2]) if below is not None else 2 * MM
    pierce = [E, E + np.array([sx * 4 * MM, 3 * MM, -0.6 * depth]), E + np.array([sx * 8 * MM, 6 * MM, -depth])]
    b.vessel(part, "branch through diaphragm", pierce, 0.5 * MM,
             Allow(anywhere=("Diaphragm",), touch=(NODES,), squeeze=(LUNG, "Liver", "Stomach", "Spleen"),
                   depth=3.0 * MM),
             end_taper=0.006, do_relax=False)
    b.add(part)


# ------------------------------------------------------- helpers on nerves
def nerve_axis(b: Builder, mesh: str, z: float, side: str | None = None, near=None):
    """
    Centre, unit tangent (pointing down) and radius of a roughly vertical
    nerve/vessel mesh at height z: the slab of its vertices within 1 mm
    (on one side of the midline, or nearest to `near` within 8 mm); slab ±2 mm.
    """
    V = b.body.V(mesh)

    def slab(zz):
        S = V[np.abs(V[:, 2] - zz) < 2.0 * MM]
        if side is not None:
            S = S[SIDES[side] * S[:, 0] > 0]
        if near is not None and len(S):
            S = S[np.linalg.norm(S[:, :2] - np.asarray(near)[:2], axis=1) < 8 * MM]
        assert len(S), f"{mesh} has no vertex at z = {zz * 1000:.1f} mm"
        return S

    S = slab(z)
    c = (S.min(0) + S.max(0)) / 2
    c[2] = z
    lo, hi = slab(z - 3 * MM), slab(z + 3 * MM)
    t = unit(((lo.min(0) + lo.max(0)) / 2) - ((hi.min(0) + hi.max(0)) / 2))
    r = float(np.median(np.linalg.norm((S - c)[:, :2], axis=1)))
    return c, t, r


def branch_start(c, t, r_parent: float, toward) -> tuple[np.ndarray, np.ndarray]:
    """A branch's first two control points: inside the parent's surface on the
    side facing `toward`, then 3 mm on along the parent's tangent and outward —
    so it leaves tangentially from the parent's surface."""
    out = np.asarray(toward, float) - (np.asarray(toward, float) @ t) * t
    out = unit(out)
    p0 = c + out * r_parent * 0.3
    return p0, p0 + t * 3 * MM + out * (r_parent + 1.0 * MM)


# ----------------------------------------------------- recurrent laryngeal
RLN_R = 0.75 * MM  # Ø 1.5 mm


def laryngeal_entry(b: Builder, side: str) -> list[np.ndarray]:
    """
    Last part of the recurrent nerve (shared by both sides): up the
    tracheo-oesophageal groove to the lower border of the inferior
    pharyngeal constrictor, behind the cricothyroid joint (posterior to the
    cricoid at its upper border), ending on the posterior crico-arytenoid
    as the inferior laryngeal nerve.
    """
    sx = SIDES[side]
    pts = []
    for z in (1.430, 1.445, 1.458):
        # Groove: the trachea's lateral edge, at the oesophagus' front.
        t = b.body.slab("Trachea", 2, z, 0.002)
        t = t[sx * t[:, 0] > 0]
        o = b.body.slab("Oesophagus", 2, z, 0.002)
        x = t[:, 0][np.argmax(sx * t[:, 0])] - sx * 1.0 * MM
        y = o[:, 1].min()
        pts.append(np.array([x, y, z]))
    # The model's posterior crico-arytenoid lies directly on the prevertebral
    # muscles, so the nerve reaches it from the side: 2 mm lateral to its
    # lateral edge, level with its middle, then onto that edge.
    pca = f"Posterior crico-arytenoid muscle.{side}"
    P = b.body.V(pca)
    c = P.mean(0)
    edge = P[np.argmax(sx * P[:, 0] - 0.5 * np.abs(P[:, 2] - c[2]))]
    pts.append(np.array([edge[0] + sx * 2.5 * MM, c[1], c[2] - 4 * MM]))
    pts.append(edge + np.array([sx * 0.6, 0, 0]) * MM)
    return pts


def recurrent_laryngeal(b: Builder, side: str) -> None:
    """
    Right: leaves the vagus at the right subclavian artery, hooks below and
    behind the artery, ascends in the right tracheo-oesophageal groove.
    Left: leaves the vagus at the aortic arch, hooks below the arch beside
    the ligamentum arteriosum (its node marks it; the ligament itself is not
    modelled) and behind it, ascends in the left groove. Both end behind the
    cricothyroid joint at the posterior crico-arytenoid.

    Model quirks (Z-Anatomy): the left vagus runs *through* the aortic arch
    mesh (z 1372–1396 mm), so the left nerve starts where the vagus leaves
    the arch's underside; the right vagus lies medial to the subclavian
    artery's first part, so the right nerve leaves it laterally, in front of
    the artery. The arch, trachea and oesophagus overlap at z 1375–1395 mm,
    leaving no free groove there (the arch's wall lies on the trachea's left
    side): the left nerve may sink into the oesophagus, tracheal or left
    main bronchus wall, at most 3 mm, reported. The
    posterior crico-arytenoid lies directly on the prevertebral muscles in
    the model: the ending may touch them. Near its end the nerve runs
    against the back of the thyroid lobe (its usual relation; at most 2.5 mm
    into the gland where the model's lobe reaches the cricoid).
    """
    sx = SIDES[side]
    name = f"{'Left' if side == 'l' else 'Right'} recurrent laryngeal nerve"
    part = Part(name, "nervous", "nerve", "neck")
    vagus = f"Vagus nerve (X).{side}"
    end_allow = (rf"Posterior crico-arytenoid muscle\.{side}", rf"Inferior pharyngeal constrictor\.{side}",
                 "Cricoid cartilage", r"Crico-arytenoid joint.*", "Anterior longitudinal ligament",
                 rf"Longus colli muscle\.{side}", r"Intervertebral disc C.*")
    allow = Allow(start=(vagus,), end=end_allow, zone=0.010, end_zone=0.010, touch=(NODES,),
                  squeeze=("Oesophagus", "Trachea", "Left main bronchus", "Thyroid gland") if side == "l"
                  else ("Oesophagus", "Thyroid gland"), depth=(3.0 if side == "l" else 2.5) * MM)
    if side == "r":
        z0 = 1.421
        c, t, rv = nerve_axis(b, vagus, z0, side)
        p0, p1 = branch_start(c, t, rv, (sx, -1, 0))
        sca = "Right subclavian artery"
        # Below the artery: its lowest point under x = vagus x − 8 mm, 3 mm lower.
        x_h = c[0] - sx * 8 * MM
        A = b.body.V(sca)
        A = A[np.abs(A[:, 0] - x_h) < 3 * MM]
        front, back, bottom = A[:, 1].min(), A[:, 1].max(), A[:, 2].min()
        hook = [np.array([x_h, front - 2 * MM, bottom - 1.0 * MM]),
                np.array([x_h, (front + back) / 2, bottom - RLN_R - 2.0 * MM]),
                np.array([x_h + sx * 1 * MM, back + RLN_R + 1.5 * MM, bottom + 2 * MM]),
                np.array([c[0] + sx * 5 * MM, back + 5 * MM, z0 + 2 * MM])]
    else:
        # Where the vagus leaves the arch's underside (first slab below it).
        z0 = 1.366
        c, t, rv = nerve_axis(b, vagus, z0, side)
        p0, p1 = branch_start(c, t, rv, (sx, 0, 0))
        node = b.body.V("Node of ligamentum arteriosum").mean(0)
        arch = b.body.V("Aortic arch")
        under = arch[np.linalg.norm(arch[:, :2] - node[:2], axis=1) < 6 * MM][:, 2].min()
        hook = [np.array([node[0] + sx * 3 * MM, node[1] - 2 * MM, under - 3 * MM]),
                np.array([node[0], node[1] + 8 * MM, under - 4 * MM]),
                np.array([node[0] - sx * 8 * MM, node[1] + 16 * MM, under]),
                np.array([c[0] - sx * 6 * MM, 14 * MM, 1.385])]
    ctrl = [p0, p1] + hook + laryngeal_entry(b, side)
    b.vessel(part, "nerve", ctrl, RLN_R, allow, end_taper=0.005)
    b.add(part)


# -------------------------------------------------- superior laryngeal nerve
def front_of(b: Builder, mesh: str, x: float, z: float, gap: float) -> np.ndarray:
    """A point `gap` in front of a mesh's anterior surface at (x, z) (ray from the front)."""
    hit = b.body.ray(mesh, (x, -0.15, z), (0, 1, 0), 0.3)
    assert hit is not None, f"no front of {mesh} at x={x * 1000:.1f}, z={z * 1000:.1f} mm"
    return hit - np.array([0, gap, 0])


def lateral_of(b: Builder, mesh: str, side: str, y: float, z: float, gap: float) -> np.ndarray:
    """A point `gap` lateral to a mesh's lateral surface at (y, z) (ray from the side)."""
    sx = SIDES[side]
    hit = b.body.ray(mesh, (sx * 0.15, y, z), (-sx, 0, 0), 0.3)
    assert hit is not None, f"no side of {mesh} at y={y * 1000:.1f}, z={z * 1000:.1f} mm"
    return hit + np.array([sx * gap, 0, 0])


def hyoid_horn_tip(b: Builder, side: str) -> np.ndarray:
    """Tip of the hyoid's greater horn: its most posterior vertex on that side."""
    return b.body.extreme("Hyoid bone", (0, 1, 0), lambda V: SIDES[side] * V[:, 0] > 0.005)


def superior_laryngeal(b: Builder, side: str) -> dict:
    """
    Superior laryngeal nerve: from the vagus' inferior (nodose) ganglion,
    high in the neck (C2, z ≈ 1.52), down and medially deep (medial) to the
    internal and external carotid arteries; divides behind the tip of the
    hyoid's greater horn. Internal branch: forward and down through the
    thyrohyoid membrane (between hyoid and thyroid cartilage, deep to
    thyrohyoid), ending in the piriform recess wall. External branch: down on
    the inferior pharyngeal constrictor to cricothyroid.
    Returns the course points the superior laryngeal artery follows.
    """
    sx = SIDES[side]
    vagus = f"Vagus nerve (X).{side}"
    ipc = f"Inferior pharyngeal constrictor.{side}"
    group = "Superior laryngeal nerve"
    names = {k: f"{n}.{side}" for k, n in (("trunk", group), ("int", f"Internal branch of {group.lower()}"),
                                           ("ext", f"External branch of {group.lower()}"))}
    family = tuple(names.values()) + (f"Superior thyroid artery.{side}", f"Superior laryngeal artery.{side}")

    # Trunk: from the vagus at z 1.520, leaving its medial side.
    c, t, rv = nerve_axis(b, vagus, 1.520, side)
    p0, p1 = branch_start(c, t, rv, (-sx, -0.5, 0))
    tip = hyoid_horn_tip(b, side)
    # Division: 3.5 mm below the horn tip, 2.5 mm lateral and 1.5 mm behind
    # it — between the constrictor (medial) and the carotids (lateral); the
    # model's prevertebral muscles lie only a few mm further back.
    div = b.free(tip + np.array([sx * 2.5, 1.5, -3.5]) * MM, 0.75 * MM, allow=Allow(touch=(ipc,)))
    mid = (p1 + div) / 2 + np.array([-sx * 1, -2, 0]) * MM
    trunk = Part(names["trunk"], "nervous", "nerve", "neck", group=group, family=family)
    tp = b.vessel(trunk, "trunk", [p0, p1, mid, div], 0.75 * MM,
                  Allow(start=(vagus,), touch=(ipc, NODES), zone=0.006), end_taper=0.0)
    b.add(trunk)
    D = tp.path[-1]

    # Internal branch: to the thyrohyoid membrane midway between the hyoid's
    # lower border and the thyroid cartilage's upper border, 4 mm in front of
    # the superior horn of the thyroid cartilage, deep to thyrohyoid; then 6 mm
    # on inside, towards the piriform recess.
    thy = b.body.V("Thyroid cartilage")
    horn = thy[np.argmax(thy[:, 2] + 0.2 * sx * thy[:, 0])]  # superior horn tip
    membrane = np.array([horn[0] - sx * 1.0 * MM, horn[1] - 8 * MM, horn[2] - 1.0 * MM])
    membrane = b.free(membrane, 0.5 * MM, allow=Allow(touch=("Thyroid cartilage", r"Thyrohyoid membrane",
                                                              rf"Thyrohyoid muscle\.{side}")), search=0.003)
    inside = membrane + np.array([-sx * 4, 3, -3]) * MM
    internal = Part(names["int"], "nervous", "nerve", "neck", group=group, family=family)
    inner_end = (rf"Thyroid cartilage", r"Thyrohyoid membrane", r"Laryngopharynx", r"Quadrangular membrane.*",
                 rf"Thyrohyoid muscle\.{side}", r"Lateral thyrohyoid ligament.*", r"Aryepiglottic.*", r"Epiglottis",
                 r"Piriform.*", ipc, r"Middle pharyngeal constrictor.*", r"Hyoid bone", r"Thyro-epiglottic.*",
                 r"Ary-epiglottic.*", r"Palatopharyngeus.*", r"Stylopharyngeus.*")
    ip = b.vessel(internal, "branch", [D, D + np.array([-sx * 1, -3, -1]) * MM, membrane, inside], 0.5 * MM,
                  Allow(start=(names["trunk"],), end=inner_end, zone=0.004, end_zone=0.009, touch=(NODES,)),
                  end_taper=0.004)
    b.add(internal)

    # External branch: down on the constrictor's surface (1.5 mm off) to the
    # oblique part of cricothyroid.
    ext_pts = [D]
    for z in (D[2] - 0.010, D[2] - 0.022, D[2] - 0.032):
        y = b.body.centre_at(ipc, 2, z, 0.002)[1]
        ext_pts.append(lateral_of(b, ipc, side, y, z, 0.5 * MM + 1.5 * MM))
    ct = f"Oblique part of cricothyroid muscle.{side}"
    ext_pts.append(b.body.nearest(ct, b.body.V(ct).mean(0) + np.array([sx * 6, 0, 0]) * MM)[0])
    external = Part(names["ext"], "nervous", "nerve", "neck", group=group, family=family)
    b.vessel(external, "branch", ext_pts, 0.5 * MM,
             Allow(start=(names["trunk"],), end=(ct, rf"Straight part of cricothyroid muscle\.{side}",
                                                 "Thyroid cartilage", "Cricoid cartilage", ipc),
                   zone=0.004, end_zone=0.006, touch=(ipc, NODES),
                   # It passes the upper pole of the thyroid lobe, which lies on the constrictor.
                   squeeze=("Thyroid gland",), depth=1.5 * MM), end_taper=0.004)
    b.add(external)
    return {"membrane": ip.path, "external": external.pieces[0].path}


# ----------------------------------------- superior thyroid / laryngeal artery
def superior_thyroid(b: Builder, side: str, sln: dict | None) -> None:
    """
    Superior thyroid artery: the external carotid's first branch, from its
    front just below the hyoid's greater horn; forward and down, deep to the
    infrahyoid muscles and beside the external laryngeal nerve, to the upper
    pole of the thyroid lobe, where it ends in anterior and posterior
    glandular branches.
    Superior laryngeal artery: from the superior thyroid near its start,
    through the thyrohyoid membrane with the internal laryngeal nerve.
    """
    sx = SIDES[side]
    eca = f"External carotid artery.{side}"
    gland = "Thyroid gland"
    # Origin: the ECA's front, 3 mm above the carotid bifurcation (its lowest point).
    E = b.body.V(eca)
    z0 = E[:, 2].min() + 3 * MM
    c = b.body.centre_at(eca, 2, z0, 0.002)
    front = b.body.ray(eca, (c[0], -0.15, z0), (0, 1, 0), 0.3)
    o0 = c + (front - c) * 0.6
    o1 = front + np.array([-sx * 1, -2.5, 0.5]) * MM
    # Upper pole of the lobe: its highest vertex on that side; the artery
    # reaches it from above and in front, 1.5 mm off its surface.
    G = b.body.V(gland)
    pole = G[np.argmax(G[:, 2] + 0.3 * sx * G[:, 0])]
    # The model's superior thyroid vein starts far lateral (x ≈ 47 mm, near
    # the external jugular) and reaches the gland only at its middle, so the
    # artery does not follow it; it takes the textbook course from the ECA's
    # front forward, down and medially to the pole (2 mm up-bowed), and the
    # clearance check keeps it off the vein.
    mid = (o1 + pole) / 2 + np.array([0, -1.0, 2.0]) * MM
    above_pole = pole + np.array([0, -1.0, 2.5]) * MM
    # Companions that may touch: the external laryngeal nerve runs beside
    # the artery, the superior laryngeal artery with the internal branch.
    ext_n, int_n = f"External branch of superior laryngeal nerve.{side}", f"Internal branch of superior laryngeal nerve.{side}"
    part = Part(f"Superior thyroid artery.{side}", "cardiovascular", "artery", "neck",
                family=(f"Superior laryngeal artery.{side}", ext_n))
    # The model's carotid bifurcation blends the three arteries: the origin may touch all of them.
    # The model's IJV lies medially here, against the artery's course, and
    # the SCM's deep surface lies on the carotids: may touch both.
    allow = Allow(start=(eca, f"Internal carotid artery.{side}", sided("Left common carotid artery", side)),
                  end=(gland,), zone=0.006, end_zone=0.004,
                  touch=(NODES, gland, f"Internal jugular vein.{side}", f"Sternocleidomastoid muscle.{side}"))
    trunk = b.vessel(part, "trunk", [o0, o1, mid, above_pole], 1.25 * MM, allow, end_taper=0.0)
    E1 = trunk.path[-1]
    # Glandular branches over the pole: anterior (down the front border) and
    # posterior (down the back border), 1.5 mm off the gland.
    for label, d, length in (("anterior", (0.3 * -sx, -1, -0.6), 10), ("posterior", (0, 0.5, -0.9), 8)):
        tgt = E1 + unit(d) * length * MM
        on = b.body.nearest(gland, tgt)[0]
        out = unit(tgt - on) if np.linalg.norm(tgt - on) > 1e-6 else np.array([sx, 0, 0])
        b.vessel(part, f"{label} glandular branch", [E1, (E1 + on) / 2 + out * 1.5 * MM, on + out * 1.4 * MM],
                 0.6 * MM, Allow(start=(gland,), end=(gland, rf"Inferior pharyngeal constrictor\.{side}"),
                                 touch=(NODES, rf"Inferior pharyngeal constrictor\.{side}"), zone=0.003,
                                 end_zone=0.004, squeeze=(gland,), depth=1.5 * MM),  # they enter the gland
                 end_taper=0.005)
    b.add(part)

    # Superior laryngeal artery: from the trunk 6 mm from its origin, to the
    # internal laryngeal nerve's membrane point, 1.8 mm below it, then inside.
    if sln is None:
        return
    start = trunk.path[min(3, len(trunk.path) - 1)]
    m = sln["membrane"]
    k = int(np.argmin(np.linalg.norm(m - (m[0] + m[-1]) / 2, axis=1)))
    pierce = m[k] + np.array([0, 0, -1.8]) * MM
    inner = m[-1] + np.array([0, 0, -1.8]) * MM
    sla = Part(f"Superior laryngeal artery.{side}", "cardiovascular", "artery", "neck",
               family=(part.name, int_n, ext_n))
    b.vessel(sla, "artery", [start, start + np.array([-sx * 2, -2, 0.5]) * MM, pierce, inner], 0.5 * MM,
             Allow(start=(part.name, eca), end=("Thyroid cartilage", r"Thyrohyoid membrane", "Laryngopharynx",
                                                 rf"Thyrohyoid muscle\.{side}", r"Quadrangular membrane.*",
                                                 rf"Inferior pharyngeal constrictor\.{side}", r"Aryepiglottic.*",
                                                 r"Ary-epiglottic.*", r"Thyro-epiglottic.*", r"Piriform.*", "Epiglottis",
                                                 rf"Palatopharyngeus muscle\.{side}", rf"Stylopharyngeus muscle\.{side}"),
                   zone=0.004, end_zone=0.009,
                   # crowded in the model: the IJV and the pharyngeal muscles border its course
                   touch=(NODES, f"Internal jugular vein.{side}", rf"Stylopharyngeus muscle\.{side}",
                          rf"Palatopharyngeus muscle\.{side}")), end_taper=0.004)
    b.add(sla)


# ---------------------------------------------------------- ansa cervicalis
def ansa_cervicalis(b: Builder, side: str) -> None:
    """
    Superior root (C1 fibres): leaves the hypoglossal nerve where it curves
    forward round the occipital artery and descends on the front of the
    carotid sheath (in front of the internal, then the common carotid).
    Inferior root (C2–C3): from the cervical plexus behind the IJV, round the
    vein's lateral side and forward. Loop: in front of the IJV and common
    carotid at the cricoid level. Muscular branches to the deep surfaces of
    sternohyoid, sternothyroid and both bellies of omohyoid.
    Model quirk: the IJV passes through the SCM's deep part below the
    hyoid, so the loop may sink into the SCM (soft muscle) up to 1.5 mm.
    """
    sx = SIDES[side]
    xii = "Hypoglossal nerve (XII).{s}".replace("{s}", side)
    ica, cca = f"Internal carotid artery.{side}", sided("Left common carotid artery", side)
    ijv, scm = f"Internal jugular vein.{side}", f"Sternocleidomastoid muscle.{side}"
    group = "Ansa cervicalis"
    names = {"sup": f"Superior root of ansa cervicalis.{side}", "inf": f"Inferior root of ansa cervicalis.{side}",
             "loop": f"Ansa cervicalis.{side}", "mus": f"Muscular branches of ansa cervicalis.{side}"}
    family = tuple(names.values())
    R = 0.5 * MM
    # The ansa lies on (in) the carotid sheath and its twigs run between the
    # infrahyoid muscles: it may lie against all of them (never inside).
    sheath = (NODES, ica, cca, ijv, f"External carotid artery.{side}",
              rf"(Sterno(hyoid|thyroid)|Omohyoid|Thyrohyoid) muscle\.{side}",
              rf"Posterior belly of digastric muscle\.{side}", rf"Stylohyoid (ligament|muscle)\.{side}",
              )
    # The roots and the omohyoid twig cross in front of the phrenic nerve on
    # scalenus anterior (compressed neck): they may touch it; the loop not.
    crossing = sheath + (f"Phrenic nerve.{side}",)
    soft = Allow(touch=sheath, squeeze=(scm,), depth=1.5 * MM)

    # Superior root: from XII where it turns forward (its slab at the
    # occipital artery's lowest point, the artery hooking round it).
    occ = b.body.V(f"Occipital artery.{side}")
    z_turn = occ[:, 2].min() - 8 * MM
    c, t, rx = nerve_axis(b, xii, z_turn, side)
    p0, p1 = branch_start(c, np.array([0, 0, -1.0]), rx, (0, -1, -1))
    sup_pts = [p0, p1]
    for z in (1.512, 1.495):
        x = b.body.centre_at(ica, 2, z, 0.003)[0]
        sup_pts.append(b.free(front_of(b, ica, x, z, R + 1.5 * MM), R, allow=Allow(touch=(ica, NODES)), search=0.004))
    # In front of the carotid bifurcation (the model's ICA, ECA, CCA and IJV
    # overlap there), then of the common carotid.
    eca = f"External carotid artery.{side}"
    for z in (1.487, 1.478):
        x = b.body.centre_at(cca, 2, z, 0.004)[0]
        # The most anterior of the vessels there (ray from the front).
        hits = [b.body.ray(m, (x, -0.15, z), (0, 1, 0), 0.3) for m in (cca, ica, eca, ijv)]
        front = min((h for h in hits if h is not None), key=lambda h: h[1])
        sup_pts.append(b.free(front - np.array([0, R + 2.0 * MM, 0]), R,
                              allow=Allow(touch=(cca, ica, ijv, eca, NODES)),
                              search=0.005))
    # Loop apex at the cricoid level, in front of the IJV and CCA.
    z_loop = b.body.V("Cricoid cartilage")[:, 2].min() + 3 * MM
    xi = b.body.centre_at(ijv, 2, z_loop, 0.003)[0]
    xc = b.body.centre_at(cca, 2, z_loop, 0.003)[0]
    x_loop = (xi + xc) / 2
    # Start in front of the carotid, between it and the vein, then the
    # nearest free spot (the SCM counts as solid here).
    loop_pt = front_of(b, cca, x_loop, z_loop, R + 1.5 * MM)
    loop_pt = b.free(loop_pt, R * 1.1 + 1.5 * MM, allow=Allow(touch=(ijv, cca, NODES)), search=0.006)
    sup = Part(names["sup"], "nervous", "nerve", "neck", group=group, family=family)
    sp = b.vessel(sup, "root", sup_pts + [loop_pt], R,
                  # (the hypoglossal crosses stylohyoid and stylopharyngeus where the root leaves it)
                  Allow(start=(xii, f"Occipital artery.{side}", rf"Stylohyoid (ligament|muscle)\.{side}",
                               rf"Stylopharyngeus muscle\.{side}"),
                        touch=crossing, zone=0.008,
                        squeeze=(scm,), depth=1.5 * MM), end_taper=0.0)
    b.add(sup)
    L = sp.path[-1]

    # Inferior root: from behind the IJV at the C3 level (the C2–C3 rami
    # emerge there, lateral to longus capitis), round the vein's lateral
    # side, forward to the loop.
    z_c3 = 1.505
    ci = b.body.centre_at(ijv, 2, z_c3, 0.003)
    behind = b.body.ray(ijv, (ci[0], 0.15, z_c3), (0, -1, 0), 0.3) + np.array([0, 3.5, 0]) * MM
    inf_pts = [behind]
    for z, yfrac in ((1.492, 0.2), (1.478, 0.55)):
        cz = b.body.centre_at(ijv, 2, z, 0.003)
        inf_pts.append(lateral_of(b, ijv, side, cz[1] - yfrac * 6 * MM, z, R + 1.5 * MM))
    inf = Part(names["inf"], "nervous", "nerve", "neck", group=group, family=family)
    b.vessel(inf, "root", inf_pts + [L], R,
             Allow(start=(r"Longus capitis muscle\..", rf"Scalenus medius muscle\.{side}", f"Vertebra C3"),
                   touch=crossing, zone=0.004, squeeze=(scm,), depth=1.5 * MM), start_taper=0.002, end_taper=0.0)
    b.add(inf)

    # The loop itself: a short U at the apex joining the roots.
    loop = Part(names["loop"], "nervous", "nerve", "neck", group=group, family=family)
    b.vessel(loop, "loop", [L + np.array([sx * 2.5, 0.5, 2.0]) * MM, L + np.array([0, -0.6, -1.2]) * MM,
                            L + np.array([-sx * 2.5, 0.0, 1.5]) * MM], R * 1.1, soft, end_taper=0.0,
             pin=(False, False), spacing=0.002)
    b.add(loop)

    # Muscular branches to the deep (posterior) surfaces of the infrahyoids.
    mus = Part(names["mus"], "nervous", "nerve", "neck", group=group, family=family)
    for muscle, z in ((f"Sternohyoid muscle.{side}", z_loop - 0.016), (f"Sternothyroid muscle.{side}", z_loop - 0.010),
                      (f"Omohyoid muscle.{side}", z_loop + 0.012)):
        c = b.body.centre_at(muscle, 2, z, 0.002)
        back = b.body.ray(muscle, (c[0], 0.15, z), (0, -1, 0), 0.3)
        b.vessel(mus, muscle, [L, (L + back) / 2 + np.array([0, 1.0, 0]) * MM, back + np.array([0, R, 0])], 0.4 * MM,
                 # (the sternohyoid twig passes the sternothyroid's lateral edge on the way)
                 Allow(start=family, end=(muscle, rf"Sternothyroid muscle\.{side}"), zone=0.004, end_zone=0.008,
                       touch=sheath,
                       squeeze=(scm,), depth=1.5 * MM), end_taper=0.004)
    # Inferior belly of omohyoid: along the superior belly's course down and out.
    # Inferior belly: the branch follows the muscle down to its intermediate
    # tendon (where the omohyoid passes the IJV), reaching its deep surface.
    omo = b.body.V(f"Omohyoid muscle.{side}")
    low = omo[np.abs(omo[:, 2] - (z_loop - 0.016)) < 2 * MM]
    tgt = low[np.argmax(sx * low[:, 0])]
    c = b.body.centre_at(f"Omohyoid muscle.{side}", 2, tgt[2], 0.002)
    back = b.body.ray(f"Omohyoid muscle.{side}", (tgt[0] - sx * 2 * MM, 0.15, tgt[2]), (0, -1, 0), 0.3)
    tgt = back if back is not None else tgt
    b.vessel(mus, "inferior belly of omohyoid", [L, (L + tgt) / 2 + np.array([0, 1.5, 0]) * MM, tgt + np.array([0, 1.0, 0]) * MM],
             # (the inferior belly lies on scalenus anterior where the twig reaches it)
             0.4 * MM, Allow(start=family, end=(f"Omohyoid muscle.{side}", rf"Scalenus anterior muscle\.{side}"),
                             zone=0.004, end_zone=0.005,
                             touch=crossing + (rf"Scalenus anterior muscle\.{side}",), squeeze=(scm,), depth=1.5 * MM),
             end_taper=0.004)
    b.add(mus)


# --------------------------------------------- cervical plexus, cutaneous
def on_surface(b: Builder, mesh: str, p, gap: float, toward=None) -> np.ndarray:
    """p moved onto `mesh`'s outer surface, `gap` outside it (nearest point,
    pushed out along the direction away from the mesh, or `toward`)."""
    loc, _, _ = b.body.nearest(mesh, p)
    out = np.asarray(p) - loc
    if toward is not None:
        out = np.asarray(toward, float)
    elif np.linalg.norm(out) < 1e-6 or b.body.inside(mesh, p):
        out = -out if np.linalg.norm(out) > 1e-6 else np.array([0, -1.0, 0])
    return loc + unit(out) * gap


def cervical_cutaneous(b: Builder, side: str) -> None:
    """
    The four cutaneous branches of the cervical plexus emerge together at the
    nerve point of the neck (Erb's point): the midpoint of the SCM's
    posterior border; they wind round it and run superficial to the SCM,
    deep to the platysma.
    - Lesser occipital (C2): up along the SCM's posterior border to the scalp
      behind the ear (above and behind the mastoid).
    - Great auricular (C2, C3): obliquely up across the SCM, behind and
      parallel to the external jugular vein, to the angle of the mandible and
      the ear lobe; anterior branch over the parotid, posterior over the mastoid.
    - Transverse cervical (C2, C3): horizontally forward across the SCM, deep
      to the external jugular vein, splitting into upper and lower branches.
    - Supraclavicular (C3, C4): three fans — medial, intermediate, lateral —
      down across the clavicle onto the upper chest and the shoulder.
    """
    sx = SIDES[side]
    scm = f"Sternocleidomastoid muscle.{side}"
    ejv = f"External jugular vein.{side}"
    S = b.body.V(scm)
    zlo, zhi = S[:, 2].min(), S[:, 2].max()

    def posterior_border(z):
        sl_ = S[np.abs(S[:, 2] - z) < 1.5 * MM]
        return sl_[np.argmax(sl_[:, 1] + 0.6 * sx * sl_[:, 0])]

    erb_z = (zlo + zhi) / 2
    pb = posterior_border(erb_z)
    # Emerging point: 2.5 mm behind the border (from under it), then round it.
    erb = pb + np.array([sx * 1.0, 2.5, 0]) * MM
    # Under the platysma (may lie against it; it lies on the SCM in places).
    allow = Allow(start=(scm, r"Superficial lateral cervical nodes.*", rf"Levator scapulae\.{side}",
                         rf"Splenius .*\.{side}", rf"Scalenus (medius|posterior) muscle\.{side}"),
                  touch=(scm, NODES, ejv, r"Platysma.*"), zone=0.006, end_zone=0.006,
                  # where the platysma lies directly on the SCM the nerves pierce it
                  squeeze=(r"Platysma.*",), depth=1.5 * MM)
    # The four emerge together at the nerve point: they may touch each other.
    family = tuple(f"{n}.{side}" for n in ("Lesser occipital nerve", "Great auricular nerve",
                                            "Transverse cervical nerve", "Supraclavicular nerves"))
    gap = 0.75 * MM + 1.0 * MM  # 1 mm outside the SCM, under the platysma

    def surf(p, mesh=scm, g=gap):
        return on_surface(b, mesh, p, g)

    # Lesser occipital: along the posterior border, then behind the mastoid.
    lo_pts = [erb] + [surf(posterior_border(z) + np.array([sx * 1, 2, 0]) * MM)
                      for z in (erb_z + 0.020, erb_z + 0.040, erb_z + 0.060)]
    mastoid = b.body.extreme(f"Temporal bone.{side}", (sx * 0.5, 0.5, -1), lambda V: sx * V[:, 0] > 0.04)
    scalp = mastoid + np.array([sx * -2, 12, 22]) * MM
    scalp = on_surface(b, f"Occipital bone" if "Occipital bone" in b.body.meshes else f"Temporal bone.{side}",
                       scalp, 2.0 * MM, toward=(sx * 0.6, 0.5, 0.3))
    part = Part(f"Lesser occipital nerve.{side}", "nervous", "nerve", "neck", family=family)
    b.vessel(part, "nerve", lo_pts + [scalp], 0.75 * MM,
             Allow(start=allow.start, end=(r"Occipital bone", rf"Temporal bone\.{side}", r"Parietal bone.*",
                                           rf"Splenius capitis muscle\.{side}", r".*occipital.*", r"Mastoid.*"),
                   touch=allow.touch + (r".*Trapezius.*", rf"Splenius capitis muscle\.{side}"),
                   zone=0.006, end_zone=0.010), end_taper=0.008)
    b.add(part)

    # Great auricular: obliquely up across the SCM's lateral surface, behind
    # the EJV, towards the angle of the mandible and the ear lobe. The model
    # has no auricle: the lobe is taken 22 mm below the tympanic membrane, at
    # the parotid's lateral surface. Splits at the level of the mandible's
    # angle: anterior branch over the parotid, posterior over the mastoid.
    M = b.body.V("Mandible")
    M = M[sx * M[:, 0] > 0.02]
    gonion = M[np.argmax(0.3 * sx * M[:, 0] + M[:, 1] - M[:, 2])]
    tm = b.body.V(f"Tympanic membrane.{side}").mean(0)
    parotid = f"Parotid gland.{side}"
    Pg = b.body.V(parotid)
    lobe = np.array([Pg[np.argmax(sx * Pg[:, 0]), 0], tm[1], tm[2] - 22 * MM])

    def lateral_on(mesh, y, z, g):
        hit = b.body.ray(mesh, (sx * 0.15, y, z), (-sx, 0, 0), 0.3)
        if hit is None:
            return on_surface(b, mesh, (sx * 0.06, y, z), g)
        return hit + np.array([sx * g, 0, 0])

    split_z = gonion[2]
    split_y = (gonion[1] + lobe[1]) / 2 + 7 * MM  # behind the EJV
    pts = [erb]
    for f in (0.3, 0.6):
        y = erb[1] + (split_y - erb[1]) * f
        z = erb[2] + (split_z - erb[2]) * f
        pts.append(lateral_on(scm, y, z, gap))
    pts.append(lateral_on(scm, split_y, split_z, gap))
    family = tuple(f"{n}.{side}" for n in ("Lesser occipital nerve", "Great auricular nerve",
                                            "Transverse cervical nerve", "Supraclavicular nerves"))
    part = Part(f"Great auricular nerve.{side}", "nervous", "nerve", "neck", family=family)
    trunk = b.vessel(part, "trunk", pts, 0.75 * MM, allow, end_taper=0.0)
    split = trunk.path[-1]
    ant_end = lateral_on(parotid, (lobe[1] + gonion[1]) / 2 - 6 * MM, lobe[2] - 2 * MM, 1.4 * MM)
    post_end = lateral_on(scm, lobe[1] + 10 * MM, lobe[2] + 2 * MM, gap)
    end_ok = (parotid, rf"Temporal bone\.{side}", scm, r"Mastoid.*", r"(Accessory )?[Pp]arotid.*", NODES,
              r".*auricular.*", r"Platysma.*")
    b.vessel(part, "anterior branch", [split, (split + ant_end) / 2 + np.array([sx * 1.5, 0, 0]) * MM, ant_end],
             0.5 * MM, Allow(start=(scm,), end=end_ok, touch=(parotid, scm, NODES, r"Platysma.*", ejv),
                             zone=0.004, end_zone=0.006), end_taper=0.006)
    b.vessel(part, "posterior branch", [split, (split + post_end) / 2 + np.array([sx * 1.5, 0, 0]) * MM, post_end],
             0.5 * MM, Allow(start=(scm,), end=end_ok, touch=(scm, NODES, r"Platysma.*", ejv), zone=0.004,
                             end_zone=0.006), end_taper=0.006)
    b.add(part)

    # Transverse cervical: horizontally forward across the SCM, deep to the
    # EJV (the vein lies on the muscle: we pass between them); splits in front.
    fwd = []
    for f in (0.25, 0.55, 0.85):
        q = erb + np.array([-sx * 22 * f, -40 * f, -3 * f]) * MM
        fwd.append(surf(q + np.array([sx * 8, -4, 0]) * MM, g=0.75 * MM + 0.8 * MM))
    part = Part(f"Transverse cervical nerve.{side}", "nervous", "nerve", "neck", family=family)
    tr = b.vessel(part, "trunk", [erb] + fwd, 0.75 * MM,
                  Allow(start=allow.start, touch=allow.touch, zone=0.006, squeeze=allow.squeeze, depth=allow.depth),
                  end_taper=0.0)
    E = tr.path[-1]
    front_end = (r"Sternohyoid muscle.*", r"Omohyoid muscle.*", r"Platysma.*", scm, NODES, r"Anterior jugular vein.*")
    for label, dz in (("upper branch", 10), ("lower branch", -10)):
        q = E + np.array([-sx * 8, -6, dz]) * MM
        b.vessel(part, label, [E, (E + q) / 2, q], 0.5 * MM,
                 Allow(start=(scm,), end=front_end, touch=(scm, NODES, r"Platysma.*"), zone=0.004, end_zone=0.006,
                       squeeze=allow.squeeze, depth=allow.depth),
                 end_taper=0.006)
    b.add(part)

    # Supraclavicular: three fans down over the clavicle (2 mm above its
    # surface), ending on the chest / shoulder.
    clav = f"Clavicle.{side}"
    C = b.body.V(clav)
    xs = np.sort(sx * C[:, 0])
    part = Part(f"Supraclavicular nerves.{side}", "nervous", "nerve", "neck", family=family)
    stem_end = b.free(erb + np.array([sx * 4, 1, -14]) * MM, 0.6 * MM, allow=Allow(touch=(scm, NODES)), search=0.005)
    st = b.vessel(part, "stem", [erb, erb + np.array([sx * 1.5, 0, -7]) * MM, stem_end], 0.6 * MM,
                  Allow(start=allow.start, touch=allow.touch + (r"Omohyoid.*", r"Scalenus.*"), zone=0.006),
                  end_taper=0.0)
    S0 = st.path[-1]
    for label, frac in (("medial", 0.24), ("intermediate", 0.5), ("lateral", 0.85)):
        xc = sx * xs[int(frac * (len(xs) - 1))]
        top = C[np.abs(C[:, 0] - xc) < 3 * MM]
        over = top[np.argmax(top[:, 2])] + np.array([0, -2, 2.5]) * MM
        below = over + np.array([sx * (4 if label == "lateral" else 0), -6 if label != "lateral" else 4, -22]) * MM
        target = b.body.ray(clav, below + np.array([0, -0.10, 0]), (0, 1, 0), 0.25)
        meshes = [n for n in (f"Pectoralis major muscle.{side}", f"Deltoid muscle.{side}",
                              f"Clavicular part of deltoid muscle.{side}", f"Clavicular head of pectoralis major muscle.{side}")
                  if n in b.body.meshes]
        hits = [b.body.ray(m, below + np.array([0, -0.10, 0]), (0, 1, 0), 0.25) for m in meshes]
        hits = [h for h in hits if h is not None] + ([target] if target is not None else [])
        end = (min(hits, key=lambda h: h[1]) - np.array([0, 1.4, 0]) * MM) if hits else below
        # In front of the clavicle at its mid-height, 2 mm off it.
        cz = top[:, 2].mean()
        fr = b.body.ray(clav, (xc, -0.15, cz), (0, 1, 0), 0.3)
        front_pt = (fr - np.array([0, 2.0, 0]) * MM) if fr is not None else (over + end) / 2
        # First outward and forward, superficial to the deep vessels (EJV, IJV).
        out1 = (S0 + over) / 2 + np.array([sx * 6, -6, 0]) * MM
        b.vessel(part, label, [S0, out1, over, front_pt, end], 0.5 * MM,
                 Allow(start=(scm, r"Scalenus.*", r"Omohyoid.*"), end=(r".*[Pp]ectoralis.*", r".*[Dd]eltoid.*", clav,
                                                                       r"Platysma.*"),
                       touch=(clav, NODES, r"Platysma.*", r"Trapezius.*", r".*[Pp]ectoralis.*", r".*[Dd]eltoid.*", ejv,
                              scm), squeeze=(r"Platysma.*",), depth=1.5 * MM,
                       zone=0.004, end_zone=0.006), end_taper=0.008)
    b.add(part)


def build(b: Builder, only) -> None:
    def want(name: str) -> bool:
        return only is None or bool(only.search(name))

    for side in ("l", "r"):
        if want(f"Phrenic nerve.{side}"):
            phrenic(b, side)
    for side in ("l", "r"):
        if want(f"{'Left' if side == 'l' else 'Right'} recurrent laryngeal nerve"):
            recurrent_laryngeal(b, side)
    for side in ("l", "r"):
        sln = superior_laryngeal(b, side) if want("uperior laryngeal") or want("Superior thyroid") else None
        if want("Superior thyroid") or want("Superior laryngeal artery"):
            superior_thyroid(b, side, sln)
    for side in ("l", "r"):
        if want("nsa cervicalis"):
            ansa_cervicalis(b, side)
        if want("occipital nerve|auricular nerve|Transverse cervical nerve|Supraclavicular"):
            cervical_cutaneous(b, side)
