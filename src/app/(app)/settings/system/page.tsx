export default function SystemSettingsPage() {
  const runtimeMode = process.env.NEXTPATCH_RUNTIME_MODE ?? "local-server";
  const dataDir = process.env.NEXTPATCH_DATA_DIR ?? "./data";
  const dbPath = process.env.NEXTPATCH_DB_PATH ?? "./data/nextpatch.sqlite";
  const exportDir = process.env.NEXTPATCH_EXPORT_DIR ?? "./data/exports";

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
          <dt>Data directory</dt>
          <dd>{dataDir}</dd>
          <dt>SQLite database</dt>
          <dd>{dbPath}</dd>
          <dt>Export directory</dt>
          <dd>{exportDir}</dd>
          <dt>SQLite WAL files</dt>
          <dd>DB path と同じディレクトリに生成されます。</dd>
        </dl>
      </section>
    </main>
  );
}
