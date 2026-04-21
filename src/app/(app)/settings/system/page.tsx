import { getDataDir, getDatabasePath, getExportDir } from "@/server/db/paths";

export default function SystemSettingsPage() {
  const runtimeMode = process.env.NEXTPATCH_RUNTIME_MODE ?? "development";

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">System</p>
        <h1>システム状態</h1>
        <p className="support">ローカル SQLite 運用の保存先を確認します。機密値は表示しません。</p>
      </header>
      <section className="panel">
        <dl>
          <dt>Runtime</dt>
          <dd>{runtimeMode}</dd>
          <dt>Data dir</dt>
          <dd>{getDataDir()}</dd>
          <dt>SQLite DB</dt>
          <dd>{getDatabasePath()}</dd>
          <dt>Export dir</dt>
          <dd>{getExportDir()}</dd>
        </dl>
      </section>
    </main>
  );
}
