import { Logo } from "./Logo";
import { MainNav } from "./MainNav";
import { NavMenu } from "./NavMenu";
import { SettingsMenu } from "./SettingsMenu";

/** Top strip for regular (non-viewer) pages. */
export function PageHeader() {
  return (
    <header className="flex items-center gap-8 py-5">
      <Logo />
      <MainNav className="max-md:hidden" />
      <div className="ms-auto flex items-center gap-1">
        <NavMenu className="md:hidden" />
        <SettingsMenu />
      </div>
    </header>
  );
}
