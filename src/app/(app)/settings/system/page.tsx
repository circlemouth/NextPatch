export default function SystemSettingsPage() {
  const runtimeMode = process.env.NEXTPATCH_RUNTIME_MODE ?? "development";
  const databasePath = process.env.NEXTPATCH_DB_PATH ?? "./.data/nextpatch.sqlite";
  const exportDir = process.env.NEXTPATCH_EXPORT_DIR ?? "./exports";

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">System</p>
        <h1>システム状態</h1>
        <p className="support">機密値は表示しません。設定の有無だけを確認します。</p>
      </header>
      <section className="panel">
        <dl>
          <dt>Runtime</dt>
          <dd>{runtimeMode}</dd>
          <dt>SQLite database</dt>
          <dd>{databasePath}</dd>
          <dt>Export directory</dt>
          <dd>{exportDir}</dd>
        </dl>
      </section>
    </main>
  );
}
