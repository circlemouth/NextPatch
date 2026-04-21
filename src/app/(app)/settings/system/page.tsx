import fs from "node:fs";
import { getDataDir, getDbPath } from "@/server/db/paths";

export default function SystemSettingsPage() {
  const runtimeMode = process.env.NEXTPATCH_RUNTIME_MODE ?? "local-server";
  const dataDir = getDataDir();
  const dbPath = getDbPath();

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">System</p>
        <h1>システム状態</h1>
        <p className="support">SQLite ローカル運用の保存先と backup 注意点を確認します。</p>
      </header>
      <section className="panel">
        <dl>
          <dt>Runtime</dt>
          <dd>{runtimeMode}</dd>
          <dt>Data dir</dt>
          <dd>{dataDir}</dd>
          <dt>DB path</dt>
          <dd>{dbPath}</dd>
          <dt>DB file</dt>
          <dd>{fs.existsSync(dbPath) ? "作成済み" : "未作成"}</dd>
        </dl>
      </section>
      <section className="banner banner--warning">
        <strong>DB ファイル backup</strong>
        <p>
          WAL mode では DB ファイル単体の手動コピーだけでは整合しない可能性があります。
          JSON export を復元用の正本にし、DB ファイルを保全する場合は SQLite Online Backup API または VACUUM INTO 相当を使います。
        </p>
      </section>
    </main>
  );
}
