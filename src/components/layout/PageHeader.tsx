import { Logo } from "./Logo";
import { MainNav } from "./MainNav";
import { SettingsMenu } from "./SettingsMenu";

/** Top bar for regular (non-viewer) pages. */
export function PageHeader() {
  return (
    <header className="flex items-center justify-between gap-4 py-4">
      <Logo />
      <div className="flex items-center gap-2">
        <MainNav className="max-md:hidden" />
        <SettingsMenu />
      </div>
    </header>
  );
}
