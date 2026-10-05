"use client";

import { Settings2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { useMessages } from "@/hooks/useMessages";
import { LOCALES, type Locale } from "@/lib/i18n/locale";
import { useSettingsStore } from "@/store/settingsStore";
import { TERM_LANGUAGES, type TermLanguage } from "@/types/anatomy";

const LOCALE_NAMES: Record<Locale, string> = { he: "עברית", en: "English" };
const NONE = "none";

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

export function SettingsMenu() {
  const t = useMessages();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { locale, termPreference, setLocale, setTermPreference } =
    useSettingsStore();

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === "Escape"
          : !rootRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        label={t.viewer.settings}
        icon={<Settings2 />}
        active={open}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <div className="sheet absolute end-0 top-12 z-40 flex w-64 flex-col gap-4 p-5 shadow-[var(--shadow-pop)]">
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
        </div>
      )}
    </div>
  );
}
