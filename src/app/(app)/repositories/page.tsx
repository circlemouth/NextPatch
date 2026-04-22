import { createRepository } from "@/server/actions/repositories";
import { requireLocalContext } from "@/server/auth/session";
import { listRepositorySummaries } from "@/server/db/queries/repositories";
import Link from "next/link";

export default async function RepositoriesPage() {
  const { workspace } = await requireLocalContext();
  const repositories = await listRepositorySummaries(workspace.id);

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Repositories</p>
        <h1>リポジトリ</h1>
        <p className="support">
          NextPatch のホームです。まず対象リポジトリを選び、必要なことをその場で書き込みます。
        </p>
      </header>

      <div className="grid-8-4">
        <section className="panel" aria-labelledby="repository-list-heading">
          <div className="panel__header">
            <h2 id="repository-list-heading">リポジトリ一覧</h2>
          </div>
          {repositories.length === 0 ? (
            <p className="support">まだリポジトリがありません。右側のフォームから追加してください。</p>
          ) : (
            <div className="card-list">
              {repositories.map((repository) => (
                <article className="item-card repository-card" key={repository.id}>
                  <div className="panel__header">
                    <div>
                      <h3>{repository.name}</h3>
                      {repository.github_full_name ? <p className="support">{repository.github_full_name}</p> : null}
                    </div>
                    <Link className="button button--secondary" href={`/repositories/${repository.id}`}>
                      開く
                    </Link>
                  </div>
                  <div className="meta-row">
                    <span className="badge">{repository.production_status}</span>
                    <span className="badge">{repository.criticality}</span>
                  </div>
                  <div className="stat-row" aria-label="Repository summary">
                    <div>
                      <span className="support">未完了件数</span>
                      <strong>{repository.open_item_count}</strong>
                    </div>
                    <div>
                      <span className="support">メモ件数</span>
                      <strong>{repository.memo_count}</strong>
                    </div>
                    <div>
                      <span className="support">最終更新</span>
                      <strong>{formatLastActivity(repository.last_activity_at)}</strong>
                    </div>
                  </div>
                  {repository.current_focus ? <p className="repository-card__focus">{repository.current_focus}</p> : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="repository-form-heading">
          <h2 id="repository-form-heading">追加</h2>
          <form action={createRepository} className="form-stack">
            <div className="field">
              <label htmlFor="name">
                リポジトリ名<span className="required">※必須</span>
              </label>
              <p className="support">一覧で見分けるための名前です。</p>
              <input id="name" name="name" />
            </div>
            <div className="field">
              <label htmlFor="htmlUrl">
                GitHub URL<span className="required">※任意</span>
              </label>
              <p className="support">例: https://github.com/owner/repo</p>
              <input id="htmlUrl" name="htmlUrl" type="url" />
            </div>
            <div className="field">
              <label htmlFor="currentFocus">
                現在の焦点<span className="required">※任意</span>
              </label>
              <p className="support">次に見るべきことを 1 つだけ書きます。</p>
              <textarea id="currentFocus" name="currentFocus" />
            </div>
            <div className="field field--subtle">
              <label htmlFor="productionStatus">
                稼働状態<span className="required">※必須</span>
              </label>
              <select id="productionStatus" name="productionStatus" defaultValue="development">
                <option value="planning">planning</option>
                <option value="development">development</option>
                <option value="active_production">active_production</option>
                <option value="maintenance">maintenance</option>
                <option value="paused">paused</option>
              </select>
            </div>
            <div className="field field--subtle">
              <label htmlFor="criticality">
                重要度<span className="required">※必須</span>
              </label>
              <select id="criticality" name="criticality" defaultValue="medium">
                <option value="high">high</option>
                <option value="medium">medium</option>
                <option value="low">low</option>
              </select>
            </div>
            <button className="button" type="submit">
              保存
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function formatLastActivity(value: string | null) {
  if (!value) {
    return "未更新";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
