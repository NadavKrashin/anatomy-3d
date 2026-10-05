import { useMessages } from "@/hooks/useMessages";
import { localizeText } from "@/lib/i18n/localizeText";
import { useSettingsStore } from "@/store/settingsStore";
import { DETAIL_SECTIONS, type AnatomicalStructure } from "@/types/anatomy";
import { ContentText } from "./ContentText";

const sectionHeading = "text-ink mb-1.5 text-[14px] font-semibold";

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
    return <p className="text-graphite text-sm">{t.structure.noDetails}</p>;
  }

  const englishOnly = locale === "he" && !details.description?.he;

  return (
    <div className="flex flex-col gap-5 text-[15px] leading-relaxed">
      {englishOnly && t.structure.contentLanguageNote && (
        <p className="text-faint text-[13px]">
          {t.structure.contentLanguageNote}
        </p>
      )}
      {details.description && (
        <div className="text-ink">
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
                className="text-ink flex gap-2.5"
              >
                <span
                  aria-hidden
                  className="bg-scrub/60 mt-[0.6em] size-1.5 shrink-0 rounded-full"
                />
                <ContentText text={item} />
              </li>
            ))}
          </ul>
        </section>
      ))}
      {details.clinicalNote && (
        <section className="border-scrub border-s-2 ps-4">
          <h3 className={sectionHeading}>{t.structure.clinicalNote}</h3>
          <div className="text-ink/90">
            <ContentText text={details.clinicalNote} as="p" />
          </div>
        </section>
      )}
    </div>
  );
}
