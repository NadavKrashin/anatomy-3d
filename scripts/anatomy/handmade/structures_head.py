"""
Hand-built structures of the head and the back of the neck: lingual and
posterior auricular arteries, suboccipital nerve, the middle ear's muscles
(tensor tympani, stapedius). Courses: Gray's Anatomy
for Students, Moore, Netter (textbook-typical). Landmarks are measured on
the named meshes; offsets are stated with their reason. Frame: metres, +x =
the body's left, −y = anterior, +z = up. `sx` = +1 on the left, −1 on the
right.

Not built here: the infra-orbital nerve (brief item 16) — Z-Anatomy's
"Maxillary nerve" mesh already runs on through the orbit floor to the face,
so scripts/anatomy/z-anatomy/split-meshes.ts cuts that part out of it as its
own mesh (README → "Model quirks").

The middle ear: the model's temporal bone is one closed mesh with no
tympanic cavity or canals — the ossicles, cochlea and vestibule lie inside
it — so the middle ear's muscles may lie anywhere inside it too (they run
in bony canals); everything else in there (ossicles, inner ear, facial and
chorda tympani nerves, eardrum) they must clear.
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
    # Over the middle of the greater horn, on the middle constrictor: radius +
    # 2.5 mm above the horn's top, above its centre (deep to stylohyoid and
    # the digastric, which reach the horn here).
    H = b.body.V(hg)
    Hy = b.body.V("Hyoid bone")
    Hy = Hy[sx * Hy[:, 0] > 4 * MM]
    y_hg = H[:, 1].max()
    y_mid = (tip[1] + y_hg) / 2
    S = Hy[np.abs(Hy[:, 1] - y_mid) < 2 * MM]
    room = Allow(touch=(r"Hyoid bone", rf"Stylohyoid (muscle|ligament)\.{side}", r"Posterior belly of digastric.*", hg,
                        rf"Middle pharyngeal constrictor\.{side}", rf"Genioglossus muscle\.{side}", "Tongue", NODES))
    # (each the nearest spot with room)
    over_horn = [b.free(np.array([S[:, 0].mean(), y_mid, S[:, 2].max() + R + 2.5 * MM]), R, allow=room, search=0.003)
                 ] if len(S) else []
    # Deep to hyoglossus, straight from its posterior to its anterior border:
    # radius + 0.8 mm medial to its medial surface (ray from the midline
    # outwards), 6 mm above its lowest point there (clear of the hyoid and
    # mylohyoid).
    deep = []
    for y in (H[:, 1].max() - 3 * MM, H[:, 1].min() + 6 * MM):
        Sh = H[np.abs(H[:, 1] - y) < 2 * MM]
        z = Sh[:, 2].min() + 6 * MM
        hit = b.body.ray(hg, (0.0, y, z), (sx, 0, 0), 0.05)
        if hit is not None:
            deep.append(b.free(hit - np.array([sx * (R + 0.8 * MM), 0, 0]), R, allow=room, search=0.003))
    # Deep lingual artery: forward to near the tongue's tip, lateral to
    # genioglossus (its lateral surface by a ray from the side, + radius +
    # 0.6 mm), 10 mm above the tongue's under-surface at that y (above the
    # sublingual gland, which lies under the tongue).
    T = b.body.V("Tongue")
    gg = f"Genioglossus muscle.{side}"
    y_front = T[:, 1].min()
    y_start = deep[-1][1] if deep else T[:, 1].max()
    deep_lingual = []
    for f in (0.35, 0.65, 0.85):
        y = y_start + (y_front + 12 * MM - y_start) * f
        z = T[np.abs(T[:, 1] - y) < 2 * MM][:, 2].min() + 10 * MM
        hit = b.body.ray(gg, (sx * 0.05, y, z), (-sx, 0, 0), 0.05)
        x = (hit[0] + sx * (0.8 * MM + 0.6 * MM)) if hit is not None else sx * 9 * MM
        deep_lingual.append(np.array([x, y, z]))
    # The hypoglossal nerve crosses its loop, where the ansa's superior root
    # leaves the nerve: may touch it.
    part = Part(f"Lingual artery.{side}", "cardiovascular", "artery", "head",
                family=(f"Superior root of ansa cervicalis.{side}",))
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
             # (hyoglossus lies directly on genioglossus up to its anterior
             # border: ≤ 1.5 mm into either, as the trunk)
             Allow(anywhere=("Tongue",), touch=tongue + (NODES,),
                   squeeze=(hg, gg), depth=1.5 * MM), end_taper=0.012)
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


EAR_FINE = 0.0005  # m: sample step for the middle ear's millimetre-scale muscles


def tensor_tympani(b: Builder, side: str) -> None:
    """
    Tensor tympani: from the cartilage of the auditory tube and the adjacent
    sphenoid, in its semicanal directly above the bony auditory tube, back
    and laterally to the cochleariform process on the medial wall of the
    tympanic cavity — above the promontory (the cochlea's basal turn), in
    front of the oval window (the stapes' footplate), below the facial
    nerve's tympanic segment. There its tendon turns laterally across the
    cavity to the medial surface of the malleus' handle near its root. Belly
    about 2 cm long, Ø 2 mm; tendon Ø 0.6 mm.
    """
    sx = SIDES[side]
    tube_, mall, stapes = f"Auditory tube.{side}", f"Malleus.{side}", f"Stapes.{side}"
    R = 1.0 * MM
    T = b.body.V(tube_)
    xs = sx * T[:, 0]
    # Above the tube: at two points along it (10 and 3 mm short of its
    # lateral end), the belly's centre is radius +
    # 0.6 mm above the tube's top, over its middle (the semicanal lies on it,
    # separated by a thin bony septum).
    over = []
    for x in (xs.max() - 10 * MM, xs.max() - 3 * MM):
        S = T[np.abs(xs - x) < 1.2 * MM]
        over.append(np.array([sx * x, (S[:, 1].min() + S[:, 1].max()) / 2, S[:, 2].max() + R + 0.6 * MM]))
    # The model's tube ends 10 mm medial to the tympanic cavity, short of
    # the cochlea (Z-Anatomy quirk); over its end lies the facial nerve, and
    # the temporomandibular disc and the temporal lobe reach into the bone in
    # front of the cochlea. The only room for a muscle (a clearance-grid
    # search, README → "Model quirks") is a corridor from the tube's end
    # down and forward round the front of the cochlea, then back along the
    # cavity's anterior wall to the process. Measured on the cochlea's
    # section 1.5 mm below the stapes' top: from 0.5 mm past the tube's end
    # (2.5 mm in front of it, at its mid-height), 3 mm in front of the
    # cochlea's front-most point, then 2.5 mm lateral to the cochlea, 1 mm
    # in front of its front (1.5 mm higher) and 4.5 mm in front of the
    # stapes (at the process's height).
    St = b.body.V(stapes)
    coch = f"Cochlea.{side}"
    end_ = T[xs > xs.max() - 1.5 * MM]
    C = b.body.section(coch, 2, St[:, 2].max() - 1.5 * MM)
    z_c = C[:, 2].mean()
    front = C[np.argmin(C[:, 1])]
    lat = np.abs(C[:, 0]).max()
    # The cochleariform process: at the stapes' front edge − 2 mm (anterior)
    # and the stapes' top + 0.5 mm (above the promontory, below the facial
    # canal), 1.1 mm lateral to the cochlea's section there.
    y_p = St[:, 1].min() - 2 * MM
    z_p = St[:, 2].max() + 0.5 * MM
    x_p = sx * (np.abs(b.body.section(coch, 2, z_p)[:, 0]).max() + 0.3 * MM + 0.8 * MM)
    route = [
        np.array([sx * (xs.max() + 0.5 * MM), end_[:, 1].min() - 2.5 * MM, (end_[:, 2].min() + end_[:, 2].max()) / 2]),
        np.array([front[0], front[1] - 3.0 * MM, z_c]),
        np.array([sx * (lat + 2.5 * MM), front[1] - 1.0 * MM, z_c + 1.5 * MM]),
        np.array([sx * (lat + 2.5 * MM), St[:, 1].min() - 4.5 * MM, z_p]),
    ]
    inner = (coch, f"Vestibule.{side}")
    ear = (rf"Temporal bone\.{side}",)
    room = Allow(anywhere=ear, touch=inner)
    process = b.free(np.array([x_p, y_p, z_p]), 0.3 * MM, allow=room, search=0.0015)
    # (each the nearest spot with room for the belly, or the roomiest)
    route = [b.free(q, R, allow=room, search=0.002) for q in route]
    part = Part(f"Tensor tympani muscle.{side}", "muscular", "muscle", "head")
    belly = b.vessel(part, "belly", over + route + [process], R,
                     Allow(anywhere=ear,
                           # (from the tube's cartilage and the sphenoid's spine, over
                           # its first 7 mm; lies on the tube and the otic capsule)
                           start=(tube_, r"Sphenoid bone", rf"Internal carotid artery\.{side}"),
                           touch=(tube_,) + inner, zone=0.007, end_zone=0.002),
                     start_taper=0.006, end_taper=0.006, tip=0.3, step=EAR_FINE,
                     # (relaxing a path sampled this finely makes it zig-zag; the
                     # control points above are each placed with room)
                     do_relax=False, fit=True)
    # Tendon: from the process laterally to the handle's medial surface 1 mm
    # below its root (the malleus' handle is its part below the lateral
    # process; its root is taken 3 mm above the umbo, its lowest point).
    M = b.body.V(mall)
    umbo = M[np.argmin(M[:, 2])]
    z_t = umbo[2] + 2.5 * MM
    Sm = M[np.abs(M[:, 2] - z_t) < 0.5 * MM]
    y_t = Sm[:, 1].mean()
    ins = b.body.ray(mall, (sx * 0.035, y_t, z_t), (sx, 0, 0), 0.03)
    P0 = belly.path[-1]
    b.vessel(part, "tendon", [P0, (P0 + ins) / 2, ins], 0.3 * MM,
             Allow(anywhere=ear, start=inner, end=(mall,), touch=inner + (mall,), zone=0.0015, end_zone=0.0015),
             start_taper=0.0, end_taper=0.0, step=EAR_FINE, spacing=0.0015)
    b.add(part)


def stapedius(b: Builder, side: str) -> None:
    """
    Stapedius: in a canal in the posterior wall of the tympanic cavity,
    beside (medial and in front of) the facial nerve's descending (mastoid)
    segment, which supplies it; its tendon leaves the apex of the pyramidal
    eminence and runs forward to the back of the neck of the stapes. The
    body's smallest muscle: belly about 6 mm, Ø 1.6 mm; tendon Ø 0.5 mm.
    """
    sx = SIDES[side]
    vii, stapes = f"Facial nerve (VII).{side}", f"Stapes.{side}"
    R = 0.8 * MM
    St = b.body.V(stapes)
    # The stapes' head: its lateral end (the incus' long process meets it).
    head = St[np.abs(St[:, 0]) > np.abs(St[:, 0]).max() - 1.0 * MM]
    z_h = head[:, 2].mean()
    # The neck's back: the stapes' surface hit from behind, 1 mm medial to
    # the head's lateral end, at the head's height.
    x_n = sx * (np.abs(St[:, 0]).max() - 1.0 * MM)
    neck = b.body.ray(stapes, (x_n, St[:, 1].max() + 0.01, z_h), (0, -1, 0), 0.02)
    # The facial nerve's descending segment: its vertices behind the
    # stapes (y > the stapes' back + 3 mm), lateral of the stapes' footplate.
    Fn = b.body.V(vii)
    Fn = Fn[(Fn[:, 1] > St[:, 1].max() + 3 * MM) & (sx * Fn[:, 0] > np.abs(St[:, 0]).min())
            & (Fn[:, 2] < z_h) & (Fn[:, 2] > z_h - 15 * MM)]

    def beside(z: float) -> np.ndarray:
        # Medial-front of the nerve at height z: radius + 0.4 mm medial to
        # its medial edge, level with its front edge + radius.
        S = Fn[np.abs(Fn[:, 2] - z) < 0.75 * MM]
        return np.array([sx * (np.abs(S[:, 0]).min() - R - 0.4 * MM), S[:, 1].min() + R, z])

    # Belly from 9 mm to 3 mm below the stapes' head; the pyramid's apex
    # 1.5 mm below and 2.5 mm behind the neck.
    low, high = beside(z_h - 9 * MM), beside(z_h - 3 * MM)
    apex = neck + np.array([0, 2.5, -1.5]) * MM
    part = Part(f"Stapedius muscle.{side}", "muscular", "muscle", "head")
    ear = (rf"Temporal bone\.{side}",)
    belly = b.vessel(part, "belly", [low, (low + high) / 2, high, apex], R,
                     Allow(anywhere=ear, touch=(vii, f"Vestibule.{side}"), zone=0.002),
                     start_taper=0.003, end_taper=0.002, tip=0.35, step=EAR_FINE, spacing=0.002)
    P0 = belly.path[-1]
    b.vessel(part, "tendon", [P0, (P0 + neck) / 2, neck], 0.25 * MM,
             Allow(anywhere=ear, end=(stapes,), touch=(vii, stapes, f"Incus.{side}"), zone=0.001, end_zone=0.0012),
             start_taper=0.0, end_taper=0.0, step=EAR_FINE, spacing=0.001)
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
        if want("Tensor tympani muscle"):
            tensor_tympani(b, side)
        if want("Stapedius muscle"):
            stapedius(b, side)
