import { logoutAction } from "@/server/auth/actions";
import { requireLocalContextForPage } from "@/server/auth/session";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { workspace } = await requireLocalContextForPage();

  return (
    <div className="app-shell">
      <div className="app-frame">
        <div className="main-area">
          <header className="topbar">
            <div className="topbar__brand-group">
              <Link className="topbar__brand" href="/repositories">
                NextPatch
              </Link>
              <p className="support topbar__workspace">Workspace: {workspace.name}</p>
            </div>

            <details className="topbar-menu">
              <summary className="button button--secondary topbar-menu__summary">Menu</summary>
              <div className="topbar-menu__panel">
                <Link className="topbar-menu__link" href="/settings">
                  Settings
                </Link>
                <Link className="topbar-menu__link" href="/settings/data">
                  Data
                </Link>
                <Link className="topbar-menu__link" href="/settings/system">
                  System
                </Link>
                <form action={logoutAction} className="topbar-menu__form">
                  <button className="topbar-menu__link topbar-menu__button" type="submit">
                    Log out
                  </button>
                </form>
              </div>
            </details>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
