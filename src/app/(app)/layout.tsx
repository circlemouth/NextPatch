import { logoutAction } from "@/server/auth/actions";
import { requireLocalContext } from "@/server/auth/session";
import Link from "next/link";

const navItems = [
  ["Dashboard", "/dashboard"],
  ["Repositories", "/repositories"],
  ["Work Items", "/work-items"],
  ["Inbox", "/inbox"],
  ["Capture", "/capture/new"],
  ["Ideas", "/ideas"],
  ["Tech Notes", "/tech-notes"],
  ["References", "/references"],
  ["Settings", "/settings"]
] as const;

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { workspace } = await requireLocalContext();

  return (
    <div className="app-shell">
      <div className="app-frame">
        <aside className="sidebar" aria-label="Primary navigation">
          <h1 className="sidebar__brand">NextPatch</h1>
          <nav>
            {navItems.map(([label, href]) => (
              <Link className="nav-link" href={href} key={href}>
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="main-area">
          <header className="topbar">
            <div>
              <strong>LAN内運用</strong>
              <p className="support">ログイン中: {workspace.name}</p>
            </div>
            <div className="button-row">
              <Link className="button" href="/capture/new">
                Quick Capture
              </Link>
              <form action={logoutAction}>
                <button className="button button--secondary" type="submit">
                  ログアウト
                </button>
              </form>
            </div>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
