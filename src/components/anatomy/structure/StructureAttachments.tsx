import { MapPin } from "lucide-react";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { IconButton } from "@/components/ui/IconButton";
import { useMessages } from "@/hooks/useMessages";
import { useStructureNames } from "@/hooks/useStructureNames";
import {
  attachmentsFor,
  summarizeAttachments,
} from "@/lib/anatomy/attachments";
import { useViewerStore } from "@/store/viewerStore";
import type { AnatomicalStructure } from "@/types/anatomy";
import { ATTACHMENT_COLORS } from "../attachmentColors";
import { TermText } from "../TermText";

function NameLink({ structure }: { structure: AnatomicalStructure }) {
  const { primary } = useStructureNames(structure);
  return (
    <button
      type="button"
      onClick={() => useViewerStore.getState().select(structure.id)}
      className="text-ink decoration-rule hover:decoration-ink font-title min-h-8 text-start text-[16px] underline underline-offset-4"
    >
      <TermText name={primary} showVerification={false} />
    </button>
  );
}

/**
 * Origin / insertion key for a muscle (which bones), or the muscles attached
 * to a bone. The colours match the patches drawn on the model.
 */
export function StructureAttachments({
  structure,
}: {
  structure: AnatomicalStructure;
}) {
  const t = useMessages();
  const { dataset, registry } = useAnatomyData();
  const showing = useViewerStore((s) => s.showAttachments);
  const data = dataset.attachments;
  const isBone = structure.system === "skeletal";
  if (!data || (!isBone && structure.system !== "muscular")) return null;

  const items = attachmentsFor(structure.id, registry, data.items);
  if (isBone && items.length === 0) return null;
  const rows = summarizeAttachments(items, isBone ? "bone" : "muscle");

  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h3 className="text-ink text-[14px] font-semibold">
          {isBone ? t.attachments.boneTitle : t.attachments.title}
        </h3>
        {items.length > 0 && (
          <IconButton
            showLabel
            label={t.attachments.showOnModel}
            icon={<MapPin />}
            active={showing}
            onClick={() =>
              useViewerStore.getState().setShowAttachments(!showing)
            }
            className="-me-2 h-8 text-[13px]"
          />
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-graphite text-[14px]">{t.attachments.none}</p>
      ) : (
        <>
          <ul className="divide-rule border-rule divide-y border-y">
            {rows.map((row) => (
              <li key={row.kind} className="flex gap-3 py-2.5">
                <span
                  aria-hidden
                  className="mt-1.5 size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: ATTACHMENT_COLORS[row.kind] }}
                />
                <div className="min-w-0">
                  <p className="text-graphite text-[13px]">
                    {t.attachments.kinds[row.kind]}
                  </p>
                  <div className="flex flex-wrap gap-x-3">
                    {row.structureIds.map((id) => {
                      const named = registry.get(id);
                      return named ? (
                        <NameLink key={id} structure={named} />
                      ) : null;
                    })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-faint mt-2 text-[12px]">{t.attachments.source}</p>
        </>
      )}
    </section>
  );
}
