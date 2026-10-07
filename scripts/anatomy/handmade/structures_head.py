"""
Hand-built structures of the head and the back of the neck: lingual and
posterior auricular arteries, suboccipital nerve. Courses: Gray's Anatomy
for Students, Moore, Netter (textbook-typical). Landmarks are measured on
the named meshes; offsets are stated with their reason. Frame: metres, +x =
the body's left, −y = anterior, +z = up. `sx` = +1 on the left, −1 on the
right.

Not built: the infra-orbital nerve (brief item 16) — Z-Anatomy's
"Maxillary nerve" mesh already runs on through the orbit floor to the face
and fans out there, i.e. it includes the infra-orbital nerve; a second mesh
would duplicate it (README → "Model quirks").
"""
import numpy as np

from landmarks import Allow
from parts import MM, Builder, Part, unit
from structures_neck import NODES, SIDES, hyoid_horn_tip


def lingual_artery(b: Builder, side: str) -> None:
    """
    Lingual artery: from the front of the external carotid opposite the tip
    of the hyoid's greater horn (between the superior thyroid artery below
    and the facial artery above); a short upward loop over the greater horn
    (the hypoglossal nerve crosses it there); then forward along the horn,
    deep (medial) to hyoglossus — the hypoglossal nerve and lingual vein lie
    superficial to that muscle — and on into the tongue as the deep lingual
    artery, near the tongue's under-surface beside genioglossus, to the tip.
    Ø 2.5 mm.
    """
    sx = SIDES[side]
    eca, hg = f"External carotid artery.{side}", f"Hyoglossus muscle.{side}"
    R = 1.25 * MM
    tip = hyoid_horn_tip(b, side)
    # Origin: the ECA's anteromedial wall 2 mm above the horn tip's level.
    z0 = tip[2] + 2 * MM
    c = b.body.centre_at(eca, 2, z0, 0.002)
    wall = b.body.ray(eca, c + np.array([0, 0, 0]), unit((-sx, -1, 0)), 0.03)
    o0 = c + (wall - c) * 0.5
    o1 = wall + unit((-sx, -1, 0.6)) * 2.5 * MM
    # Loop: up over the horn's tip, 6 mm above it, 2 mm in front.
    apex = tip + np.array([sx * 2.0, -2.0, 6.0]) * MM
    # Along the greater horn to hyoglossus' posterior border: radius + 1 mm
    # above the horn's upper surface and 2 mm medial to its crest (deep to
    # stylohyoid and the digastric, which reach the horn here), at three
    # points between them — the nearest spot with room.
    H = b.body.V(hg)
    Hy = b.body.V("Hyoid bone")
    Hy = Hy[sx * Hy[:, 0] > 4 * MM]
    y_hg = H[:, 1].max()
    over_horn = []
    for f in (0.3, 0.6, 0.9):
        y = tip[1] + (y_hg - tip[1]) * f
        S = Hy[np.abs(Hy[:, 1] - y) < 2 * MM]
        if len(S):
            top_ = S[np.argmax(S[:, 2])]
            q = np.array([top_[0] - sx * 2 * MM, y, top_[2] + R + 1.0 * MM])
            over_horn.append(b.free(q, R, allow=Allow(touch=(r"Hyoid bone", rf"Stylohyoid (muscle|ligament)\.{side}",
                                                             r"Posterior belly of digastric.*", hg,
                                                             rf"Middle pharyngeal constrictor\.{side}", NODES)),
                                    search=0.003))
    # Deep to hyoglossus: points on its medial surface (ray from the
    # midline outwards), radius + 0.8 mm medial to it, along its lower part
    # (6 mm above its lowest point at that y, clear of the hyoid and mylohyoid) from its posterior border to its
    # anterior border.
    ys = np.linspace(H[:, 1].max() - 3 * MM, H[:, 1].min() + 6 * MM, 4)
    deep = []
    for y in ys:
        S = H[np.abs(H[:, 1] - y) < 2 * MM]
        z = S[:, 2].min() + 6 * MM
        hit = b.body.ray(hg, (0.0, y, z), (sx, 0, 0), 0.05)
        if hit is None:
            continue
        # the nearest spot with room between hyoglossus and genioglossus
        deep.append(b.free(hit - np.array([sx * (R + 0.8 * MM), 0, 0]), R,
                           allow=Allow(touch=(hg, rf"Genioglossus muscle\.{side}", "Tongue", rf"Middle pharyngeal constrictor\.{side}")),
                           search=0.003))
    # Deep lingual artery: forward to near the tongue's tip, lateral to
    # genioglossus (its lateral surface by a ray from the side, + radius +
    # 0.6 mm), 7 mm above the tongue's under-surface at that y.
    T = b.body.V("Tongue")
    gg = f"Genioglossus muscle.{side}"
    y_front = T[:, 1].min()
    y_start = deep[-1][1] if deep else T[:, 1].max()
    deep_lingual = []
    for f in (0.35, 0.65, 0.85):
        y = y_start + (y_front + 12 * MM - y_start) * f
        z = T[np.abs(T[:, 1] - y) < 2 * MM][:, 2].min() + 7 * MM
        hit = b.body.ray(gg, (sx * 0.05, y, z), (-sx, 0, 0), 0.05)
        x = (hit[0] + sx * (0.8 * MM + 0.6 * MM)) if hit is not None else sx * 9 * MM
        deep_lingual.append(np.array([x, y, z]))
    part = Part(f"Lingual artery.{side}", "cardiovascular", "artery", "head")
    tongue = (r"Tongue", rf"Genioglossus muscle\.{side}", rf"Inferior longitudinal.*", rf"Hyoglossus muscle\.{side}",
              r"Sublingual gland.*", rf"Lingual (nerve|vein)\.{side}", rf"Hypoglossal nerve \(XII\)\.{side}")
    trunk = b.vessel(part, "artery", [o0, o1, apex] + over_horn + deep, R,
                     # It lies on the middle constrictor (the pharynx wall) and
                     # genioglossus under hyoglossus; the hypoglossal nerve crosses
                     # its loop. The model's tongue is one mesh enclosing its
                     # muscles (hyoglossus included): deep to hyoglossus the artery
                     # is in the tongue's root, inside that mesh.
                     Allow(anywhere=("Tongue",),
                           start=(eca, r"Hyoid bone", r"Stylohyoid muscle.*", r"Posterior belly of digastric.*",
                                  rf"Sternocleidomastoid muscle\.{side}", rf"Internal jugular vein\.{side}"),
                           touch=(NODES, r"Hyoid bone", hg, rf"Geniohyoid muscle\.{side}", rf"Middle pharyngeal constrictor\.{side}",
                                  rf"Genioglossus muscle\.{side}", rf"Hypoglossal nerve \(XII\)\.{side}",
                                  rf"Stylohyoid (muscle|ligament)\.{side}", r"Posterior belly of digastric.*",
                                  rf"Lingual (nerve|vein)\.{side}", r"Laryngopharynx", r"Oropharynx",
                                  rf"Mylohyoid muscle\.{side}"),
                           # (where the model's hyoglossus lies directly on genioglossus: ≤ 1.5 mm into either)
                           squeeze=(hg, rf"Genioglossus muscle\.{side}"), depth=1.5 * MM,
                           zone=0.008),
                     start_taper=0.0, end_taper=0.0)
    # Within the tongue (the model's tongue is one mesh round its muscles).
    D = trunk.path[-1]
    b.vessel(part, "deep lingual artery", [D] + deep_lingual, 0.8 * MM,
             Allow(anywhere=("Tongue",), touch=tongue + (NODES,)), end_taper=0.012)
    b.add(part)


def posterior_auricular_artery(b: Builder, side: str) -> None:
    """
    Posterior auricular artery: from the back of the external carotid just
    above the posterior belly of digastric (near the ECA's end in the
    parotid), up and back between the auricle (not modelled) and the mastoid
    process, beside the posterior auricular vein, to the scalp behind the
    ear. Ø 1.5 mm.
    """
    sx = SIDES[side]
    eca, vein = f"External carotid artery.{side}", f"Posterior auricular vein.{side}"
    R = 0.75 * MM
    E = b.body.V(eca)
    z0 = E[:, 2].max() - 4 * MM
    c = b.body.centre_at(eca, 2, z0, 0.002)
    back = b.body.ray(eca, (c[0], 0.15, z0), (0, -1, 0), 0.3)
    o0 = c + (back - c) * 0.5
    o1 = back + np.array([sx * 1.0, 2.5, 1.0]) * MM
    # Beside the vein: 1 mm + both radii from its centre, in front of it (the
    # vein lies on the bone: side by side along the surface), at five heights.
    V = b.body.V(vein)
    zs = np.linspace(V[:, 2].min() + 6 * MM, V[:, 2].max() - 4 * MM, 5)
    rv = 1.2 * MM
    along = []
    for z in zs:
        S = V[np.abs(V[:, 2] - z) < 2 * MM]
        cc = (S.min(0) + S.max(0)) / 2
        along.append(np.array([cc[0], cc[1] - (rv + 1 * MM + R), z]))
    part = Part(f"Posterior auricular artery.{side}", "cardiovascular", "artery", "head")
    b.vessel(part, "artery", [o0, o1] + along, R,
             Allow(start=(eca, rf"Parotid gland\.{side}", r"Posterior belly of digastric.*", rf"Stylohyoid muscle\.{side}"),
                   # Behind the ear it lies on the bone and ends in the scalp
                   # over the temporal muscles.
                   end=(rf"Parietal bone\.{side}", rf"Temporalis muscle\.{side}", rf"Temporoparietalis muscle\.{side}",
                        rf"Temporal bone\.{side}", r".*[Aa]uricular.*"),
                   touch=(NODES, vein, rf"Temporal bone\.{side}", rf"Parotid gland\.{side}",
                          rf"Sternocleidomastoid muscle\.{side}", r"Posterior belly of digastric.*",
                          r".*auricular.*", rf"Occipital artery\.{side}", r"Mastoid.*",
                          rf"Temporoparietalis muscle\.{side}", rf"Temporalis muscle\.{side}"),
                   zone=0.008, end_zone=0.015),
             start_taper=0.0, end_taper=0.012)
    b.add(part)


def suboccipital_nerve(b: Builder, side: str) -> None:
    """
    Suboccipital nerve (posterior ramus of C1): emerges between the occipital
    bone and the posterior arch of the atlas, under the vertebral artery as
    it lies in its groove on the arch; backwards into the suboccipital
    triangle (rectus capitis posterior major medially, obliquus capitis
    superior above-laterally, obliquus capitis inferior below), where it
    gives twigs to rectus capitis posterior major and minor, both obliques
    and semispinalis capitis. Ø 1.5 mm.
    """
    sx = SIDES[side]
    va, atlas = f"Vertebral artery.{side}", "Atlas (C1)"
    rpmaj, rpmin = f"Rectus posterior major capitis muscle.{side}", f"Rectus posterior minor capitis muscle.{side}"
    os_, oi = f"Obliquus superior capitis muscle.{side}", f"Obliquus inferior capitis muscle.{side}"
    ssc = f"Semispinalis capitis muscle.{side}"
    R = 0.75 * MM
    # Emergence: on the arch's upper surface behind the vertebral artery's
    # groove — the arch's highest point among its vertices 14–20 mm from the
    # midline, 2 mm behind the artery there — nearest spot with room.
    A = b.body.V(atlas)
    arch = A[(sx * A[:, 0] > 14 * MM) & (sx * A[:, 0] < 20 * MM) & (A[:, 1] > 0.02)]
    top = arch[np.argmax(arch[:, 2])]
    Va = b.body.V(va)
    near = Va[(np.abs(Va[:, 0] - top[0]) < 4 * MM) & (Va[:, 2] > top[2] - 3 * MM)]
    y_e = (near[:, 1].max() if len(near) else top[1]) + R + 1.5 * MM
    emerge = b.free(np.array([top[0], y_e, top[2] + R + 0.8 * MM]), R,
                    allow=Allow(touch=(atlas, va, r"Occipital bone")), search=0.005)
    # The triangle: midway between the three muscles' facing borders at the
    # emergence's height − 6 mm, measured from their nearest points.
    seed = emerge + np.array([sx * 6, 10, -6]) * MM
    corners = [b.body.nearest(m, seed)[0] for m in (rpmaj, os_, oi)]
    centre = b.free(np.mean(corners, axis=0), R, allow=Allow(touch=(rpmaj, os_, oi, ssc, NODES)), search=0.006)
    part = Part(f"Suboccipital nerve.{side}", "nervous", "nerve", "back")
    muscles = (rpmaj, rpmin, os_, oi, ssc)
    trunk = b.vessel(part, "nerve", [emerge, (emerge + centre) / 2 + np.array([0, 1, 0]) * MM, centre], R,
                     Allow(start=(atlas, va, r"Occipital bone", r"Posterior atlanto-occipital membrane.*"),
                           touch=muscles + (NODES, atlas, va, r"Suboccipital venous plexus.*"), zone=0.006),
                     start_taper=0.0, end_taper=0.0)
    C = trunk.path[-1]
    # Twigs: 10 mm towards each muscle's nearest surface, ending on it.
    for m, label in ((rpmaj, "to rectus posterior major"), (rpmin, "to rectus posterior minor"),
                     (os_, "to obliquus superior"), (oi, "to obliquus inferior"), (ssc, "to semispinalis capitis")):
        if m not in b.body.meshes:
            continue
        loc = b.body.nearest(m, C)[0]
        d = loc - C
        dist = np.linalg.norm(d)
        end = C + d * max(0.0, (dist - 0.6 * MM) / dist) if dist > 1e-6 else loc
        b.vessel(part, label, [C, (C + end) / 2 + np.array([0, 0.5, 0]) * MM, end], 0.4 * MM,
                 Allow(start=muscles, end=(m,), touch=muscles + (NODES,), zone=0.004, end_zone=0.004),
                 end_taper=0.004)
    b.add(part)


def build(b: Builder, only) -> None:
    def want(name: str) -> bool:
        return only is None or bool(only.search(name))

    for side in ("l", "r"):
        if want("Lingual artery"):
            lingual_artery(b, side)
        if want("Posterior auricular artery"):
            posterior_auricular_artery(b, side)
        if want("Suboccipital nerve"):
            suboccipital_nerve(b, side)
