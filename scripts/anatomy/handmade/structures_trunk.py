"""
Hand-built structures of the thorax and abdomen: thoracic duct and cisterna
chyli, cystic artery, short gastric arteries, pericardiacophrenic vessels,
subcostal nerve, greater pancreatic artery, subcostal muscles. Courses: Gray's Anatomy for
Students, Moore, Netter (the textbook-typical pattern). Landmarks are
measured on the named meshes; offsets are stated with their reason.
Frame: metres, +x = the body's left, −y = anterior, +z = up.
"""
import re

import numpy as np

from landmarks import Allow
from parts import MM, Builder, Part, unit
from shapes import band, catmull_rom, smooth, spindle
from structures_neck import LUNG, NODES, PHRENIC_R, SIDES, front_of, sided

DUCT_R = 2.0 * MM  # Ø 4 mm


def vertebral_front(b: Builder, vertebra: str, z: float, x: float = 0.0) -> float:
    """y of the spine's anterior surface at height z: the first of the
    vertebral body, the intervertebral discs and the anterior longitudinal
    ligament met by a ray from the front (a ray between two bodies would
    otherwise reach the canal)."""
    names = [vertebra, "Anterior longitudinal ligament"] + [n for n in b.body.names if n.startswith("Intervertebral disc ")]
    hits = [b.body.ray(n, (x, -0.20, z), (0, 1, 0), 0.4) for n in names]
    hits = [h for h in hits if h is not None and abs(h[2] - z) < 1e-6]
    assert hits, f"no front of the spine at z={z * 1000:.0f} mm"
    return float(min(h[1] for h in hits))


def vertebra_at(b: Builder, z: float) -> str:
    """The thoracic/lumbar vertebra whose body spans height z (nearest centre)."""
    names = [f"Vertebra T{i}" for i in range(1, 13)] + [f"Vertebra L{i}" for i in range(1, 6)]
    return min((n for n in names if n in b.body.meshes), key=lambda n: abs(b.body.V(n)[:, 2].mean() - z))


def thoracic_duct(b: Builder) -> None:
    """
    Cisterna chyli: a 20 × 5 × 4 mm sac in front of the L1–L2 bodies, right
    of the abdominal aorta, behind the right crus. Thoracic duct: up from it
    through the aortic hiatus (T12) into the posterior mediastinum between
    the aorta (left) and the azygos vein (right), behind the oesophagus, on
    the vertebral bodies; crosses to the left at T4–T6; up along the left
    edge of the oesophagus into the neck; at C7 it arches laterally and
    forwards, behind the carotid sheath and in front of the vertebral artery
    and sympathetic trunk, and ends at the left venous angle (IJV +
    subclavian vein).
    Model quirks: the arch lies against the oesophagus' left side at
    z 1375–1395 mm, and the oesophagus and the left atrium's back wall lie
    almost on the spine at T6–T8, so the duct may sink into the oesophagus
    or atrial wall there (at most 2.5 mm, reported); it lies on the vertebral
    bodies and the intervertebral discs (touch allowed). The right renal
    artery lies on the L1 body: the duct passes just in front of it.
    """
    on_spine = (r"Vertebra [TL]\d+", r"Intervertebral disc .*", "Anterior longitudinal ligament",
                r"Nucleus pulposus .*", NODES, r"(Right|Left) posterior intercostal (artery|vein).*",
                r"Posterior intercostal (arteries|veins).*", r".*intercostal (artery|vein).*")

    # ---- cisterna chyli: a spindle at L1–L2, 2.5 mm right of the midline
    # (right of the aorta, behind the IVC–aorta pair), 2.5 mm in front of the
    # spine.
    # Top 8 mm below where the right renal artery crosses the spine's front
    # (it lies directly on the L1 body in the model), 20 mm long.
    ra = b.body.V("Right renal artery")
    ra = ra[ra[:, 0] > -15 * MM]
    z_top = (ra[:, 2].min() if len(ra) else b.body.V("Vertebra L1")[:, 2].max()) - 8 * MM
    z_bot = z_top - 20 * MM
    x_c = -2.5 * MM
    pts = []
    for z in np.linspace(z_bot, z_top, 5):
        y = vertebral_front(b, vertebra_at(b, z), z, x_c) - 2.5 * MM
        pts.append(np.array([x_c, y, z]))
    # Then the nearest spot with room for the sac (the right renal artery
    # crosses in front at L1 in the model).
    sac_allow = Allow(touch=on_spine + ("Diaphragm", "Abdominal aorta", r"Inferior vena cava.*", r"Right renal (artery|vein)"))
    pts = [b.free(p, 2.5 * MM, allow=sac_allow, search=0.006, clearance=0.0003) for p in pts]
    axis = catmull_rom(pts)
    cist = Part("Cisterna chyli", "lymphatic", "lymphatic", "abdomen", family=("Thoracic duct",))
    # 20 × 5 × 4 mm: 2.5 mm semi-axis across (x), 2 mm front-to-back (y) —
    # smaller than the typical 8 × 6 mm: the model's IVC and aorta lie side
    # by side on the spine here, leaving only a small triangle behind them.
    b.solid(cist, "sac", spindle(axis, 2.5 * MM, flatten=0.8, up=(1, 0, 0)),
            sac_allow)
    b.add(cist)

    # ---- thoracic duct
    ctrl = [axis[-4], axis[-1] + np.array([0, 0, 3 * MM])]
    # The model's right renal artery crosses the midline lying directly on
    # the L1 body (in the textbook it runs behind the IVC, in front of the
    # cisterna/duct): the duct passes just in front of it there, then returns
    # to the spine.
    if len(ra):
        x0 = ctrl[-1][0]
        near = ra[np.abs(ra[:, 0] - x0) < 3 * MM]
        zs = np.arange(near[:, 2].min(), near[:, 2].max(), 0.5 * MM)
        hits = [h for h in (b.body.ray("Right renal artery", (x0, -0.2, z), (0, 1, 0), 0.4) for z in zs) if h is not None]
        if hits:
            lo_z, hi_z = min(h[2] for h in hits), max(h[2] for h in hits)
            front = min(h[1] for h in hits)
            for z in (lo_z - 2 * MM, (lo_z + hi_z) / 2, hi_z + 2 * MM):
                # 2 mm towards the aorta: the IVC lies against it on the right
                ctrl.append(np.array([x0 + 2 * MM, front - DUCT_R - 0.8 * MM, z]))
    azy, ao = b.body.V("Azygos vein"), np.vstack([b.body.V("Thoracic aorta"), b.body.V("Abdominal aorta")])

    def between(z):
        """Midway between the aorta's right side and the azygos' left side, 1 mm off the spine
        (the model's oesophagus and left atrium lie close against the spine at T6–T8)."""
        a = ao[np.abs(ao[:, 2] - z) < 4 * MM]
        v = azy[np.abs(azy[:, 2] - z) < 4 * MM]
        x = (a[:, 0].min() + v[:, 0].max()) / 2 if len(a) and len(v) else 0.0
        y = vertebral_front(b, vertebra_at(b, z), z, x) - DUCT_R - 1.0 * MM
        return np.array([x, y, z])

    for z in (1.150, 1.180, 1.210, 1.240, 1.265):
        ctrl.append(between(z))
    # Crossing to the left at T4–T6 (z ≈ 1.28–1.33), then along the
    # oesophagus' left edge (2.5 mm + radius off it).
    # The crossing stays on the spine, behind the oesophagus (the left atrium
    # lies in front of it here; the oesophagus lies on the spine, so the duct
    # may sink into its wall — the squeeze allowance below).
    oes = b.body.V("Oesophagus")
    for z, frac in ((1.290, 0.35), (1.315, 0.75)):
        p = between(z)
        o = oes[np.abs(oes[:, 2] - z) < 2 * MM]
        p[0] = p[0] + (o[:, 0].max() + DUCT_R + 2.5 * MM - p[0]) * frac
        ctrl.append(p)
    for z in (1.340, 1.370, 1.400, 1.425):
        o = oes[np.abs(oes[:, 2] - z) < 2 * MM]
        ctrl.append(np.array([o[:, 0].max() + DUCT_R + 1.5 * MM, (o[:, 1].min() + o[:, 1].max()) / 2 + 1 * MM, z]))
    # Arch at C7: up, lateral and forward, behind the carotid sheath (common
    # carotid, IJV) and in front of the vertebral artery, then down to the
    # back of the left venous angle.
    c7 = b.body.V("Vertebra C7")[:, 2].mean()
    cca = b.body.centre_at("Left common carotid artery", 2, c7, 0.004)
    va = b.body.centre_at("Vertebral artery.l", 2, c7, 0.004)
    apex = np.array([(cca[0] + va[0]) / 2 + 3 * MM, (cca[1] + va[1]) / 2, c7 + 4 * MM])
    ijv = b.body.V("Internal jugular vein.l")
    angle = ijv[ijv[:, 2] < ijv[:, 2].min() + 5 * MM].mean(0)  # where the IJV ends on the subclavian vein
    end = b.free(angle + np.array([3, 6, 2]) * MM, DUCT_R * 0.6,
                 allow=Allow(touch=("Internal jugular vein.l", "Left subclavian vein", "Left brachiocephalic vein")),
                 search=0.004)
    ctrl += [apex, (apex + end) / 2 + np.array([2, 0, 3]) * MM, end]
    duct = Part("Thoracic duct", "lymphatic", "lymphatic", "thorax", family=("Cisterna chyli",))
    b.vessel(duct, "duct", ctrl, DUCT_R,
             # its first 25 mm leave the cisterna beside the IVC (which lies against it)
             Allow(start=("Cisterna chyli", "Diaphragm", r"Inferior vena cava.*"),
                   # the model's left atrium and oesophagus lie close on the spine at T6–T8
                   touch=on_spine + ("Diaphragm", "Right renal artery", "Inferior phrenic artery", r"Subcostal artery\..",
                                     "Left atrium", r"Inferior vena cava.*", "Abdominal aorta"),
                   end=("Internal jugular vein.l", "Left subclavian vein", "Left brachiocephalic vein"),
                   # (the crura close the aortic hiatus round the aorta in the model)
                   zone=0.025, end_zone=0.006, squeeze=("Oesophagus", "Left atrium", "Diaphragm"), depth=2.5 * MM),
             start_taper=0.0, end_taper=0.004, tip=0.7)
    b.add(duct)


def cystic_artery(b: Builder) -> None:
    """
    Cystic artery: usually from the right hepatic artery (not in the model;
    the model's "Proper hepatic artery" runs on to the right into the liver,
    so it starts on that vessel where it passes nearest the gallbladder
    neck), through the hepatobiliary (Calot's) triangle to the neck of the
    gallbladder, where it divides into a superficial branch (on the
    peritoneal, lower surface) and a deep branch (between the gallbladder
    and the liver, in the gallbladder bed — may lie against both, and sink
    up to 2 mm into the bed where they meet; the branches also lie on the
    gallbladder wall).
    """
    gb, pha, liver = "Gallbladder", "Proper hepatic artery", "Liver"
    G = b.body.V(gb)
    neck = G[np.argmax(G[:, 2] + 0.6 * G[:, 0])]  # upper medial end
    fundus = G[np.argmax(-G[:, 2] - 0.6 * G[:, 0] - 0.3 * G[:, 1])]
    A = b.body.V(pha)
    o = A[np.argmin(np.linalg.norm(A - neck, axis=1))]
    on_neck = neck + unit(neck - G.mean(0)) * 2.0 * MM
    mid = (o + on_neck) / 2 + np.array([0, 0, 3 * MM])  # up towards the liver, in Calot's triangle
    part = Part("Cystic artery", "cardiovascular", "artery", "abdomen")
    bed = (gb, liver, NODES, "Bile duct", "Lesser omentum")
    trunk = b.vessel(part, "trunk", [o, mid, on_neck], 0.75 * MM,
                     Allow(start=(pha, "Common hepatic artery", "Gastroduodenal artery"), end=(gb, "Bile duct"),
                           touch=bed, zone=0.006, end_zone=0.006),
                     end_taper=0.0)
    E = trunk.path[-1]
    axis = unit(fundus - neck)
    length = np.linalg.norm(fundus - neck)
    for label, sgn in (("superficial branch", -1), ("deep branch", 1)):
        pts = [E]
        for f in (0.25, 0.5, 0.75):
            q = neck + axis * length * f + np.array([0, 0, sgn * 12 * MM])
            loc, _, _ = b.body.nearest(gb, q)
            pts.append(loc + unit(q - loc) * (0.5 + 1.0) * MM)
        b.vessel(part, label, pts, 0.5 * MM,
                 Allow(touch=bed, squeeze=(liver, gb) if sgn > 0 else (gb,), depth=2.0 * MM,
                       start=(gb, "Bile duct"), zone=0.006),
                 end_taper=0.008)
    b.add(part)


def short_gastric(b: Builder) -> None:
    """
    Short gastric arteries: 4 small vessels from the end of the splenic artery
    and its branches at the splenic hilum, through the gastrosplenic
    ligament to the fundus along the upper greater curvature.
    """
    sa, stomach, spleen = "Splenic artery", "Stomach", "Spleen"
    A = b.body.V(sa)
    # The artery's last 18 mm outside the spleen (the model's artery runs on
    # into the hilum, and its stomach overlaps the artery in places): where
    # its branches leave at the hilum.
    A = A[(b.body.winding(spleen, A) < 0.5) & (b.body.winding(stomach, A) < 0.5)]
    tip = A[A[:, 0] > A[:, 0].max() - 18 * MM]
    tip = tip[np.argsort(tip[:, 2])]
    S = b.body.V(stomach)
    upper = S[(S[:, 2] > S[:, 2].max() - 50 * MM)]
    part = Part("Short gastric arteries", "cardiovascular", "artery", "abdomen")
    for k, frac in enumerate((0.2, 0.45, 0.7, 0.92)):
        o = tip[int(frac * (len(tip) - 1))]
        # Fundus, greater curvature: the stomach's points facing the spleen,
        # one per level, 1.2 mm off its surface.
        z = S[:, 2].max() - (8 + 10 * k) * MM
        band = upper[np.abs(upper[:, 2] - z) < 3 * MM]
        t = band[np.argmax(band[:, 0] + 0.5 * band[:, 1])]
        loc, _, _ = b.body.nearest(stomach, t)
        end = loc + unit(np.array([1, 0.6, 0.2])) * 1.2 * MM
        # The model's spleen and stomach touch along their facing surfaces (no
        # gastrosplenic gap): the course runs along that interface.
        mid = b.body.nearest(stomach, (o + end) / 2)[0]
        b.vessel(part, f"artery {k + 1}", [o, mid, end], 0.5 * MM,
                 # The model's stomach lies against the splenic artery and the
                 # spleen: the origins may touch it, the course sink up to 2.5 mm
                 # into either organ along their interface.
                 Allow(start=(sa, spleen, stomach, "Splenic vein"), end=(stomach,),
                       touch=(NODES, "Left gastro-omental artery", "Splenic vein"),
                       zone=0.006, end_zone=0.006, squeeze=(stomach, spleen), depth=2.5 * MM), end_taper=0.006)
    b.add(part)


def part_named(b: Builder, name: str) -> Part:
    """A part built earlier in this run (its course is a landmark)."""
    for p in b.parts:
        if p.name == name:
            return p
    raise AssertionError(f"{name} must be built first (include it in --only)")


def beside(path: np.ndarray, start: int, toward, offset: float, every: float = 0.010) -> list[np.ndarray]:
    """Control points along path[start:], `offset` from its axis on the side
    facing `toward` (made perpendicular to the path at each point), one
    every `every` metres."""
    s = np.r_[0, np.cumsum(np.linalg.norm(np.diff(path, axis=0), axis=1))]
    pts = []
    for target in np.arange(s[start], s[-1] + 1e-9, every):
        i = int(np.clip(np.searchsorted(s, target), 1, len(path) - 2))
        t = unit(path[i + 1] - path[i - 1])
        d = np.asarray(toward, float)
        d = unit(d - (d @ t) * t)
        pts.append(path[i] + d * offset)
    return pts


def pericardiacophrenic(b: Builder, side: str) -> None:
    """
    Pericardiacophrenic artery: from the internal thoracic artery near its
    origin (at the thoracic inlet), medially to the phrenic nerve, then with
    the nerve between the mediastinal pleura and the fibrous pericardium to
    the diaphragm. Pericardiacophrenic vein: the same course, draining into
    the internal thoracic vein. Both run just beside the nerve (1–2 mm):
    the artery behind it, the vein in front of it; Ø 1.2 mm.
    """
    sx = SIDES[side]
    nerve = part_named(b, f"Phrenic nerve.{side}")
    trunk = next(p.path for p in nerve.pieces if p.label == "trunk")
    R = 0.6 * MM
    gap = PHRENIC_R + 1.0 * MM + R  # axis to axis: 1 mm between nerve and vessel
    # Where the vessels join the nerve: 15 mm below the root of the neck
    # (where the nerve passes medial to the internal thoracic origin).
    ita = f"Internal thoracic artery.{side}"
    itv = f"Internal thoracic veins.{side}"
    origin = b.body.extreme(ita, (0, 0, 1))
    z_join = origin[2] - 0.022
    j = int(np.argmin(np.abs(trunk[:, 2] - z_join) + 10 * (trunk[:, 2] > z_join + 0.01)))
    # The nerve's thoracic course from there to 4 mm short of its end on the diaphragm.
    s = np.r_[0, np.cumsum(np.linalg.norm(np.diff(trunk, axis=0), axis=1))]
    stop = int(np.searchsorted(s, s[-1] - 0.004))
    course = trunk[: stop + 1]
    family = (f"Phrenic nerve.{side}", f"Pericardiacophrenic artery.{side}", f"Pericardiacophrenic vein.{side}")
    for kind, mesh, toward, name in (("artery", ita, (0, 1, 0), f"Pericardiacophrenic artery.{side}"),
                                     ("vein", itv, (0, -1, 0), f"Pericardiacophrenic vein.{side}")):
        # Origin: the internal thoracic vessel's medial side, 15 mm below the artery's origin.
        V = b.body.V(mesh)
        z0 = origin[2] - 0.015
        S = V[np.abs(V[:, 2] - z0) < 2 * MM]
        o = S[np.argmin(sx * S[:, 0])] if len(S) else b.body.nearest(mesh, origin - np.array([0, 0, 0.015]))[0]
        along = beside(course, j, toward, gap)
        first = along[0]
        mid = (o + first) / 2 + np.array([0, 0, 2 * MM])
        part = Part(name, "cardiovascular", kind, "thorax", family=family)
        b.vessel(part, kind, [o, mid] + along + [course[-1] + unit(np.asarray(toward, float)) * gap * 0.6], R,
                 # As the nerve: on the pericardium, which the model lacks; the
                 # model's lungs lie on the heart, so they may sink into the lung
                 # surface (≤ 5 mm); they lie against the nerve and each other.
                 Allow(start=(mesh, r"(Right|Left) brachiocephalic vein", rf".*subclavian (artery|vein).*"),
                       end=("Diaphragm",), zone=0.010, end_zone=0.006,
                       touch=(NODES, f"Phrenic nerve.{side}", rf"Scalenus anterior muscle\.{side}", "Diaphragm"),
                       squeeze=(LUNG,), depth=5.0 * MM),
                 start_taper=0.0, end_taper=0.006)
        b.add(part)


def between_layers(b: Builder, inner: str, outer: str, origin, direction) -> np.ndarray | None:
    """Where a ray from `origin` along `direction` leaves the `inner` sheet
    (its second crossing) and meets the `outer` one: the midpoint of the
    gap between two muscle layers (or the inner layer's outer surface where
    they lie against each other)."""
    d = unit(direction)
    first = b.body.ray(inner, origin, d, 0.4)
    if first is None:
        return None
    exit_ = b.body.ray(inner, first + d * 1e-4, d, 0.05)
    exit_ = first if exit_ is None else exit_
    meet = b.body.ray(outer, exit_ - d * 2e-3, d, 0.05)
    if meet is None or (meet - exit_) @ d < 0:
        return exit_
    return (exit_ + meet) / 2


def subcostal_nerve(b: Builder, side: str) -> None:
    """
    Subcostal nerve (anterior ramus of T12): from the T12–L1 intervertebral
    foramen laterally along the lower border of the 12th rib, below the
    subcostal vessels, in front of quadratus lumborum and behind the kidney;
    then it pierces the aponeurosis of transversus abdominis and runs
    forward and down between transversus abdominis and the internal oblique
    to the lateral border of rectus abdominis, about halfway between the
    umbilicus and the pubis (the T12 dermatome). Ø 2 mm.
    """
    sx = SIDES[side]
    R = 1.0 * MM
    rib, ql = f"Twelfth rib.{side}", f"Quadratus lumborum muscle.{side}"
    ta, io = f"Transversus abdominis muscle.{side}", f"Internal abdominal oblique muscle.{side}"
    ra = f"Rectus abdominis muscle.{side}"
    # Foramen: beside the T12–L1 disc, behind the vertebral body (its back
    # third), 3 mm lateral to the disc.
    D = b.body.V("Intervertebral disc T12-L1")
    zd = D[:, 2].mean()
    foramen = np.array([sx * (sx * D[:, 0]).max() + sx * 3 * MM, D[:, 1].max() - 4 * MM, zd])
    pts = [foramen]
    # Under the rib's lower border, below the subcostal vein and artery
    # (vein, artery, nerve from above: radius + 1 mm below the lower of the
    # rib and the two vessels there), in front of quadratus lumborum.
    Rb = b.body.V(rib)
    xs = sx * Rb[:, 0]
    vessels = np.vstack([b.body.V(f"Subcostal artery.{side}"), b.body.V(sided("Left subcostal vein", side))])
    for f in (0.3, 0.55):
        xc = xs.min() + (xs.max() - xs.min()) * f
        S = Rb[np.abs(xs - xc) < 3 * MM]
        low = S[np.argmin(S[:, 2])]
        Vv = vessels[np.abs(sx * vessels[:, 0] - xc) < 3 * MM]
        floor = min(low[2], Vv[:, 2].min()) if len(Vv) else low[2]
        p = np.array([low[0], low[1], floor - R - 1.0 * MM])
        front = b.body.ray(ql, (p[0], -0.2, p[2]), (0, 1, 0), 0.4)
        if front is not None:
            p[1] = min(p[1], front[1] - R - 1.0 * MM)
        pts.append(p)
    # Round the wall between transversus abdominis and the internal oblique,
    # descending from there to the rectus' lateral border.
    L4 = b.body.V("Intervertebral disc L3-L4")[:, 2].mean()  # umbilicus level
    sym = b.body.V("Pubic symphysis")[:, 2].max()
    z_end = (L4 + sym) / 2
    Ra = b.body.V(ra)
    band = Ra[np.abs(Ra[:, 2] - z_end) < 3 * MM]
    lat_border = band[np.argmax(sx * band[:, 0])]
    z0, y0 = pts[-1][2], b.body.V(f"Kidney.{side}")[:, 1].mean()
    angles = np.radians([35, 20, 5, -10, -25, -40])  # 0 = straight lateral, + = backward, − = forward
    for k, a in enumerate(angles):
        z = z0 + (z_end - z0) * (k + 1) / (len(angles) + 1)
        q = between_layers(b, ta, io, (0.0, y0, z), (sx * np.cos(a), np.sin(a), 0))
        if q is not None:
            pts.append(q)
    end = lat_border + np.array([sx * 2.0, -1.0, 0]) * MM
    pts.append(end)
    part = Part(f"Subcostal nerve.{side}", "nervous", "nerve", "abdomen")
    b.vessel(part, "nerve", pts, R,
             # It lies on quadratus lumborum, behind the kidney, under the
             # subcostal vessels; then in the thin plane between the two
             # muscle layers, which lie against each other in the model: may
             # sink into either up to 1.5 mm.
             Allow(start=(r"Vertebra (T12|L1)", r"Intervertebral disc T12-L1", r"Psoas major.*", r"Psoas minor.*",
                          rf"Intertransverse.*", r"Right crus.*|Left crus.*", "Diaphragm"),
                   end=(ra, r"Rectus sheath.*"),
                   touch=(ql, rib, f"Kidney.{side}", NODES, "Diaphragm", rf"Subcostal artery\.{side}",
                          rf"(Left|Right) subcostal vein", ta, io, r".*renal fascia.*", r"Psoas.*",
                          rf"(Iliohypogastric|Ilio-inguinal) nerve\.{side}",
                          # where the internal oblique thins out at the back, the layers meet
                          rf"External abdominal oblique muscle\.{side}"),
                   # (≤ 2 mm where it pierces transversus' aponeurosis lateral to quadratus lumborum)
                   squeeze=(ta, io), depth=2.0 * MM, zone=0.012, end_zone=0.008),
             start_taper=0.0, end_taper=0.010)
    b.add(part)


def greater_pancreatic(b: Builder) -> None:
    """
    Greater pancreatic artery (arteria pancreatica magna): the largest
    pancreatic branch of the splenic artery, from its middle part on the
    pancreas' upper border, down the back of the gland into it at the
    junction of body and tail (taken at 78 % of the gland's length from the
    head), where it divides in the parenchyma. Ø 1.5 mm.
    """
    sa, gland = "Splenic artery", "Pancreas"
    R = 0.75 * MM
    P, A = b.body.V(gland), b.body.V(sa)
    xc = P[:, 0].min() + 0.78 * (P[:, 0].max() - P[:, 0].min())
    S = A[np.abs(A[:, 0] - xc) < 3 * MM]
    c = S.mean(0)
    low = S[np.argmin(S[:, 2])]
    o = c + (low - c) * 0.5
    # Down the back of the gland: its posterior surface 6 mm below its top
    # there (ray from behind), radius + 0.8 mm off it.
    top = P[np.abs(P[:, 0] - xc) < 3 * MM][:, 2].max()
    back = b.body.ray(gland, (xc, 0.15, top - 6 * MM), (0, -1, 0), 0.3)
    assert back is not None, "no back of the pancreas"
    entry = back + np.array([0, R + 0.8 * MM, 0])
    p1 = (o + entry) / 2 + np.array([0, 1.5 * MM, 0])
    part = Part("Greater pancreatic artery", "cardiovascular", "artery", "abdomen")
    near = (NODES, "Splenic vein", r"Superior pancreatic nodes", r"Dorsal pancreatic artery")
    b.vessel(part, "artery", [o, p1, entry], R,
             # The model's stomach rests on the splenic artery here: the origin may
             # touch it and press into its wall (≤ 1 mm).
             Allow(start=(sa, "Stomach"), end=(gland,), touch=near + (gland,), zone=0.006, end_zone=0.004,
                   squeeze=("Stomach",), depth=1.0 * MM),
             start_taper=0.0, end_taper=0.0)
    # Into the parenchyma and down behind the duct, where it divides (inside the gland).
    inside = [entry, entry + np.array([0, -1.5, -3]) * MM, entry + np.array([0, -2, -7]) * MM]  # down, behind the duct
    b.vessel(part, "in the gland", inside, R, Allow(anywhere=(gland,), touch=near), end_taper=0.006, do_relax=False)
    b.add(part)


RIBS = ("First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth")


def inner_wall(b: Builder, walls, q, inward, reach: float = 0.015) -> tuple[np.ndarray, np.ndarray] | None:
    """The thoracic wall's inner surface near q: the first of the `walls`
    meshes met by a ray from 3 cm inside q (along `inward`) back towards it,
    within `reach` of q; the point and the surface's normal facing the
    cavity."""
    o = q + inward * 0.03
    best = None
    for w in walls:
        loc, nrm = b.body.ray(w, o, -inward, 0.03 + reach, normal=True)
        if loc is not None and (best is None or np.linalg.norm(loc - o) < np.linalg.norm(best[0] - o)):
            best = (loc, nrm)
    if best is None:
        return None
    loc, nrm = np.asarray(best[0], float), np.asarray(best[1], float)
    return loc, (nrm if nrm @ inward > 0 else -nrm)


def rib_at(R: np.ndarray, x: float, sx: int) -> np.ndarray:
    """A rib's most posterior vertex within 2 mm of |x| = x."""
    S = R[np.abs(sx * R[:, 0] - x) < 2 * MM]
    return S[np.argmax(S[:, 1])]


def subcostal_muscles(b: Builder, side: str) -> None:
    """
    Subcostal muscles: thin slips in the innermost layer of the posterior
    thoracic wall, best developed low down: each from the inner surface of a
    rib at its angle to the upper border of the second rib below, crossing
    one rib and two intercostal spaces, its fibres running down and medially
    (the direction of the internal intercostals, with which they blend).
    Here four slips — ribs 7→9, 8→10, 9→11, 10→12 — 1.5 mm thick, up to
    12 mm wide, on the wall's inner surface (ribs, innermost intercostals,
    the intercostal vessels and nerves), under the parietal pleura (not
    modelled: the lungs lie on the wall). Side by side, as in Netter's
    internal view of the posterior wall: the slips from ribs 7 and 9 at the
    angles, those from ribs 8 and 10 one slip-width (13 mm) lateral to
    them; where one slip ends on a rib and the next begins, the later one
    lies 0.8 mm further in.
    """
    sx = SIDES[side]
    T_, W_ = 1.5 * MM, 12 * MM
    part = Part(f"Subcostal muscles.{side}", "muscular", "muscle", "thorax")
    # The wall's inner layers: the innermost and internal intercostals and
    # membrane, and the intercostal vessels and nerves, which run between
    # them and, near the angles, on the inner surface (the subcostals lie
    # inside them).
    veins = f"{sided('Left subcostal vein', side)}|{sided('Left superior intercostal vein', side)}"
    layers = tuple(n for n in b.body.names if re.fullmatch(
        rf"(Innermost|Internal) intercostal (muscles|membrane)\.{side}|Posterior intercostal arteries\.{side}"
        rf"|Intercostal nerves\.{side}|Subcostal artery\.{side}|{veins}", n))
    lung = (LUNG, r".* of (left|right) lung")  # (the lungs' own vessels reach their surface)
    for i, k in enumerate(range(6, 10)):  # ribs 7…10 (0-based 6…9) → two below
        ribs = [f"{RIBS[j]} rib.{side}" for j in (k, k + 1, k + 2)]
        R0, R2 = b.body.V(ribs[0]), b.body.V(ribs[2])
        # The angle: the rib's most posterior point (its outer surface);
        # every second slip starts 13 mm lateral to it (the rib's most
        # posterior vertex there).
        a0 = R0[np.argmax(R0[:, 1])]
        shift = 13 * MM * (i % 2)
        if shift:
            a0 = rib_at(R0, sx * a0[0] + shift, sx)
        # The lower end, down and medially: on the second rib below, 12 mm
        # medial to the upper end (or at that rib's own angle, shifted as
        # the upper end, if more medial) — its most posterior vertex there —
        # at its upper border (its highest vertex within 5 mm,
        # horizontally), 2 mm lower.
        x2 = min(sx * a0[0] - 12 * MM, sx * R2[np.argmax(R2[:, 1]), 0] + shift)
        a2 = rib_at(R2, x2, sx)
        near2 = R2[np.linalg.norm(R2[:, :2] - a2[:2], axis=1) < 5 * MM]
        a2 = np.array([a2[0], a2[1], near2[:, 2].max() - 2 * MM])
        offset = T_ / 2 + (0.6 + 0.8 * (i // 2)) * MM
        pts, nrms = [], []
        for t in np.linspace(0, 1, 14):
            q = a0 + (a2 - a0) * t
            # (into the chest: forwards and a little medially — beside the
            # spine a medial ray would meet the rib's neck)
            inward = unit((-sx * 0.35, -1, 0))
            hit = inner_wall(b, ribs + list(layers), q, inward)
            if hit is not None:
                loc, n = hit
                pts.append(loc + n * offset)
                nrms.append(n)
        P, N = smooth(np.array(pts), 2), smooth(np.array(nrms), 2)
        N /= np.linalg.norm(N, axis=1, keepdims=True)
        s = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
        w = W_ * (0.55 + 0.45 * np.sin(np.pi * s / s[-1]))
        # Across its whole width, not only its middle: where the wall bulges
        # in under an edge (a rib's inner surface), the slip moves in with it.
        T = np.gradient(P, axis=0)
        Wd = np.cross(N, T / np.linalg.norm(T, axis=1, keepdims=True))
        for j in range(len(P)):
            lift = 0.0
            for u in (-0.5, -0.25, 0.25, 0.5):
                q = P[j] + Wd[j] * u * w[j]
                hit = inner_wall(b, ribs + list(layers), q, N[j], reach=0.006)
                if hit is not None:
                    lift = max(lift, offset - (q - hit[0]) @ N[j])
            P[j] = P[j] + N[j] * lift
        # The lungs lie on the wall: the slips sink into them by their
        # thickness; the lowest also into the diaphragm's back, which the
        # model lays on the 11th and 12th ribs.
        allow = Allow(touch=tuple(re.escape(n) for n in ribs + list(layers))
                      + (rf"External intercostal muscles\.{side}", r"Diaphragm", r"Subcostal nerve.*"),
                      squeeze=lung + (r"Diaphragm",), depth=(4.0 if k == 9 else 3.5) * MM)
        b.solid(part, f"slip {RIBS[k].lower()} to {RIBS[k + 2].lower()} rib", band(P, w, T_, N), allow)
    b.add(part)


def build(b: Builder, only) -> None:
    def want(name: str) -> bool:
        return only is None or bool(only.search(name))

    if want("Thoracic duct") or want("Cisterna chyli"):
        thoracic_duct(b)
    if want("Cystic artery"):
        cystic_artery(b)
    if want("Short gastric"):
        short_gastric(b)
    for side in ("l", "r"):
        if want("Pericardiacophrenic"):
            pericardiacophrenic(b, side)
        if want("Subcostal nerve"):
            subcostal_nerve(b, side)
        if want("Subcostal muscles"):
            subcostal_muscles(b, side)
    if want("Greater pancreatic"):
        greater_pancreatic(b)
