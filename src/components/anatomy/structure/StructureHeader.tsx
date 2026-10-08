import { X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { useMessages } from "@/hooks/useMessages";
import { useStructureNames } from "@/hooks/useStructureNames";
import { resolveName } from "@/lib/anatomy/names";
import { TERM_LANGUAGES, type AnatomicalStructure } from "@/types/anatomy";
import { SYSTEM_COLORS } from "../systemColors";
import { TermText } from "../TermText";

/** The structure's name set like an atlas label, with its other names below. */
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
    <header className="flex items-start gap-2 px-5 pt-5 pb-4">
      <div className="min-w-0 flex-1">
        <p className="text-graphite mb-2 flex items-center gap-2 text-[13px]">
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ backgroundColor: SYSTEM_COLORS[structure.system] }}
          />
          {t.systems[structure.system]}, {t.regions[structure.region]}
        </p>
        <h2 className="text-ink font-title text-[26px] leading-[1.15] font-medium">
          <TermText name={primary} />
        </h2>
        {secondary && (
          <p className="text-graphite font-title mt-1 text-[18px] leading-snug">
            <TermText name={secondary} />
          </p>
        )}
        {others.map((language) => (
          <p key={language} className="text-graphite mt-1.5 text-[13px]">
            <span className="text-faint">{t.termLanguages[language]}: </span>
            <TermText name={resolveName(structure, language)} />
          </p>
        ))}
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
