"""
Hand-built perineum: perineal body, perineal muscles (both bodies, male and
female versions where they differ), anal canal and internal anal sphincter;
male bulbourethral glands and cremaster; female urethra.
Courses: Gray's Anatomy for Students, Moore, Netter (textbook-typical).
Landmarks are measured on the named meshes; offsets are stated with their
reason. Frame: metres, +x = the body's left, −y = anterior, +z = up.

The female body is Z-Anatomy's male pelvis with the Human Reference Atlas
organs fitted in (docs/DECISIONS.md → "Male/female switch"); its external
genitalia are not built yet (HANDMADE_MODELS_PROMPT.md item 13), so the
female muscles use the landmarks where those organs belong (the vaginal
orifice from the Atlas vagina's lower end; the female urethra's course from
the Atlas bladder neck to in front of the vaginal orifice, item 14).
"""
import numpy as np

from landmarks import Allow, check, matches
from parts import MM, Builder, Part, unit
from shapes import arc_band, catmull_rom, ellipsoid, sleeve
from structures_neck import NODES, SIDES

HIP = r"Hip bone\.[lr]"
FLOOR = (r"Pubococcygeus muscle\..", r"Iliococcygeus muscle\..", r"Pubo-analis muscle\..", r"Coccygeus muscle\..",
         r"Tendinous arch of levator ani\..")
EAS = r"External anal sphincter\.."
HAMSTRINGS = (r"Semimembranosus muscle\..", r"Semitendinosus muscle\..", r"Long head of biceps femoris.*",
              r"Quadratus femoris.*", r"Sacrotuberous ligament.*")
# The perineal muscles meet in the perineal body and blend at their edges:
# they may touch one another.
PERINEAL = ("Perineal body", "External urethral sphincter", "Sphincter urethrae", "Compressor urethrae",
            "Urethrovaginal sphincter", "Bulbospongiosus muscle", "Urethra (female)", "Glans of clitoris",
            "Body of clitoris", "Crus of clitoris.l", "Crus of clitoris.r", "Bulb of vestibule.l",
            "Bulb of vestibule.r", "Greater vestibular gland.l", "Greater vestibular gland.r", "Vaginal vestibule",
            "Labium minus.l", "Labium minus.r", "Labium majus.l", "Labium majus.r", "Mons pubis") + tuple(
    f"{n}.{s}" for n in ("Superficial transverse perineal muscle", "Deep transverse perineal muscle",
                         "Bulbospongiosus muscle", "Ischiocavernosus muscle", "Ischiocavernosus muscle (female)")
    for s in "lr")


def ellipse_sections(b: Builder, mesh: str, ys, side_x=None, smooth: int = 2):
    """(centre, u, v, a, b) per y of a mesh's cross-section (x–z ellipse
    round its box), smoothed along y. `side_x`: keep only x on that side of
    it (+ left / − right)."""
    rows = []
    for y in ys:
        S = b.body.section(mesh, 1, y)
        if side_x is not None:
            S = S[np.sign(side_x) * S[:, 0] > abs(side_x)]
        if len(S) < 6:
            continue
        lo, hi = S.min(0), S.max(0)
        rows.append([(lo[0] + hi[0]) / 2, y, (lo[2] + hi[2]) / 2, (hi[0] - lo[0]) / 2, (hi[2] - lo[2]) / 2])
    R = np.array(rows)
    for _ in range(smooth):
        R[1:-1, [0, 2, 3, 4]] = 0.25 * R[:-2, [0, 2, 3, 4]] + 0.5 * R[1:-1, [0, 2, 3, 4]] + 0.25 * R[2:, [0, 2, 3, 4]]
    ux, uz = np.array([1.0, 0, 0]), np.array([0, 0, 1.0])
    return [(np.array([r[0], r[1], r[2]]), ux, uz, r[3], r[4]) for r in R]


def ischial_tuberosity(b: Builder, side: str) -> np.ndarray:
    """Medial surface of the ischial tuberosity: the hip bone's lowest point,
    then its most medial vertex within 6 mm of that height and 8 mm of it."""
    H = b.body.V(f"Hip bone.{side}")
    low = H[np.argmin(H[:, 2])]
    near = H[(H[:, 2] < low[2] + 6 * MM) & (np.linalg.norm(H[:, :2] - low[:2], axis=1) < 10 * MM)]
    return near[np.argmin(SIDES[side] * near[:, 0])]


def ramus_edge(b: Builder, side: str, y: float) -> np.ndarray:
    """The ischiopubic ramus' lower medial edge at y: of the hip bone's
    vertices at that y, the one minimising (medial position + 2 × height)."""
    H = b.body.V(f"Hip bone.{side}")
    S = H[np.abs(H[:, 1] - y) < 2 * MM]
    return S[np.argmin(SIDES[side] * S[:, 0] + 2 * S[:, 2])]


def female_urethra_course(b: Builder) -> np.ndarray:
    """
    Where the female urethra runs (built later, item 14): from the Atlas
    bladder neck down, in front of the vagina, to in front of the vaginal
    orifice. The fitted Atlas vagina lies far back in our male pelvis, so the
    course is nearly vertical here rather than down-and-forward.
    """
    neck = b.body.V("Neck of urinary bladder").mean(0)
    vag = b.body.V("Vagina")
    low = vag[vag[:, 2] < vag[:, 2].min() + 3 * MM]
    orifice_front = np.array([0.0, low[:, 1].min() - 8 * MM, low[:, 2].min() - 3 * MM])
    mid = np.array([0.0, (neck[1] + orifice_front[1]) / 2 - 2 * MM, (neck[2] + orifice_front[2]) / 2])
    return catmull_rom([neck, mid, orifice_front])


def membranous_urethra(b: Builder) -> tuple[np.ndarray, np.ndarray]:
    """Centre and axis (pointing up) of the male membranous urethra: the
    model's urethra bends forward into the bulb right below the prostate's
    apex, so the membranous part is short — 3 mm below the apex, its axis the
    principal direction of the urethra's vertices within 5 mm."""
    U = b.body.V("Urethra")
    P = b.body.V("Prostate")
    apex = P[np.argmin(P[:, 2])]
    near_apex = U[np.linalg.norm(U - apex, axis=1) < 12 * MM]
    c0 = near_apex[np.argmin(near_apex[:, 2])] if len(near_apex) else apex
    ring_c = np.array([0.0, c0[1], apex[2] - 3 * MM])
    local = U[np.linalg.norm(U - ring_c, axis=1) < 5 * MM]
    _, _, Vt = np.linalg.svd(local - local.mean(0))
    ax = unit(Vt[0] if Vt[0][2] > 0 else -Vt[0])
    return local.mean(0), ax


def female_urethra(b: Builder) -> None:
    """
    Female urethra (item 14): `Urethra (female)` — joined to the model's
    (male-only) Urethra as one structure by build.ts. From the neck of the
    Atlas bladder down in front of the vagina, behind the pubic symphysis, to
    the external urethral orifice in front of the vaginal opening; Ø 6 mm.
    Its course is female_urethra_course(), round which the female sphincter
    parts were built; it starts 3 mm up inside the bladder neck. The Atlas
    vagina lies far back in our male pelvis, so the course is nearly vertical
    (≈ 35 mm, textbook 38–40 mm, down and forward).
    """
    uc = female_urethra_course(b)
    t0 = unit(uc[0] - uc[3])
    path = catmull_rom([uc[0] + t0 * 3 * MM] + [uc[i] for i in range(0, len(uc), max(1, len(uc) // 6))] + [uc[-1]],
                       step=0.002)
    part = Part("Urethra (female)", "urinary", "urinary", "pelvis", sex="female", family=PERINEAL)
    from shapes import tube, taper  # noqa: PLC0415

    b.solid(part, "urethra", tube(path, taper(path, 3.0 * MM, end=0.003, tip=0.8), 16),
            Allow(start=(r".*urinary bladder.*", "Urinary bladder"),
                  touch=("Vagina", NODES) + FLOOR + PERINEAL, zone=0.006))
    b.add(part)


def bulbourethral_glands(b: Builder) -> None:
    """
    Bulbourethral (Cowper's) glands, male: pea-sized (Ø 8–10 mm), one each
    side, posterolateral to the membranous urethra in the deep perineal
    pouch, embedded in the external urethral sphincter. Each duct (≈ 2 cm)
    runs forward and down through the perineal membrane into the bulb and
    opens into the spongy urethra.
    """
    ring_c, ax = membranous_urethra(b)
    U = b.body.V("Urethra")
    # Where the ducts open: the urethra 10–20 mm from the membranous part, in
    # front of it (in the bulb).
    d = np.linalg.norm(U - ring_c, axis=1)
    bulb_u = U[(d > 10 * MM) & (d < 20 * MM) & (U[:, 1] < ring_c[1])]
    opening = bulb_u.mean(0) if len(bulb_u) else ring_c + np.array([0, -12, -6]) * MM
    radii = (4.5 * MM, 4.0 * MM, 3.5 * MM)
    crowd = ("External urethral sphincter", r"Deep transverse perineal muscle\..", "Prostate",
             r"Corpus (spongiosum|cavernosum) of penis", "Urethra", r"Bulbourethral gland\..", NODES) + FLOOR
    for side in ("l", "r"):
        sx = SIDES[side]
        # Posterolateral: 6.5 mm lateral and 3 mm behind the membranous
        # urethra's axis — the nearest spot with room for the gland.
        c = ring_c + np.array([sx * 6.5, 3.0, 0]) * MM
        c = b.free(c, 3.5 * MM, sex="male", allow=Allow(touch=crowd), search=0.004, clearance=0.0002)
        part = Part(f"Bulbourethral gland.{side}", "reproductive", "reproductive", "pelvis", sex="male",
                    family=("External urethral sphincter", f"Bulbourethral gland.{'r' if side == 'l' else 'l'}"))
        # Embedded in the sphincter; the model's prostate apex, bulb and crura
        # crowd the deep pouch (as for the sphincter): may press into them ≤ 2 mm.
        allow = Allow(touch=crowd, squeeze=("External urethral sphincter", "Prostate",
                                            r"Corpus (spongiosum|cavernosum) of penis",
                                            r"Deep transverse perineal muscle\.."), depth=2.0 * MM)
        b.solid(part, "gland", ellipsoid(c, np.eye(3), radii), allow)
        # Duct: from the gland's front, forward and down into the bulb to the urethra.
        start = c + np.array([-sx * 1.5, -3.0, -1.5]) * MM
        mid = (start + opening) / 2 + np.array([sx * 2.0, 0, -1.0]) * MM
        b.vessel(part, "duct", [start, mid, opening + np.array([sx * 0.8, 0, 0]) * MM], 0.4 * MM,
                 Allow(anywhere=(r"Corpus spongiosum of penis",), start=(f"Bulbourethral gland.{side}",) + crowd,
                       end=("Urethra",), touch=crowd, zone=0.005, end_zone=0.004,
                       squeeze=("External urethral sphincter", r"Deep transverse perineal muscle\..",
                                r"Corpus cavernosum of penis"), depth=2.0 * MM),
                 end_taper=0.003)
        b.add(part)


def cremaster(b: Builder, side: str) -> None:
    """
    Cremaster muscle, male: loops of muscle round the spermatic cord, from
    the superficial inguinal ring (the inguinal ligament's medial end) down to
    the testis, continuous laterally with the internal oblique. Built as open
    loops (C-shapes every 7 mm, open towards what the cord lies against, else
    at the back) round the cord — the
    ductus deferens with the testicular artery and vein — joined by a lateral
    strip, so the cord stays visible.
    """
    sx = SIDES[side]
    dd = f"Ductus deferens.{side}"
    vessels = [n for n in (("Left testicular artery", "Left testicular vein") if side == "l"
                           else ("Right testicular artery.r", "Right testicular vein")) if n in b.body.meshes]
    D = b.body.V(dd)
    ring = b.body.V(f"Inguinal ligament.{side}")
    ring = ring[np.argmin(sx * ring[:, 0])]  # medial end: the superficial ring
    T = b.body.V(f"Testis.{side}")
    # from 10 mm below the superficial ring (just below it the cord still lies
    # among the pubis, pectineus and the superficial external pudendal vessels)
    z_top, z_bot = ring[2] - 10 * MM, T[:, 2].max() + 3 * MM
    sections, members = [], [D] + [b.body.V(v) for v in vessels]
    for z in np.arange(z_top, z_bot, -2 * MM):
        slab = D[(np.abs(D[:, 2] - z) < 1.5 * MM) & (D[:, 1] < -0.03)]  # the cord part (in front of the pubis)
        if not len(slab):
            continue
        c0 = slab.mean(0)
        pts = [M[(np.abs(M[:, 2] - z) < 1.5 * MM) & (np.linalg.norm(M[:, :2] - c0[:2], axis=1) < 12 * MM)]
               for M in members]
        pts = np.vstack([q for q in pts if len(q)])
        c = (pts.min(0) + pts.max(0)) / 2
        c[2] = z
        r = np.linalg.norm(pts[:, :2] - c[:2], axis=1).max() + 1.0 * MM
        sections.append((c, r))
    C = np.array([c for c, _ in sections])
    C_s = np.array(C)
    for _ in range(3):  # a smooth cord axis
        C_s[1:-1] = 0.25 * C_s[:-2] + 0.5 * C_s[1:-1] + 0.25 * C_s[2:]
    radius = np.array([r for _, r in sections])
    radius = np.maximum.reduce([np.roll(radius, k) for k in (-2, -1, 0, 1, 2)])
    radius = np.clip(radius, 3.0 * MM, 6.0 * MM)

    def frame(i):
        t = unit(C_s[min(i + 1, len(C_s) - 1)] - C_s[max(i - 1, 0)])
        u = unit(np.array([sx, 0, 0]) - (np.array([sx, 0, 0]) @ t) * t)  # lateral
        v = unit(np.cross(t, u)) * (1 if np.cross(t, u)[1] < 0 else -1)  # anterior
        return u, v

    part = Part(f"Cremaster muscle.{side}", "muscular", "muscle", "pelvis", sex="male")
    cord = (dd, f"Testis.{side}", rf"Epididymis\.{side}") + tuple(vessels)
    allow = Allow(touch=cord + (NODES, f"Inguinal ligament.{side}", r".*[Ss]crot.*", r"(Internal|External) abdominal oblique.*",
                                r".*inguinal.*", r"Penis.*|Corpus .* of penis|Glans of penis", r".*[Dd]orsal .* of penis.*",
                                r"Spermatic.*", r".*pudendal.*",
                                # the cord descends on adductor longus and pectineus
                                rf"Adductor longus\.{side}", rf"Pectineus muscle\.{side}", rf"Gracilis muscle\.{side}"),
                  squeeze=(r"Corpus cavernosum of penis", r"Penis.*"), depth=1.5 * MM)
    # Each loop is open (≥ 100°) towards whatever the cord lies against there —
    # adductor longus, pectineus, the pubis, the superficial external pudendal
    # vessels — or else at the back (θ = 270°).
    against = [n for n in b.body.meshes if any(matches(q, n) for q in (
        rf"Adductor longus\.{side}", rf"Pectineus muscle\.{side}", rf"Gracilis muscle\.{side}", rf"Hip bone\.{side}",
        rf"Superficial external pudendal (artery|vein)\.{side}", r"Pubic symphysis"))]
    for k, i in enumerate(range(1, len(C_s) - 1, 4)):  # one loop every 4 sections (≈ 7–8 mm)
        u, v = frame(i)
        secs = []
        for j in (i - 1, i, i + 1):
            j = min(max(j, 0), len(C_s) - 1)
            secs.append((C_s[j], u, v, radius[j], radius[j]))
        open_at = np.radians(270)
        near = [(b.body.nearest(m, C_s[i])[0], m) for m in against]
        near = [(q, m) for q, m in near if np.linalg.norm(q - C_s[i]) < radius[i] + 2.5 * MM]
        if near:
            q = min(near, key=lambda qm: np.linalg.norm(qm[0] - C_s[i]))[0] - C_s[i]
            open_at = np.arctan2(q @ v, q @ u)
        # Where the cord rests on a muscle the loop thins out there: widen the
        # opening until the loop is clear (each candidate checked); where even
        # a half loop would cut into it, that loop is left out.
        for hg_ in np.radians([50, 70, 90, 110]):
            mesh = arc_band(secs, open_at + hg_, open_at + 2 * np.pi - hg_, 0.4 * MM, 0.9 * MM)
            rep = check(b.body, part.name, mesh[0], mesh[2], "male", allow, own=(part.name,))
            if rep.worst_inside == 0 and rep.min_gap >= 0.0005 and rep.embedded <= allow.depth:
                b.solid(part, f"loop {k + 1}", mesh, allow)
                break
    # Lateral strip joining the loops (continuous with the internal oblique),
    # from the first level where the cord's lateral side is clear of what it
    # rests on (pectineus, adductor longus) down.
    strip = []
    for i in range(len(C_s)):
        u, v = frame(i)
        lat = C_s[i] + u * (radius[i] + 0.85 * MM)
        if not strip and any(b.body.nearest(m, lat)[2] < 1.4 * MM or b.body.inside(m, lat) for m in against):
            continue
        strip.append((C_s[i], u, v, radius[i], radius[i]))
    b.solid(part, "lateral strip", arc_band(strip, np.radians(-12), np.radians(12), 0.4 * MM, 0.9 * MM), allow)
    b.add(part)


# The female external genitalia's courses, for the muscles built over them
# (perineum(): ischiocavernosus over the crura, bulbospongiosus over the bulbs).
FEMALE: dict[str, np.ndarray] = {}
CLITORIS = ("Glans of clitoris", "Body of clitoris", "Crus of clitoris.l", "Crus of clitoris.r",
            "Suspensory ligament of clitoris")


def clitoris(b: Builder) -> None:
    """
    Clitoris (item 13; user: placed by the bones, 2026-10-07). Crura (Ø 7 mm)
    along the ischiopubic rami, deep to the ischiocavernosus, from in front
    of the ischial tuberosity forward to the angle just below the front of
    the pubic symphysis, where they join; the body (Ø 7 mm, 20 mm) runs from
    the angle down and back to the glans (Ø ≈ 6 mm) at the front of the
    vestibule. Suspensory ligament: from the front of the symphysis down to
    the body at the angle. Parts of one whole, "Clitoris", female only.
    """
    S = b.body.V("Pubic symphysis")
    low = S[S[:, 2] < S[:, 2].min() + 4 * MM]
    # The angle: 7 mm below the symphysis' lower border, at its front.
    J = np.array([0.0, low[:, 1].min() + 2 * MM, S[:, 2].min() - 7 * MM])
    G = J + np.array([0, 10, -17]) * MM  # the body: down and back, ≈ 20 mm
    family = CLITORIS + tuple(f"Ischiocavernosus muscle (female).{s}" for s in "lr") + PERINEAL
    near = (NODES, HIP, r"Pubic symphysis", r"Gracilis muscle\..", r"Adductor (longus|brevis|magnus)\..",
            r".*[Dd]orsal (artery|vein|nerve) of (penis|clitoris).*", r".*pudendal.*") + FLOOR
    allow = Allow(touch=near)
    body = Part("Body of clitoris", "reproductive", "reproductive", "pelvis", sex="female", group="Clitoris",
                group_side="midline", family=family)
    bp = b.vessel(body, "body", [J + np.array([0, -1, 1]) * MM, (J + G) / 2, G], 3.5 * MM, allow,
                  start_taper=0.0, end_taper=0.0)
    b.add(body)
    E = bp.path[-1]
    FEMALE["body"] = bp.path
    glans = Part("Glans of clitoris", "reproductive", "reproductive", "pelvis", sex="female", group="Clitoris",
                 group_side="midline", family=family)
    t = unit(E - bp.path[-4])
    b.solid(glans, "glans", ellipsoid(E + t * 2.5 * MM, np.eye(3), (3.0 * MM, 3.5 * MM, 3.0 * MM)),
            Allow(touch=near + ("Body of clitoris",)))
    b.add(glans)
    FEMALE["glans"] = E + t * 2.5 * MM
    FEMALE["angle"] = J
    for side in ("l", "r"):
        sx = SIDES[side]
        # Along the ramus' lower medial edge, 3.5 mm in from it and 3.5 mm below.
        pts = [J + np.array([sx * 3, 1, -1]) * MM]
        for y in (low[:, 1].min() + 14 * MM, -0.015, 0.0, 0.012, 0.022):
            pts.append(ramus_edge(b, side, y) + np.array([-sx * 3.5, 0, -3.5]) * MM)
        crus = Part(f"Crus of clitoris.{side}", "reproductive", "reproductive", "pelvis", sex="female",
                    group="Clitoris", group_side="midline", family=family)
        cp = b.vessel(crus, "crus", pts, 3.5 * MM,
                      Allow(start=("Body of clitoris",), touch=near, zone=0.008),
                      start_taper=0.0, end_taper=0.018, tip=0.25)
        b.add(crus)
        FEMALE[f"crus.{side}"] = cp.path
    # Suspensory ligament: a flat band from the symphysis' front, 6 mm above
    # its lower border, down to the body at the angle.
    top = b.body.ray("Pubic symphysis", (0.0, -0.2, S[:, 2].min() + 6 * MM), (0, 1, 0), 0.3)
    lig = Part("Suspensory ligament of clitoris", "reproductive", "ligament", "pelvis", sex="female", family=family)
    a0, a1 = top - np.array([0, 1.2, 0]) * MM, J - np.array([0, 3.5, -1.5]) * MM
    b.vessel(lig, "ligament", [a0, (a0 + a1) / 2 - np.array([0, 1.0, 0]) * MM, a1], 1.2 * MM,
             # it lies on the inferior pubic ligament and the interpubic disc
             Allow(start=("Pubic symphysis", "Inferior pubic ligament", "Interpubic disc"), end=("Body of clitoris",),
                   touch=near + ("Inferior pubic ligament", "Interpubic disc"), zone=0.008, end_zone=0.005),
             start_taper=0.0, end_taper=0.0, flatten=0.5, up=(1, 0, 0), do_relax=False)
    b.add(lig)


VESTIBULE = ("Bulb of vestibule.l", "Bulb of vestibule.r", "Greater vestibular gland.l", "Greater vestibular gland.r")


def vestibular_bulbs(b: Builder) -> None:
    """
    Bulbs of the vestibule (item 13): elongated erectile masses (≈ 10 mm
    tall, 6 mm thick), one each side of the vaginal orifice, deep to the
    bulbospongiosus, from beside the orifice's back forward past the
    urethral orifice, their front ends tapering towards the glans (the
    vestibule is long in this model: see clitoris()). Greater vestibular
    (Bartholin's) glands: Ø ≈ 10 mm, at the bulbs' posterior ends (5 and 7
    o'clock on the vaginal orifice), each duct opening into the vestibule
    beside the orifice.
    """
    vag = b.body.V("Vagina")
    intro = vag[vag[:, 2] < vag[:, 2].min() + 3 * MM]  # the vaginal orifice
    half = max(abs(intro[:, 0]).max(), 3 * MM)
    z0 = intro[:, 2].min()
    uo = female_urethra_course(b)[-1]  # the external urethral orifice
    glans = FEMALE.get("glans", np.array([0.0, -0.035, 0.808]))
    family = VESTIBULE + CLITORIS + PERINEAL
    near = (NODES, "Vagina", HIP, r"Gracilis muscle\..", r"Adductor (longus|brevis|magnus)\..",
            r".*pudendal.*", r".*perineal (artery|vein|nerve).*", EAS) + FLOOR
    for side in ("l", "r"):
        sx = SIDES[side]
        back = np.array([sx * (half + 6.5 * MM), intro[:, 1].max() - 2 * MM, z0 + 1 * MM])
        pts = [back, np.array([sx * (half + 6.0 * MM), intro[:, 1].min(), z0 + 1.5 * MM]),
               np.array([sx * 7.5 * MM, uo[1] - 6 * MM, z0 + 2 * MM]),
               np.array([sx * 5.5 * MM, (uo[1] + glans[1]) / 2, (z0 + glans[2]) / 2 + 2 * MM]),
               glans + np.array([sx * 4.0, 9.0, 1.0]) * MM]
        bulb = Part(f"Bulb of vestibule.{side}", "reproductive", "reproductive", "pelvis", sex="female",
                    family=family)
        bp = b.vessel(bulb, "bulb", pts, 5.0 * MM, Allow(touch=near), start_taper=0.008, end_taper=0.035, tip=0.3,
                      flatten=0.6, up=(0, 0, 1))
        b.add(bulb)
        FEMALE[f"bulb.{side}"] = bp.path
        # Gland: behind the bulb's back end, the nearest spot with room (the
        # external anal sphincter lies close behind the orifice here).
        g = b.free(bp.path[0] + np.array([sx * 1.5, 5.0, -1.0]) * MM, 4.0 * MM, sex="female",
                   allow=Allow(touch=near + (f"Bulb of vestibule.{side}",) + PERINEAL), search=0.006, clearance=0.0002)
        gland = Part(f"Greater vestibular gland.{side}", "reproductive", "reproductive", "pelvis", sex="female",
                     family=family)
        b.solid(gland, "gland", ellipsoid(g, np.eye(3), (4.5 * MM, 5.0 * MM, 4.0 * MM)),
                Allow(touch=near + PERINEAL + (f"Bulb of vestibule.{side}",), squeeze=(EAS, "Perineal body"),
                      depth=1.5 * MM))
        # Duct (≈ 15 mm): forward and medially to the vestibule beside the orifice.
        opening = np.array([sx * (half + 2.5 * MM), (intro[:, 1].min() + intro[:, 1].max()) / 2, z0 - 1.0 * MM])
        b.vessel(gland, "duct", [g + np.array([-sx * 2, -3, -1]) * MM, (g + opening) / 2 + np.array([0, 0, -1]) * MM,
                                 opening], 0.5 * MM,
                 Allow(start=(f"Greater vestibular gland.{side}", f"Bulb of vestibule.{side}"), touch=near + PERINEAL,
                       end=("Vagina",), zone=0.005, end_zone=0.004), end_taper=0.003)
        b.add(gland)


VULVA = ("Vaginal vestibule", "Labium minus.l", "Labium minus.r", "Labium majus.l", "Labium majus.r", "Mons pubis")


def heightfield_shell(grid: np.ndarray, out, thickness: float):
    """A closed thin shell from an (n, m, 3) grid of surface points: the
    inner surface on the grid, the outer one `thickness` along `out`."""
    n, m, _ = grid.shape
    out = np.asarray(out, float)
    inner, outer = grid.reshape(-1, 3), (grid + out * thickness).reshape(-1, 3)
    V = np.vstack([inner, outer])
    off = n * m
    idx = lambda i, j, k: k * off + i * m + j  # noqa: E731
    F = []
    for i in range(n - 1):
        for j in range(m - 1):
            a, b_, c, d = idx(i, j, 1), idx(i + 1, j, 1), idx(i + 1, j + 1, 1), idx(i, j + 1, 1)
            F += [(a, b_, c), (a, c, d)]
            a, b_, c, d = idx(i, j, 0), idx(i + 1, j, 0), idx(i + 1, j + 1, 0), idx(i, j + 1, 0)
            F += [(a, c, b_), (a, d, c)]
    edges = ([(i, 0) for i in range(n)], [(i, m - 1) for i in range(n)], [(0, j) for j in range(m)],
             [(n - 1, j) for j in range(m)])
    for e in edges:
        for (i0, j0), (i1, j1) in zip(e[:-1], e[1:]):
            a, b_, c, d = idx(i0, j0, 0), idx(i1, j1, 0), idx(i1, j1, 1), idx(i0, j0, 1)
            F += [(a, b_, c), (a, c, d)]
    s = np.concatenate([np.repeat(np.linspace(0, 1, n), m)] * 2) * 0.05
    return V, np.array(F, np.int32), s


def fold_sections(path, half_w, half_h, lateral):
    """Ellipse sections (centre, u, v, a, b) along a fold's centreline: u
    across (towards `lateral`), v up, both perpendicular to the course."""
    out = []
    for i, c in enumerate(path):
        t = unit(path[min(i + 1, len(path) - 1)] - path[max(i - 1, 0)])
        u = np.asarray(lateral, float)
        u = unit(u - (u @ t) * t)
        v = unit(np.cross(t, u))
        v = v if v[2] > 0 else -v
        out.append((c, u, v, half_w[i], half_h[i]))
    return out


def vulva(b: Builder) -> None:
    """
    The vulva's skin layer (item 13): thin shells (2–2.5 mm), the outermost
    layer, peelable. Vaginal vestibule: the roof of the cleft between the
    labia minora, from the glans to the fourchette, open round the urethral
    and vaginal orifices. Labia minora: thin folds along the vestibule's
    sides, from the glans back to the fourchette. Labia majora: larger folds
    lateral to them, from the mons back to the posterior commissure in front
    of the anus; the model has no skin or fat, so they may lie against the
    thighs' medial surfaces. Mons pubis: a dome over the front of the pubic
    bones. Placed by the bones (see clitoris()), so the vestibule is long.
    """
    vag = b.body.V("Vagina")
    intro = vag[vag[:, 2] < vag[:, 2].min() + 3 * MM]
    z0 = intro[:, 2].min()
    uo = female_urethra_course(b)[-1]
    glans = FEMALE.get("glans", np.array([0.0, -0.035, 0.808]))
    # the vestibule: from the glans to the fourchette, 3 mm short of the
    # rectum (which lies right behind the vaginal orifice in this model)
    R = b.body.V("Sigmoid colon")
    rect_front = R[R[:, 2] < z0 + 8 * MM][:, 1].min()
    y_front, y_back = glans[1] + 2 * MM, min(intro[:, 1].max() + 5 * MM, rect_front - 3 * MM)
    family = VULVA + VESTIBULE + CLITORIS + PERINEAL
    near = (NODES, "Vagina", HIP, r"Gracilis muscle\..", r"Adductor (longus|brevis|magnus)\..", r".*pudendal.*",
            r".*perineal (artery|vein|nerve).*", r".*labial.*", r"Round ligament of uterus\..", EAS, "Pubic symphysis",
            r"Pyramidalis.*", r"Rectus abdominis.*", r".*inguinal.*", r"Linea alba",
            r"(Internal|External) abdominal oblique muscle\..", r"Transversus abdominis muscle\..",
            "Inferior pubic ligament", "Interpubic disc") + FLOOR
    allow = Allow(touch=near + family, squeeze=(r"Gracilis muscle\..", r"Adductor (longus|brevis)\.."), depth=2.0 * MM)
    ys = np.arange(y_front, y_back + 1e-9, 2 * MM)

    def z_floor(y):  # the vestibule's roof: 3 mm below the orifices' level, rising to the glans
        f = np.clip((y - y_front) / max(uo[1] - y_front, 1e-6), 0, 1)
        return glans[2] - 1 * MM + (z0 - 3 * MM - (glans[2] - 1 * MM)) * f

    # Vestibule: the upper half of a flat ellipse (6 mm across, 3 mm high)
    # round the midline; round the orifices only its sides.
    vest = Part("Vaginal vestibule", "reproductive", "reproductive", "pelvis", sex="female", family=family)

    def roof(y_lo, y_hi, th0, th1, label):
        sel = [y for y in ys if y_lo <= y <= y_hi]
        if len(sel) < 2:
            return
        path = np.array([[0.0, y, z_floor(y)] for y in sel])
        secs = fold_sections(path, np.full(len(path), 6 * MM), np.full(len(path), 3 * MM), (1, 0, 0))
        b.solid(vest, label, arc_band(secs, th0, th1, 0.0, 2.0 * MM), allow)

    open_lo, open_hi = uo[1] - 4 * MM, intro[:, 1].max() + 1 * MM
    roof(y_front, open_lo, 0.0, np.pi, "front")
    roof(open_lo, open_hi, 0.0, np.radians(55), "left side")
    roof(open_lo, open_hi, np.radians(125), np.pi, "right side")
    roof(open_hi, y_back, 0.0, np.pi, "back")
    b.add(vest)

    # Labia minora: along the vestibule's sides (7 mm out), hanging 5 mm below it.
    for side in ("l", "r"):
        sx = SIDES[side]
        path = np.array([[sx * (3 + 4 * min(1, (y - y_front) / 0.015)) * MM, y, z_floor(y) - 3 * MM] for y in ys])
        path = catmull_rom(path[:: max(1, len(path) // 8)], step=0.002)
        n = len(path)
        hw = np.full(n, 1.5 * MM)
        hh = 5.0 * MM * np.clip(np.minimum(np.arange(n), n - 1 - np.arange(n)) / 6, 0.3, 1)
        part = Part(f"Labium minus.{side}", "reproductive", "reproductive", "pelvis", sex="female", family=family)
        b.solid(part, "fold", arc_band(fold_sections(path, hw, hh, (sx, 0, 0)), np.radians(-210), np.radians(30),
                                       0.0, 1.5 * MM), allow)
        b.add(part)

    # Labia majora: from the mons' lower edge down and back, 13 mm out at
    # the vestibule (lying against the thighs where they come closer), to
    # the posterior commissure 8 mm behind the vaginal orifice.
    S = b.body.V("Pubic symphysis")
    sym_front = S[np.argmin(S[:, 1])]
    thighs = (r"Gracilis muscle\.{s}", r"Adductor (longus|brevis|magnus)\.{s}")

    def inside_thigh(side, p, want):
        """x of p moved in so its fold (5 mm half-width + 2.5 mm shell) clears the thigh's medial surface by 0.3 mm."""
        sx = SIDES[side]
        walls = [b.body.ray(m, (0.0, p[1], p[2]), (sx, 0, 0), 0.08) for m in b.body.meshes
                 if any(matches(t.replace("{s}", side), m) for t in thighs)]
        walls = [abs(w[0]) for w in walls if w is not None]
        x = min([want] + [w - 7.8 * MM for w in walls])
        return np.array([sx * max(x, 5 * MM), p[1], p[2]])

    for side in ("l", "r"):
        sx = SIDES[side]
        ctrl = [np.array([sx * 6 * MM, sym_front[1] - 4 * MM, S[:, 2].min() - 2 * MM]),
                inside_thigh(side, np.array([0, y_front, z_floor(y_front) - 6 * MM]), 11 * MM),
                inside_thigh(side, np.array([0, (y_front + uo[1]) / 2, z0 - 9 * MM]), 13 * MM),
                inside_thigh(side, np.array([0, intro[:, 1].mean(), z0 - 9 * MM]), 13 * MM),
                np.array([sx * 5 * MM, y_back + 3 * MM, z0 - 7 * MM])]
        path = catmull_rom(ctrl, step=0.002)
        n = len(path)
        taper_ = np.clip(np.minimum(np.arange(n), n - 1 - np.arange(n)) / 10, 0.35, 1)
        part = Part(f"Labium majus.{side}", "reproductive", "reproductive", "pelvis", sex="female", family=family)
        b.solid(part, "fold", arc_band(fold_sections(path, 5 * MM * taper_, 8 * MM * taper_, (sx, 0, 0)),
                                       np.radians(-215), np.radians(35), 0.0, 2.5 * MM), allow)
        b.add(part)

    # Mons pubis: a pad over the front of the pubic bones and the muscles in
    # front of them, 26 mm to each side and from the symphysis' lower border
    # up 30 mm (less at the sides): a shell (2.5 mm) in front of the frontmost
    # of them with up to 7 mm of fat between (3 mm at its edges).
    mons = Part("Mons pubis", "reproductive", "reproductive", "pelvis", sex="female", family=family)
    front_of = [m for m in b.body.meshes if any(matches(q, m) for q in (
        "Pubic symphysis", HIP, r"Pectineus muscle\..", r"Adductor (longus|brevis)\..", r"Rectus abdominis.*",
        r"Pyramidalis.*", r"Gracilis muscle\..", r"Inguinal ligament\..", r".*pudendal.*", r"Round ligament of uterus\..",
        r"(Internal|External) abdominal oblique muscle\..", r"Transversus abdominis muscle\..", r"Linea alba",
        r".*[Rr]ectus sheath.*"))
                and b.body.visible(m, "female")]
    # Each column (x) lies in front of the frontmost thing in it (rays every
    # 2 mm up the column), smoothed across x; the outline is rounded (the
    # columns shorten towards the sides) and the fat thins to the edges.
    xs = np.arange(-26 * MM, 26 * MM + 1e-9, 2 * MM)
    z_lo = S[:, 2].min()
    front = []
    for x in xs:
        hits = [b.body.ray(m, (x, -0.25, z), (0, 1, 0), 0.4) for m in front_of
                for z in np.arange(z_lo, z_lo + 30 * MM + 1e-9, 2 * MM)]
        front.append(min((h[1] for h in hits if h is not None), default=sym_front[1]))
    front = np.array(front)
    for _ in range(4):
        front[1:-1] = np.minimum(front[1:-1], 0.25 * front[:-2] + 0.5 * front[1:-1] + 0.25 * front[2:])
    grid = np.zeros((len(xs), 13, 3))
    for i, x in enumerate(xs):
        k = 1 - (x / (27 * MM)) ** 2
        height = 30 * MM * (0.55 + 0.45 * k)
        for j, f in enumerate(np.linspace(0, 1, 13)):
            fat = (3 + 4 * k * np.sin(np.pi * f)) * MM
            grid[i, j] = (x, front[i] - fat, z_lo + height * f)
    b.solid(mons, "pad", heightfield_shell(grid, np.array([0, -1.0, 0]), 2.5 * MM), allow)
    b.add(mons)


def perineum(b: Builder, want) -> None:
    eas_v = np.vstack([b.body.V("External anal sphincter.l"), b.body.V("External anal sphincter.r")])
    eas_front = eas_v[np.argmin(eas_v[:, 1])]
    vag = b.body.V("Vagina")

    # ---- perineal body: 12 × 10 × 10 mm node, 12 mm in front of the
    # external anal sphincter's front, its top 2 mm below the Atlas vagina's
    # lower end (the female body's vaginal orifice).
    pb_c = np.array([0.0, eas_front[1] - 12 * MM, min(eas_front[2], vag[:, 2].min() - 7 * MM)])
    pb = Part("Perineal body", "muscular", "ligament", "pelvis", family=PERINEAL)
    pb_allow = Allow(touch=(EAS,) + FLOOR + (NODES,))
    if want("Perineal body"):
        b.solid(pb, "node", ellipsoid(pb_c, np.eye(3), (6 * MM, 5 * MM, 5 * MM)), pb_allow)
        b.add(pb)

    for side in ("l", "r"):
        sx = SIDES[side]
        # ---- superficial transverse perineal: medial ischial tuberosity → perineal body.
        if want("Superficial transverse perineal"):
            t = ischial_tuberosity(b, side) + np.array([-sx * 1.0 * MM, 0, 1.5 * MM])
            end = pb_c + np.array([sx * 5.0 * MM, 0, 0])
            part = Part(f"Superficial transverse perineal muscle.{side}", "muscular", "muscle", "pelvis",
                        family=PERINEAL)
            b.vessel(part, "band", [t, (t + end) / 2 + np.array([0, 0, 1.0 * MM]), end], 3.0 * MM,
                     Allow(start=(HIP,) + HAMSTRINGS, end=("Perineal body", EAS),
                           touch=FLOOR + (NODES, EAS, r"Corpus .*", HIP), zone=0.007, end_zone=0.005),
                     start_taper=0.004, end_taper=0.004, tip=0.6, flatten=0.42, up=(0, 1, 0))
            b.add(part)

        # ---- deep transverse perineal: a thin sheet just above the
        # superficial one, across from the ischiopubic ramus (6 mm in front
        # of the tuberosity) to the midline at the perineal body's top; it
        # runs 6 mm above the ramus' lower edge, over the back end of the
        # crus, which fills the space below in the model.
        if want("Deep transverse perineal"):
            t = ischial_tuberosity(b, side)
            r0 = ramus_edge(b, side, t[1] - 6 * MM) + np.array([-sx * 1.0, 0, 6.0]) * MM
            end = pb_c + np.array([sx * 3.0 * MM, -2 * MM, 5.5 * MM])
            mid = np.array([(r0[0] + end[0]) / 2, (r0[1] + end[1]) / 2, max(r0[2], end[2]) + 1.0 * MM])
            part = Part(f"Deep transverse perineal muscle.{side}", "muscular", "muscle", "pelvis", family=PERINEAL)
            b.vessel(part, "sheet", [r0, mid, end], 3.0 * MM,
                     Allow(start=(HIP,) + HAMSTRINGS, end=("Perineal body", r"Corpus spongiosum of penis"),
                           touch=FLOOR + (NODES, r"Corpus .*", HIP, "Prostate", "Urethra", "Vagina"),
                           zone=0.008, end_zone=0.006),
                     start_taper=0.003, end_taper=0.003, tip=0.6, flatten=0.33, up=(0, 1, 0), spacing=0.004)
            b.add(part)

    # ---- external urethral sphincter, male: a ring round the membranous
    # urethra (the urethra between the prostate's apex and the bulb).
    if want("External urethral sphincter"):
        # The model's urethra bends forward into the bulb right below the
        # prostate's apex, so the membranous part is short: the ring sits on
        # the urethra's axis (principal direction of its vertices within 5 mm)
        # 3 mm below the apex, 5 mm long; it may press into the prostate's
        # apex, the bulb and the joined crura, which crowd it in the model.
        ring_c, ax = membranous_urethra(b)
        path = catmull_rom([ring_c - ax * 2.5 * MM, ring_c, ring_c + ax * 2.5 * MM], step=0.001)
        part = Part("External urethral sphincter", "muscular", "muscle", "pelvis", sex="male", family=PERINEAL)
        b.solid(part, "ring", sleeve(path, 2.3 * MM, 3.8 * MM, segments=20),
                Allow(anywhere=("Urethra",), touch=("Prostate", r"Corpus .* of penis", NODES) + FLOOR,
                      squeeze=("Prostate", r"Corpus (spongiosum|cavernosum) of penis"), depth=2.0 * MM))
        b.add(part)

        # Female: sphincter urethrae round the middle third of the urethra,
        # compressor urethrae arching over its front from both ischiopubic
        # rami, urethrovaginal sphincter round the urethra and down the sides
        # of the vagina to the perineal body. Parts of one whole with the
        # male ring (group), shown in the female body only.
        uc = female_urethra_course(b)
        n = len(uc)
        mid3 = uc[n // 3 : 2 * n // 3 + 1]
        fem_allow = Allow(touch=("Vagina", "Perineal body", NODES) + FLOOR,
                          start=(r"Neck of urinary bladder",), zone=0.002)
        for name, mesh, allow in (
            ("Sphincter urethrae", sleeve(mid3, 3.3 * MM, 5.5 * MM, segments=20), fem_allow),
        ):
            part = Part(name, "muscular", "muscle", "pelvis", sex="female", group="External urethral sphincter",
                        group_side="midline", family=PERINEAL)
            b.solid(part, "ring", mesh, allow)
            b.add(part)
        front = uc[2 * n // 3] + np.array([0, -6.5, -1]) * MM  # in front of the urethra, below the ring
        arch = []
        for side in ("l", "r"):
            sx = SIDES[side]
            t = ischial_tuberosity(b, side)
            arch.append(ramus_edge(b, side, t[1] - 16 * MM) + np.array([-sx * 1.5, 0, 2.0]) * MM)
        part = Part("Compressor urethrae", "muscular", "muscle", "pelvis", sex="female",
                    group="External urethral sphincter", group_side="midline",
                    family=PERINEAL)
        b.vessel(part, "arch", [arch[0], (arch[0] + front) / 2 + np.array([0, 0, 2 * MM]), front,
                                (arch[1] + front) / 2 + np.array([0, 0, 2 * MM]), arch[1]], 1.6 * MM,
                 Allow(start=(HIP,), end=(HIP,), touch=("Vagina", "Perineal body", NODES) + FLOOR, zone=0.005),
                 start_taper=0.004, end_taper=0.004, tip=0.6, flatten=0.5, up=(0, 0, 1))
        b.add(part)
        low = vag[vag[:, 2] < vag[:, 2].min() + 4 * MM]
        sides_y = low[:, 1].mean()
        half = (low[:, 0].max() - low[:, 0].min()) / 2 + 3.5 * MM
        u_front = uc[int(0.8 * n)] + np.array([0, -4.0, 0]) * MM
        loop = [pb_c + np.array([-6, -2, 4]) * MM, np.array([-half, sides_y, u_front[2] + 1 * MM]), u_front,
                np.array([half, sides_y, u_front[2] + 1 * MM]), pb_c + np.array([6, -2, 4]) * MM]
        part = Part("Urethrovaginal sphincter", "muscular", "muscle", "pelvis", sex="female",
                    group="External urethral sphincter", group_side="midline",
                    family=PERINEAL)
        b.vessel(part, "loop", loop, 1.2 * MM,
                 Allow(start=("Perineal body",), end=("Perineal body",), touch=("Vagina", NODES) + FLOOR,
                       zone=0.004), end_taper=0.003, start_taper=0.003, tip=0.6)
        b.add(part)

    # ---- bulbospongiosus, male: one muscle, two halves joined at a midline
    # raphe, wrapping the bulb's sides and underside from the perineal body
    # forward (the bulb: the corpus spongiosum's posterior 30 mm).
    if want("Bulbospongiosus"):
        CS = b.body.V("Corpus spongiosum of penis")
        y_back = CS[:, 1].max()
        secs = ellipse_sections(b, "Corpus spongiosum of penis", np.arange(y_back - 2 * MM, y_back - 32 * MM, -2 * MM))
        secs = [(c, u0, v0, a * 1.15, bb * 1.15) for c, u0, v0, a, bb in secs]  # bbox ellipse → enclosing
        # Behind the bulb the two halves converge on the perineal body, where
        # they arise: sections narrowing from the bulb's back end to a 4 mm
        # ellipse at the perineal body's front (the model leaves a gap).
        c0, u0, v0, a0, b0 = secs[0]
        pb_front = np.array([0.0, pb_c[1] - 5 * MM, pb_c[2]])
        n_back = max(0, int((pb_front[1] - c0[1]) / (2 * MM)))
        back = []
        for k in range(n_back, 0, -1):
            f = k / (n_back + 1)  # 1 at the perineal body, 0 at the bulb
            back.append((c0 + f * (pb_front - c0), u0, v0, a0 + f * (4 * MM - a0), b0 + f * (4 * MM - b0)))
        secs = back + secs
        part = Part("Bulbospongiosus muscle", "muscular", "muscle", "pelvis", sex="male", family=PERINEAL)
        # θ: 0 = left side, π = right side, 3π/2 = underside (the raphe).
        # Its sides meet the crura where they abut the bulb (its anterior
        # fibres wrap the corpora cavernosa): may press into them ≤ 1 mm.
        b.solid(part, "sheet", arc_band(secs, np.radians(165), np.radians(375), 0.8 * MM, 2.0 * MM),
                Allow(touch=(r"Corpus spongiosum of penis", r"Corpus cavernosum of penis", "Urethra", "Perineal body",
                             NODES, EAS) + FLOOR,
                      squeeze=(r"Corpus cavernosum of penis",), depth=1.0 * MM))
        b.add(part)

        # Female: one on each side of the vaginal orifice (over the bulbs of
        # the vestibule), from the perineal body forward to the clitoris'
        # body below the symphysis.
        sym = b.body.V("Pubic symphysis")
        sym_low = sym[np.argmin(sym[:, 2])]
        low = vag[vag[:, 2] < vag[:, 2].min() + 4 * MM]
        for side in ("l", "r"):
            sx = SIDES[side]
            orifice_side = np.array([sx * ((low[:, 0].max() - low[:, 0].min()) / 2 + 7 * MM), low[:, 1].mean(),
                                     low[:, 2].min() + 1 * MM])
            pts = [pb_c + np.array([sx * 4, -3, 2]) * MM, orifice_side,
                   orifice_side + np.array([-sx * 1.5, -16, 3]) * MM,
                   np.array([sx * 4 * MM, sym_low[1] + 22 * MM, sym_low[2] - 18 * MM])]
            if f"bulb.{side}" in FEMALE:
                # Over the bulb's outer surface (its half-thickness 3 mm + the
                # band's 1.25 mm + 0.3 mm, laterally and a little down), from
                # the perineal body forward to the side of the clitoris' body.
                bulb_path = FEMALE[f"bulb.{side}"]
                out = unit(np.array([sx, 0, -0.3]))
                idx = np.linspace(0, int(len(bulb_path) * 0.8), 5).astype(int)
                body = FEMALE["body"]
                pts = ([pb_c + np.array([sx * 4, -3, 2]) * MM] + [bulb_path[i] + out * 4.6 * MM for i in idx] +
                       [body[int(len(body) * 0.6)] + np.array([sx * 5.5, 0, 0]) * MM])
            part = Part(f"Bulbospongiosus muscle.{side}", "muscular", "muscle", "pelvis", sex="female",
                        group="Bulbospongiosus muscle", group_side="midline", family=PERINEAL)
            b.vessel(part, "band", pts, 2.5 * MM,
                     Allow(start=("Perineal body",), end=("Body of clitoris",),
                           touch=("Vagina", "Perineal body", NODES, r"Gracilis muscle\..", r".*pudendal.*") + FLOOR,
                           zone=0.005, end_zone=0.005),
                     start_taper=0.004, end_taper=0.006, tip=0.5, flatten=0.5, up=(0, 0, 1))
            b.add(part)

    # ---- ischiocavernosus: covers the crus (of the penis; of the clitoris)
    # on the ischiopubic ramus, from the ischial tuberosity forward.
    if want("Ischiocavernosus"):
        for side in ("l", "r"):
            sx = SIDES[side]
            CC = b.body.V("Corpus cavernosum of penis")
            crus = CC[sx * CC[:, 0] > 4 * MM]
            y_back = crus[:, 1].max()
            # The crus: its posterior 44 mm, lateral to x = ±8 mm (medial to
            # that the crura join the body of the penis).
            secs = ellipse_sections(b, "Corpus cavernosum of penis", np.arange(y_back - 2 * MM, y_back - 44 * MM, -3 * MM),
                                    side_x=sx * 8 * MM)
            secs = [(c, u0, v0, a * 1.3, bb * 1.3) for c, u0, v0, a, bb in secs]  # bbox ellipse → enclosing
            # A band (7 × 2 mm) on the crus' underside, from its back end on the
            # tuberosity forward, lying against it (relaxed out of its
            # neighbours; may touch the crus, the bone and the bulb).
            tub = ischial_tuberosity(b, side) + np.array([-sx * 1.5, -2, 2.5]) * MM
            axis = [tub] + [sec[0] + np.array([0, 0, -(sec[4] / 1.3 + 2.8 * MM)]) for sec in secs]
            part = Part(f"Ischiocavernosus muscle.{side}", "muscular", "muscle", "pelvis", sex="male", family=PERINEAL)
            b.vessel(part, "band", axis, 3.5 * MM,
                     Allow(start=(HIP,) + HAMSTRINGS + (r"Adductor magnus\..",),
                           touch=(r"Corpus cavernosum of penis", r"Corpus spongiosum of penis", HIP, NODES) + FLOOR,
                           zone=0.008),
                     start_taper=0.004, end_taper=0.006, tip=0.5, flatten=0.3, up=(1, 0, 0))
            b.add(part)
            # Female: a band along the same course on the ramus, where the
            # clitoris' crus lies (≈ 30 × 7 mm; built later, item 13).
            axis = [tub] + [sec[0] + np.array([0, 0, -sec[4] * 0.4]) for sec in secs]
            if f"crus.{side}" in FEMALE:
                # Over the crus' lower medial surface (its radius 3.5 mm + the
                # band's half-thickness 1.65 mm + 0.3 mm), from the tuberosity
                # forward to 15 mm short of the angle.
                crus_path = FEMALE[f"crus.{side}"]
                sc = np.r_[0, np.cumsum(np.linalg.norm(np.diff(crus_path, axis=0), axis=1))]
                keep = crus_path[(sc > 15 * MM)][::-1]  # back to front
                down_in = unit(np.array([-sx * 0.6, 0, -1]))
                axis = [tub] + [q + down_in * 5.45 * MM for q in keep[:: max(1, len(keep) // 5)]]
            part = Part(f"Ischiocavernosus muscle (female).{side}", "muscular", "muscle", "pelvis", sex="female",
                        family=PERINEAL)
            b.vessel(part, "band", axis, 3.0 * MM,
                     Allow(touch=(HIP, NODES, "Perineal body", r"Gracilis muscle\..", r"Adductor (longus|brevis|magnus)\..",
                                  r".*pudendal.*") + FLOOR,
                           start=(HIP,) + HAMSTRINGS + (r"Adductor magnus\..",), zone=0.008),
                     start_taper=0.004, end_taper=0.006, tip=0.5, flatten=0.55, up=(sx, 0, -1))
            b.add(part)


def anal_canal(b: Builder) -> None:
    """
    Anal canal: from the anorectal junction (the lower end of Z-Anatomy's
    "Sigmoid colon", shown as the Rectum) down and back to the anus, inside
    the external anal sphincter. The model's sphincter is a ring tilted 45°
    whose axis points down and back; the canal starts from the rectum's lower
    end (which lies 8 mm in front of that axis, just above the ring), bends
    back into the axis and follows it through the ring's centre (≈ 35 mm
    long). The ring is small (inner radius ≈ 6 mm), so
    the canal is ≈ 11 mm wide. Internal anal sphincter: a 2.5 mm cuff, the
    thickened circular muscle, round the canal down to 14.5 mm below the ring's
    centre (≈ 1 cm above the anus), inside
    the external sphincter (pressing up to 2 mm into it, reported).
    """
    E = np.vstack([b.body.V("External anal sphincter.l"), b.body.V("External anal sphincter.r")])
    C = E.mean(0)
    _, _, Vt = np.linalg.svd(E - C)
    d = unit(Vt[2] if Vt[2][2] < 0 else -Vt[2])  # down and back
    # The ring's inner radius: the closest its vertices come to the axis.
    rel = E - C
    radial = np.linalg.norm(rel - np.outer(rel @ d, d), axis=1)
    inner = np.percentile(radial, 3)
    ias_t = 2.5 * MM
    # The model's sphincter ring is small (inner radius ≈ 6 mm): the canal
    # fills it (Ø ≈ 11 mm, not the textbook 15–20 mm) and the internal
    # sphincter's cuff lies against the external one, sinking at most 2 mm.
    r_canal = min(7.5 * MM, inner - 1.0 * MM)
    print(f"anal canal: sphincter ring inner radius {inner * 1000:.1f} mm → canal Ø {2 * r_canal * 1000:.1f} mm")
    # Anorectal junction: the canal starts from the rectum's lower end — its
    # wall's nearest point to the canal's axis 8 mm above the ring (on the
    # midline), 1 mm into the wall and 2.5 mm up so the two overlap and its
    # start cap stays inside the rectum — and bends back into the
    # ring's axis 3 mm above its centre (the anorectal flexure); 22 mm below
    # the centre it ends at the anus.
    loc, normal, _ = b.body.nearest("Sigmoid colon", C - 8 * MM * d)
    junction = np.array([0.0, loc[1], loc[2] + 2.5 * MM]) - unit(normal) * 1.0 * MM  # its start cap inside the rectum
    bottom = C + 22 * MM * d
    path = catmull_rom([junction, C - 3 * MM * d, C, bottom], step=0.002)
    floor = FLOOR + (EAS, NODES, r"Gluteus maximus muscle\..", r"Anococcygeal .*")
    canal = Part("Anal canal", "digestive", "digestive", "pelvis", family=("Internal anal sphincter",))
    from shapes import tube, taper  # noqa: PLC0415

    b.solid(canal, "canal", tube(path, taper(path, r_canal, end=0.006, tip=0.7), 20),
            # (where it bends out of the rectum it crosses the external
            # sphincter's front rim: may press into it, at most 1.5 mm)
            Allow(start=("Sigmoid colon",), touch=floor, zone=0.010, squeeze=(EAS,), depth=1.5 * MM))
    b.add(canal)
    # The internal sphincter: from the junction to 14.5 mm below the ring's
    # centre (it ends about 1 cm above the anus).
    upper = path[(path - C) @ d <= 14.5 * MM]
    ias = Part("Internal anal sphincter", "muscular", "muscle", "pelvis", family=("Anal canal",))
    b.solid(ias, "cuff", sleeve(upper, r_canal + 0.1 * MM, r_canal + ias_t, segments=24),
            Allow(start=("Sigmoid colon",), touch=floor, zone=0.010, squeeze=(EAS, r"Pubo-analis muscle\.."),
                  depth=2.0 * MM))
    b.add(ias)


def build(b: Builder, only) -> None:
    def want(name: str) -> bool:
        return only is None or bool(only.search(name))

    if any(want(n) for n in CLITORIS):
        clitoris(b)
    if any(want(n) for n in VESTIBULE):
        vestibular_bulbs(b)
    if any(want(n) for n in VULVA):
        vulva(b)
    perineum(b, want)
    if want("Anal canal") or want("Internal anal sphincter"):
        anal_canal(b)
    if want("Bulbourethral gland"):
        bulbourethral_glands(b)
    for side in ("l", "r"):
        if want("Cremaster"):
            cremaster(b, side)
    if want("Urethra (female)") or want("Female urethra"):
        female_urethra(b)
