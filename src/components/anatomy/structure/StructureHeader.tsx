import { X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { useMessages } from "@/hooks/useMessages";
import { useStructureNames } from "@/hooks/useStructureNames";
import { resolveName } from "@/lib/anatomy/names";
import { TERM_LANGUAGES, type AnatomicalStructure } from "@/types/anatomy";
import { SYSTEM_COLORS } from "../systemColors";
import { TermText } from "../TermText";

/** System/region eyebrow, primary + secondary name, and the remaining languages. */
export function StructureHeader({
  structure,
  onClose,
}: {
  structure: AnatomicalStructure;
  onClose: () => void;
}) {
  const t = useMessages();
  const { primary, secondary } = useStructureNames(structure);
  const shown = [primary.language, secondary?.language];
  const others = TERM_LANGUAGES.filter(
    (language) => !shown.includes(language) && structure.names[language],
  );

  return (
    <header className="border-line flex items-start gap-2 border-b p-4">
      <div className="min-w-0 flex-1">
        <p className="text-muted mb-1 flex items-center gap-2 text-xs">
          <span
            aria-hidden
            className="size-2 rounded-full"
            style={{ backgroundColor: SYSTEM_COLORS[structure.system] }}
          />
          {t.systems[structure.system]} · {t.regions[structure.region]}
        </p>
        <h2 className="text-ink text-xl leading-tight font-semibold">
          <TermText name={primary} />
        </h2>
        {secondary && (
          <p className="text-muted mt-0.5 text-base">
            <TermText name={secondary} />
          </p>
        )}
        {others.length > 0 && (
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            {others.map((language) => (
              <div key={language} className="contents">
                <dt className="text-faint">{t.termLanguages[language]}</dt>
                <dd className="text-muted">
                  <TermText name={resolveName(structure, language)} />
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <IconButton
        label={t.viewer.close}
        icon={<X />}
        onClick={onClose}
        className="-me-2 -mt-1"
      />
    </header>
  );
}
