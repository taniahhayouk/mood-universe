import type { AppPage } from "../types";
import { SoundToggle } from "./SoundToggle";

interface NavBarProps {
  page: AppPage;
  soundOn: boolean;
  onToggleSound: () => void;
}

const LINKS: readonly { page: AppPage; href: string; label: string }[] = [
  { page: "home", href: "#/", label: "Home" },
  { page: "journal", href: "#/journal", label: "Journal" },
  { page: "galaxy", href: "#/galaxy", label: "Galaxy" },
];

export function NavBar({ page, soundOn, onToggleSound }: NavBarProps) {
  return (
    <header className="topbar">
      <a className="brand" href="#/">
        Mood Universe
      </a>
      <nav className="nav-links" aria-label="Primary">
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} aria-current={page === link.page ? "page" : undefined}>
            {link.label}
          </a>
        ))}
      </nav>
      <SoundToggle on={soundOn} onToggle={onToggleSound} />
    </header>
  );
}
