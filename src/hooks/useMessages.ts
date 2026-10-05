import { getMessages, type Messages } from "@/lib/i18n/locale";
import { useSettingsStore } from "@/store/settingsStore";

export function useMessages(): Messages {
  return getMessages(useSettingsStore((s) => s.locale));
}
