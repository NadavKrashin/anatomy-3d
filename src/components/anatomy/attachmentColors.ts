import type { AttachmentKind } from "@/types/anatomy";

/**
 * Attachment patch colours (3D patches and the info-panel key). Chosen
 * outside the tissue palette (bone ivory, muscle/artery red, vein blue,
 * nerve yellow) and the teal selection: violet origins, amber insertions,
 * slate for sites whose kind isn't confirmed.
 */
export const ATTACHMENT_COLORS: Record<AttachmentKind, string> = {
  origin: "#7a4fb3",
  insertion: "#d9822b",
  attachment: "#6f7a85",
};
