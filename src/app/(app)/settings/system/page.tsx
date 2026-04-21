import { getRuntimeInfo } from "@/server/db/paths";

export default function SystemSettingsPage() {
  const runtime = getRuntimeInfo();

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">System</p>
        <h1>システム状態</h1>
        <p className="support">ローカル単一ユーザー運用の保存先と公開範囲の注意を確認します。</p>
      </header>
      <div className="section-stack">
        <section className="panel" aria-labelledby="runtime-heading">
          <h2 id="runtime-heading">Runtime</h2>
          <dl>
            <dt>Runtime</dt>
            <dd>{runtime.runtime}</dd>
            <dt>Data dir</dt>
            <dd>{runtime.dataDir}</dd>
            <dt>DB path</dt>
            <dd>{runtime.dbPath}</dd>
            <dt>Export dir</dt>
            <dd>{runtime.exportDir}</dd>
            <dt>DB file exists</dt>
            <dd>{runtime.dbFileExists ? "はい" : "いいえ"}</dd>
          </dl>
        </section>
        <section className="banner banner--warning" aria-labelledby="wal-heading">
          <h2 id="wal-heading">WAL mode 注意</h2>
          <p>
            SQLite は WAL mode で動作します。DB ファイルだけをコピーすると最新状態が欠ける場合があります。
            正本バックアップには Settings から JSON export を取得してください。
          </p>
        </section>
        <section className="banner banner--warning" aria-labelledby="lan-heading">
          <h2 id="lan-heading">LAN 公開時の注意</h2>
          <p>
            初期実装は無認証の local single-user 前提で、access control は未実装です。
            信頼できる端末だけが届く localhost または信頼済み LAN で使い、公開ネットワークへ直接出さないでください。
          </p>
        </section>
      </div>
    </main>
  );
}
