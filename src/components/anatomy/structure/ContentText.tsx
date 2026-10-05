import { localizeText } from "@/lib/i18n/localizeText";
import { useSettingsStore } from "@/store/settingsStore";
import type { LocalizedText } from "@/types/anatomy";

/** A piece of educational prose in the best available language, with correct direction. */
export function ContentText({
  text,
  as: Tag = "span",
}: {
  text: LocalizedText;
  as?: "span" | "p";
}) {
  const locale = useSettingsStore((s) => s.locale);
  const value = localizeText(text, locale);
  return (
    <Tag lang={value.language} dir={value.dir} className="block">
      {value.text}
    </Tag>
  );
}
