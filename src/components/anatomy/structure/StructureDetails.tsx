import { useMessages } from "@/hooks/useMessages";
import { localizeText } from "@/lib/i18n/localizeText";
import { useSettingsStore } from "@/store/settingsStore";
import { DETAIL_SECTIONS, type AnatomicalStructure } from "@/types/anatomy";
import { ContentText } from "./ContentText";

const sectionHeading =
  "text-muted mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase";

/** Description, bullet sections (function, origin, …) and clinical note — only what is known. */
export function StructureDetails({
  structure,
}: {
  structure: AnatomicalStructure;
}) {
  const t = useMessages();
  const locale = useSettingsStore((s) => s.locale);
  const details = structure.details ?? {};
  const sections = DETAIL_SECTIONS.flatMap((key) => {
    const items = details[key];
    return items && items.length > 0 ? [{ key, items }] : [];
  });

  if (!details.description && !details.clinicalNote && sections.length === 0) {
    return <p className="text-muted text-sm">{t.structure.noDetails}</p>;
  }

  const englishOnly = locale === "he" && !details.description?.he;

  return (
    <div className="flex flex-col gap-4 text-sm leading-relaxed">
      {englishOnly && t.structure.contentLanguageNote && (
        <p className="text-faint text-xs">{t.structure.contentLanguageNote}</p>
      )}
      {details.description && (
        <div className="text-ink/90">
          <ContentText text={details.description} as="p" />
        </div>
      )}
      {sections.map(({ key, items }) => (
        <section key={key}>
          <h3 className={sectionHeading}>{t.structure.sections[key]}</h3>
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              // The bullet follows the item's own direction, not the UI's.
              <li
                key={item.en}
                dir={localizeText(item, locale).dir}
                className="text-ink/90 flex gap-2"
              >
                <span
                  aria-hidden
                  className="bg-faint mt-2 size-1 shrink-0 rounded-full"
                />
                <ContentText text={item} />
              </li>
            ))}
          </ul>
        </section>
      ))}
      {details.clinicalNote && (
        <section className="border-line bg-raised rounded-[10px] border p-3">
          <h3 className={sectionHeading}>{t.structure.clinicalNote}</h3>
          <div className="text-ink/90">
            <ContentText text={details.clinicalNote} as="p" />
          </div>
        </section>
      )}
    </div>
  );
}
