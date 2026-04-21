import Link from "next/link";

export default function SettingsPage() {
  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Settings</p>
        <h1>設定</h1>
      </header>
      <div className="section-stack">
        <section className="panel">
          <h2>データ管理</h2>
          <p>JSON export は復元可能な正本バックアップです。</p>
          <Link className="button" href="/settings/data">
            データ管理を開く
          </Link>
        </section>
        <section className="panel">
          <h2>システム状態</h2>
          <p>runtime、SQLite DB path、WAL backup 注意を確認します。</p>
          <Link className="button button--secondary" href="/settings/system">
            システム状態を開く
          </Link>
        </section>
      </div>
    </main>
  );
}
