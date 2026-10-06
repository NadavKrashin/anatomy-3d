"use client";

import { Segmented } from "@/components/ui/Segmented";
import { useMessages } from "@/hooks/useMessages";
import { LOCALES, type Locale } from "@/lib/i18n/locale";
import { useSettingsStore } from "@/store/settingsStore";
import {
  TERM_LANGUAGES,
  type BodySex,
  type TermLanguage,
} from "@/types/anatomy";

const LOCALE_NAMES: Record<Locale, string> = { he: "עברית", en: "English" };
const NONE = "none";
const BODY_SEXES: readonly BodySex[] = ["male", "female"];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="text-graphite flex flex-col gap-1.5 text-[13px]">
      {label}
      {children}
    </label>
  );
}

const selectClass =
  "bg-wash text-ink h-10 rounded-full px-4 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-scrub/40";

/** The settings: which body, interface language, name languages. */
export function SettingsFields() {
  const t = useMessages();
  const {
    locale,
    termPreference,
    bodySex,
    setLocale,
    setTermPreference,
    setBodySex,
  } = useSettingsStore();

  return (
    <>
      <Segmented
        name="body-sex"
        legend={t.settings.body}
        options={BODY_SEXES.map((value) => ({
          value,
          label: t.settings.bodySex[value],
        }))}
        value={bodySex}
        onChange={setBodySex}
      />
      <Field label={t.settings.interfaceLanguage}>
        <select
          className={selectClass}
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
        >
          {LOCALES.map((l) => (
            <option key={l} value={l}>
              {LOCALE_NAMES[l]}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t.settings.primaryTerm}>
        <select
          className={selectClass}
          value={termPreference.primary}
          onChange={(e) => {
            const primary = e.target.value as TermLanguage;
            const secondary =
              termPreference.secondary === primary
                ? null
                : termPreference.secondary;
            setTermPreference({ primary, secondary });
          }}
        >
          {TERM_LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {t.termLanguages[l]}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t.settings.secondaryTerm}>
        <select
          className={selectClass}
          value={termPreference.secondary ?? NONE}
          onChange={(e) =>
            setTermPreference({
              ...termPreference,
              secondary:
                e.target.value === NONE
                  ? null
                  : (e.target.value as TermLanguage),
            })
          }
        >
          <option value={NONE}>{t.settings.none}</option>
          {TERM_LANGUAGES.filter((l) => l !== termPreference.primary).map(
            (l) => (
              <option key={l} value={l}>
                {t.termLanguages[l]}
              </option>
            ),
          )}
        </select>
      </Field>
    </>
  );
}
