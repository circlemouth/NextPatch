export default function DataSettingsPage() {
  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Data</p>
        <h1>データ管理</h1>
        <p className="support">
          JSON export は復元可能な正本です。Markdown / CSV は読み取りと棚卸し用に使ってください。
        </p>
      </header>
      <div className="section-stack">
        <section className="banner banner--warning">
          <strong>ローカル継続運用の backup 方針</strong>
          <p>
            SQLite DB ファイルを手動コピーする場合は WAL / SHM ファイルとの整合性に注意してください。
            安全な DB ファイル backup が必要な場合は SQLite Online Backup API または VACUUM INTO 相当を使います。
            初期実装では JSON export を復元用の正本として扱います。
          </p>
        </section>
        <section className="banner banner--warning">
          <strong>機密情報に注意</strong>
          <p>
            export には未公開構想、バグ、ChatGPT貼り付け本文が含まれる可能性があります。
            GitHub token などの credential は DB に保存しない運用を前提にしてください。
          </p>
        </section>
        <section className="panel">
          <h2>Export</h2>
          <div className="button-row">
            <a className="button" href="/api/export/json">JSON export</a>
            <a className="button button--secondary" href="/api/export/markdown">Markdown export</a>
            <a className="button button--secondary" href="/api/export/csv">CSV export</a>
          </div>
        </section>
        <section className="panel">
          <h2>Import / Restore</h2>
          <p>復元は MVP では新規 workspace のみです。既存 workspace へのマージは実装していません。</p>
        </section>
      </div>
    </main>
  );
}
