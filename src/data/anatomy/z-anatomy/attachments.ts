import type {
  AttachmentData,
  AttachmentKind,
  BodySide,
  MuscleAttachment,
} from "@/types/anatomy";
import { parseName, toId } from "./build";
import entries from "./attachments.json";

/** One patch, as written by scripts/anatomy/z-anatomy/export_attachments.py. */
export interface AttachmentEntry {
  name: string;
  /** Muscle or muscle-part base name (no side). */
  muscle: string;
  side: Exclude<BodySide, "midline">;
  kind: AttachmentKind;
  /** Bone or cartilage the patch lies on (no side), from the source hierarchy. */
  on: string | null;
}

/**
 * Muscles whose source origin/insertion labels contradict standard
 * descriptions (e.g. Gray's, Moore) — checked muscle by muscle for the whole
 * body: e.g. serratus anterior, pectoralis minor, subclavius, the scalenes
 * and the suboccipital muscles come out reversed, trapezius parts and the
 * abdominal wall mix up their attachments, and a few patches sit where the
 * label doesn't fit. Their patches are shown as
 * attachment sites without claiming which is the origin — never "corrected"
 * here. Listed in docs/CONTENT_REVIEW.md for verification.
 */
export const KIND_UNDER_REVIEW: ReadonlySet<string> = new Set([
  "Serratus anterior muscle",
  "Pectoralis minor muscle",
  "Subclavius muscle",
  "Latissimus dorsi muscle",
  "Descending part of trapezius muscle",
  "Transverse part of trapezius muscle",
  "Ascending part of trapezius muscle",
  "Extensor carpi ulnaris",
  "Deep head of flexor pollicis brevis",
  // Neck and head: reversed (the source takes the upper end as the origin).
  "Scalenus anterior muscle",
  "Scalenus medius muscle",
  "Scalenus posterior muscle",
  "Thyrohyoid muscle",
  "Longus capitis muscle",
  "Rectus anterior capitis muscle",
  "Rectus lateralis capitis muscle",
  "Rectus posterior major capitis muscle",
  "Rectus posterior minor capitis muscle",
  "Obliquus inferior capitis muscle",
  "Obliquus superior capitis muscle",
  // Abdominal wall: rib/costal attachments labelled the wrong way round.
  "Rectus abdominis muscle",
  "External abdominal oblique muscle",
  "Internal abdominal oblique muscle",
  // Attachment sites that don't fit the label.
  "Lateral pterygoid muscle",
  "Procerus muscle",
  "Frontalis muscle",
  "Extensor hallucis longus",
  "Lateral head of flexor hallucis brevis",
]);

/** Names in the attachment data are bare ("Scapula"); midline structures have no side. */
function idFor(
  name: string,
  side: BodySide,
  isKnown: (id: string) => boolean,
): string | undefined {
  const sided = toId(parseName(name).base, side);
  if (isKnown(sided)) return sided;
  const midline = toId(parseName(name).base, "midline");
  return isKnown(midline) ? midline : undefined;
}

export function buildAttachments(
  raw: readonly AttachmentEntry[],
  isKnown: (structureId: string) => boolean,
): MuscleAttachment[] {
  return raw.flatMap((entry) => {
    const structureId = idFor(entry.muscle, entry.side, isKnown);
    if (!structureId) return []; // muscle not in the dataset
    const boneId = entry.on ? idFor(entry.on, entry.side, isKnown) : undefined;
    return [
      {
        meshName: entry.name,
        structureId,
        kind: KIND_UNDER_REVIEW.has(entry.muscle) ? "attachment" : entry.kind,
        ...(boneId ? { boneId } : {}),
      },
    ];
  });
}

export function zAnatomyAttachments(
  isKnown: (structureId: string) => boolean,
): AttachmentData {
  return {
    modelUrl: "/models/z-anatomy/attachments.glb",
    items: buildAttachments(entries as AttachmentEntry[], isKnown),
  };
}
