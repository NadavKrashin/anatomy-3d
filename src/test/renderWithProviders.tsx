import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { AnatomyDataProvider } from "@/components/providers/AnatomyDataProvider";
import { DEFAULT_TERM_PREFERENCE } from "@/lib/anatomy/names";
import type { Locale } from "@/lib/i18n/locale";
import { useSettingsStore } from "@/store/settingsStore";
import { useViewerStore } from "@/store/viewerStore";

const initialViewerState = useViewerStore.getState();

/** Resets global stores and renders inside the app's data provider. */
export function renderWithProviders(
  ui: ReactElement,
  {
    locale = "en",
    ...options
  }: { locale?: Locale } & Omit<RenderOptions, "wrapper"> = {},
) {
  useViewerStore.setState(initialViewerState, true);
  useSettingsStore.setState({
    locale,
    termPreference: DEFAULT_TERM_PREFERENCE,
  });
  return render(ui, { wrapper: AnatomyDataProvider, ...options });
}
