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
 * descriptions (e.g. Gray's, Moore): serratus anterior, pectoralis minor and
 * subclavius come out reversed, trapezius parts mix up their attachments, and
 * a few patches sit where the label doesn't fit. Their patches are shown as
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
]);

/** Bone names in the attachment data are bare ("Scapula"); midline bones have no side. */
function boneIdFor(
  on: string,
  side: BodySide,
  isKnown: (id: string) => boolean,
) {
  const sided = toId(parseName(on).base, side);
  if (isKnown(sided)) return sided;
  const midline = toId(parseName(on).base, "midline");
  return isKnown(midline) ? midline : undefined;
}

export function buildAttachments(
  raw: readonly AttachmentEntry[],
  isKnown: (structureId: string) => boolean,
): MuscleAttachment[] {
  return raw.map((entry) => {
    const boneId = entry.on
      ? boneIdFor(entry.on, entry.side, isKnown)
      : undefined;
    return {
      meshName: entry.name,
      structureId: toId(entry.muscle, entry.side),
      kind: KIND_UNDER_REVIEW.has(entry.muscle) ? "attachment" : entry.kind,
      ...(boneId ? { boneId } : {}),
    };
  });
}

export function zAnatomyAttachments(
  isKnown: (structureId: string) => boolean,
): AttachmentData {
  return {
    modelUrl: "/models/z-anatomy-upper-limb-attachments.glb",
    items: buildAttachments(entries as AttachmentEntry[], isKnown),
  };
}
