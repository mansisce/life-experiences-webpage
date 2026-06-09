import { pageLinks, homeNavItems } from "../data";
import { useRenderTracker } from "../hooks/useRenderTracker";

export default function Header({ route }) {
  useRenderTracker("Header");
  const isHome = route === "/";

  return (
    <header className={`site-header ${isHome ? "" : "solid"}`}>
      <a className="brand" href="#/" aria-label="Mansi Gupta home">
        MG
      </a>
      <nav className="nav" aria-label="Primary navigation">
        {pageLinks.map(([label, href]) => (
          <a className={route === href.replace("#", "") ? "active" : ""} key={href} href={href}>
            {label}
          </a>
        ))}
        {isHome &&
          homeNavItems.map(([label, id]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
      </nav>
    </header>
  );
}
