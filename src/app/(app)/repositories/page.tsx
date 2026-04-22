import { createRepository } from "@/server/actions/repositories";
import { requireLocalContext } from "@/server/auth/session";
import { listRepositorySummaries } from "@/server/db/queries/repositories";
import Link from "next/link";

export default async function RepositoriesPage() {
  const { workspace } = await requireLocalContext();
  const repositories = await listRepositorySummaries(workspace.id);
  const openTotal = repositories.reduce((sum, repository) => sum + repository.open_item_count, 0);
  const memoTotal = repositories.reduce((sum, repository) => sum + repository.memo_count, 0);
  const latestActivityAt = repositories.reduce<string | null>(
    (latest, repository) => latestIso(latest, repository.last_activity_at),
    null
  );

  return (
    <main className="page repository-detail">
      <header className="page-header repository-detail__header">
        <p className="eyebrow">Repositories</p>
        <h1>リポジトリ</h1>
        <p className="support">NextPatch のホームです。対象リポジトリを選び、必要なメモ・タスクをその場で書き込みます。</p>
        <div className="repository-overview">
          <section className="repository-stat">
            <p className="repository-stat__label">リポジトリ</p>
            <p className="repository-stat__value">{repositories.length}</p>
          </section>
          <section className="repository-stat">
            <p className="repository-stat__label">未完了件数</p>
            <p className="repository-stat__value">{openTotal}</p>
          </section>
          <section className="repository-stat">
            <p className="repository-stat__label">メモ件数</p>
            <p className="repository-stat__value">{memoTotal}</p>
          </section>
          <section className="repository-stat">
            <p className="repository-stat__label">最終更新</p>
            <p className="repository-stat__value">{formatDateTime(latestActivityAt)}</p>
          </section>
        </div>
      </header>

      <div className="grid-8-4">
        <section className="panel" aria-labelledby="repository-list-heading">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Repository cards</p>
              <h2 id="repository-list-heading">リポジトリ一覧</h2>
            </div>
          </div>

          {repositories.length === 0 ? (
            <p className="support">まだリポジトリがありません。右側のフォームから追加してください。</p>
          ) : (
            <div className="card-list">
              {repositories.map((repository) => (
                <article className="item-card repository-card" key={repository.id}>
                  <div className="item-card__header">
                    <div className="item-card__title">
                      <h3>
                        <Link href={`/repositories/${repository.id}`}>{repository.name}</Link>
                      </h3>
                      {repository.github_full_name ? <p className="support">{repository.github_full_name}</p> : null}
                    </div>
                    <div className="meta-row">
                      <span className="badge">{repository.production_status}</span>
                      <span className="badge">{repository.criticality}</span>
                    </div>
                  </div>
                  <div className="repository-detail__item-meta" aria-label="Repository summary">
                    <span className="badge">未完了 {repository.open_item_count}</span>
                    <span className="badge">メモ {repository.memo_count}</span>
                    <span className="badge">更新 {formatDateTime(repository.last_activity_at)}</span>
                  </div>
                  {repository.current_focus ? (
                    <p className="repository-card__focus">{repository.current_focus}</p>
                  ) : (
                    <p className="support">現在の焦点は未設定です。</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="repository-form-heading">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Create repository</p>
              <h2 id="repository-form-heading">リポジトリを追加</h2>
            </div>
          </div>
          <form action={createRepository} className="form-stack">
            <div className="field">
              <label htmlFor="name">
                リポジトリ名<span className="required">※必須</span>
              </label>
              <p className="support">一覧で見分けるための表示名です。</p>
              <input id="name" name="name" />
            </div>
            <div className="field">
              <label htmlFor="htmlUrl">
                GitHub URL<span className="required">※任意</span>
              </label>
              <p className="support">例: https://github.com/owner/repo。Issue/PR URL も owner/repo を抽出します。</p>
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
              <p className="support">通常は development のままで問題ありません。</p>
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
              <p className="support">障害時の影響が大きいものほど high を選びます。</p>
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

function latestIso(current: string | null, next: string | null) {
  if (!current) return next;
  if (!next) return current;
  return current > next ? current : next;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "未更新";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo"
  }).format(new Date(value));
}
