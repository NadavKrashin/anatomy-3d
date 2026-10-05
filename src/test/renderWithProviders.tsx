import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { AnatomyDataProvider } from "@/components/providers/AnatomyDataProvider";
import { demoDataset } from "@/data/anatomy/demo";
import { DEFAULT_TERM_PREFERENCE } from "@/lib/anatomy/names";
import type { Locale } from "@/lib/i18n/locale";
import type { AnatomyDataset } from "@/types/anatomy";
import { useSettingsStore } from "@/store/settingsStore";
import { useViewerStore } from "@/store/viewerStore";

const initialViewerState = useViewerStore.getState();

/** Resets global stores and renders inside the app's data provider. */
export function renderWithProviders(
  ui: ReactElement,
  {
    locale = "en",
    dataset = demoDataset,
    ...options
  }: { locale?: Locale; dataset?: AnatomyDataset } & Omit<
    RenderOptions,
    "wrapper"
  > = {},
) {
  useViewerStore.setState(initialViewerState, true);
  useSettingsStore.setState({
    locale,
    termPreference: DEFAULT_TERM_PREFERENCE,
  });
  return render(ui, {
    // Tests use the small, stable demo dataset unless they need real data.
    wrapper: ({ children }) => (
      <AnatomyDataProvider dataset={dataset}>{children}</AnatomyDataProvider>
    ),
    ...options,
  });
}
