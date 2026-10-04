"use client";

import { BookOpen, EyeOff, Focus, Layers, X } from "lucide-react";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { IconButton } from "@/components/ui/IconButton";
import { useMessages } from "@/hooks/useMessages";
import { useStructureNames } from "@/hooks/useStructureNames";
import { resolveName } from "@/lib/anatomy/names";
import { VIEWER_OBSTRUCTION_ATTRIBUTE } from "@/lib/anatomy/viewerDom";
import { useSettingsStore } from "@/store/settingsStore";
import { useViewerStore } from "@/store/viewerStore";
import {
  DETAIL_SECTIONS,
  TERM_LANGUAGES,
  type AnatomicalStructure,
  type LocalizedText,
  type TermLanguage,
} from "@/types/anatomy";
import { SYSTEM_COLORS } from "./systemColors";
import { TermText } from "./TermText";

/** Detailed content is authored in English first; show Hebrew when it exists. */
function useLocalizedText() {
  const locale = useSettingsStore((s) => s.locale);
  return (text: LocalizedText): { text: string; language: TermLanguage } =>
    locale === "he" && text.he
      ? { text: text.he, language: "he" }
      : { text: text.en, language: "en" };
}

function useContentDirection() {
  const locale = useSettingsStore((s) => s.locale);
  return (text: LocalizedText): "rtl" | "ltr" =>
    locale === "he" && text.he ? "rtl" : "ltr";
}

function ContentText({
  text,
  as: Tag = "span",
}: {
  text: LocalizedText;
  as?: "span" | "p";
}) {
  const localize = useLocalizedText();
  const { text: value, language } = localize(text);
  return (
    <Tag
      lang={language}
      dir={language === "he" ? "rtl" : "ltr"}
      className="block"
    >
      {value}
    </Tag>
  );
}

function OtherNames({
  structure,
  shown,
}: {
  structure: AnatomicalStructure;
  shown: TermLanguage[];
}) {
  const t = useMessages();
  const others = TERM_LANGUAGES.filter(
    (language) => !shown.includes(language) && structure.names[language],
  );
  if (others.length === 0) return null;
  return (
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
  );
}

function StructureDetailsView({
  structure,
}: {
  structure: AnatomicalStructure;
}) {
  const t = useMessages();
  const locale = useSettingsStore((s) => s.locale);
  const details = structure.details;
  const directionOf = useContentDirection();
  const sections = DETAIL_SECTIONS.filter(
    (key) => (details?.[key]?.length ?? 0) > 0,
  );
  const hasContent = Boolean(
    details?.description || details?.clinicalNote || sections.length > 0,
  );

  if (!hasContent)
    return <p className="text-muted text-sm">{t.structure.noDetails}</p>;

  const englishOnly = locale === "he" && !details?.description?.he;

  return (
    <div className="flex flex-col gap-4 text-sm leading-relaxed">
      {englishOnly && t.structure.contentLanguageNote && (
        <p className="text-faint text-xs">{t.structure.contentLanguageNote}</p>
      )}
      {details?.description && (
        <div className="text-ink/90">
          <ContentText text={details.description} as="p" />
        </div>
      )}
      {sections.map((key) => (
        <section key={key}>
          <h3 className="text-muted mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase">
            {t.structure.sections[key]}
          </h3>
          <ul className="flex flex-col gap-1">
            {details![key]!.map((item) => (
              <li
                key={item.en}
                dir={directionOf(item)}
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
      {details?.clinicalNote && (
        <section className="border-line bg-raised rounded-[10px] border p-3">
          <h3 className="text-muted mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase">
            {t.structure.clinicalNote}
          </h3>
          <div className="text-ink/90">
            <ContentText text={details.clinicalNote} as="p" />
          </div>
        </section>
      )}
    </div>
  );
}

function SelectedStructure({ structure }: { structure: AnatomicalStructure }) {
  const t = useMessages();
  const { primary, secondary } = useStructureNames(structure);
  const isIsolated = useViewerStore(
    (s) => s.isolatedStructureId === structure.id,
  );
  const { focus, hide, isolate, exitIsolate, select } =
    useViewerStore.getState();

  return (
    <>
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
          <OtherNames
            structure={structure}
            shown={[
              primary.language,
              ...(secondary ? [secondary.language] : []),
            ]}
          />
        </div>
        <IconButton
          label={t.viewer.close}
          icon={<X />}
          onClick={() => select(null)}
          className="-me-2 -mt-1"
        />
      </header>

      <div className="border-line flex flex-wrap gap-1 border-b px-2 py-2">
        <IconButton
          showLabel
          label={t.structure.focus}
          icon={<Focus />}
          onClick={() => focus(structure.id)}
        />
        <IconButton
          showLabel
          label={isIsolated ? t.viewer.exitIsolate : t.structure.isolate}
          icon={<Layers />}
          active={isIsolated}
          onClick={() => (isIsolated ? exitIsolate() : isolate(structure.id))}
        />
        <IconButton
          showLabel
          label={t.structure.hide}
          icon={<EyeOff />}
          onClick={() => hide(structure.id)}
        />
        <IconButton
          showLabel
          label={`${t.structure.studyThis} · ${t.nav.comingSoon}`}
          icon={<BookOpen />}
          disabled
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <StructureDetailsView structure={structure} />
      </div>
    </>
  );
}

export function StructureInfoPanel() {
  const { registry } = useAnatomyData();
  const selectedId = useViewerStore((s) => s.selectedStructureId);
  const structure = selectedId ? registry.get(selectedId) : undefined;
  if (!structure) return null;

  return (
    <aside
      {...{ [VIEWER_OBSTRUCTION_ATTRIBUTE]: "" }}
      aria-label={structure.names.en.text}
      className="panel absolute inset-x-2 bottom-2 z-20 flex max-h-[48dvh] flex-col md:inset-x-auto md:end-4 md:top-20 md:bottom-auto md:max-h-[calc(100dvh-7rem)] md:w-[360px]"
    >
      <SelectedStructure key={structure.id} structure={structure} />
    </aside>
  );
}
