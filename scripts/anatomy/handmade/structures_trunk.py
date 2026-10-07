"""
Hand-built structures of the thorax and abdomen: thoracic duct and cisterna
chyli, cystic artery, short gastric arteries. Courses: Gray's Anatomy for
Students, Moore, Netter (the textbook-typical pattern). Landmarks are
measured on the named meshes; offsets are stated with their reason.
Frame: metres, +x = the body's left, −y = anterior, +z = up.
"""
import numpy as np

from landmarks import Allow
from parts import MM, Builder, Part, unit
from shapes import catmull_rom, spindle
from structures_neck import NODES, front_of

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


def build(b: Builder, only) -> None:
    def want(name: str) -> bool:
        return only is None or bool(only.search(name))

    if want("Thoracic duct") or want("Cisterna chyli"):
        thoracic_duct(b)
    if want("Cystic artery"):
        cystic_artery(b)
    if want("Short gastric"):
        short_gastric(b)
