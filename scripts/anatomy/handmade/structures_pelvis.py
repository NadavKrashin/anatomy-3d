"""
Hand-built perineum: perineal body, perineal muscles (both bodies, male and
female versions where they differ), anal canal and internal anal sphincter;
male bulbourethral glands and cremaster.
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
            "Urethrovaginal sphincter", "Bulbospongiosus muscle") + tuple(
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
            part = Part(f"Bulbospongiosus muscle.{side}", "muscular", "muscle", "pelvis", sex="female",
                        group="Bulbospongiosus muscle", group_side="midline", family=PERINEAL)
            b.vessel(part, "band", pts, 2.5 * MM,
                     Allow(start=("Perineal body",), touch=("Vagina", "Perineal body", NODES) + FLOOR, zone=0.005),
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
            part = Part(f"Ischiocavernosus muscle (female).{side}", "muscular", "muscle", "pelvis", sex="female",
                        family=PERINEAL)
            b.vessel(part, "band", axis, 3.0 * MM,
                     Allow(touch=(HIP, NODES, "Perineal body") + FLOOR,
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

    perineum(b, want)
    if want("Anal canal") or want("Internal anal sphincter"):
        anal_canal(b)
    if want("Bulbourethral gland"):
        bulbourethral_glands(b)
    for side in ("l", "r"):
        if want("Cremaster"):
            cremaster(b, side)
