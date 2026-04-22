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
              <p className="support topbar__workspace">ログイン中: {workspace.name}</p>
            </div>

            <details className="topbar-menu">
              <summary className="button button--secondary topbar-menu__summary">設定メニュー</summary>
              <div className="topbar-menu__panel" role="menu" aria-label="設定メニュー">
                <Link className="topbar-menu__link" href="/settings" role="menuitem">
                  設定
                </Link>
                <Link className="topbar-menu__link" href="/settings/data" role="menuitem">
                  データ管理
                </Link>
                <Link className="topbar-menu__link" href="/settings/system" role="menuitem">
                  システム状態
                </Link>
                <form action={logoutAction} className="topbar-menu__form">
                  <button className="topbar-menu__link topbar-menu__button" type="submit">
                    ログアウト
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
