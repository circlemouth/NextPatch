import { createRepository } from "@/server/actions/repositories";
import { requireSession } from "@/server/auth/session";
import { listRepositories } from "@/server/db/queries/context";
import Link from "next/link";

export default async function RepositoriesPage() {
  const { workspace } = await requireSession();
  const repositories = listRepositories(workspace.id);

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Repositories</p>
        <h1>リポジトリ</h1>
        <p className="support">GitHub API は呼ばず、URL 解析で owner/repo を保存します。</p>
      </header>
      <div className="grid-8-4">
        <section className="panel" aria-labelledby="repository-list-heading">
          <h2 id="repository-list-heading">一覧</h2>
          {repositories.length === 0 ? (
            <p className="support">まだリポジトリがありません。まずリポジトリを追加してください。</p>
          ) : (
            <div className="card-list">
              {repositories.map((repository) => (
                <article className="item-card" key={repository.id}>
                  <h3>
                    <Link href={`/repositories/${repository.id}`}>{repository.name}</Link>
                  </h3>
                  <div className="meta-row">
                    <span className="badge">{repository.production_status}</span>
                    <span className="badge">{repository.criticality}</span>
                    {repository.github_full_name ? <span className="badge">{repository.github_full_name}</span> : null}
                  </div>
                  {repository.current_focus ? <p>{repository.current_focus}</p> : null}
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
              <p className="support">表示用の名前です。GitHub URL からの自動同期は行いません。</p>
              <input id="name" name="name" />
            </div>
            <div className="field">
              <label htmlFor="htmlUrl">GitHub URL<span className="required">※任意</span></label>
              <p className="support">例: https://github.com/owner/repo。Issue/PR URL も owner/repo を抽出します。</p>
              <input id="htmlUrl" name="htmlUrl" type="url" />
            </div>
            <div className="field">
              <label htmlFor="productionStatus">稼働状態<span className="required">※必須</span></label>
              <select id="productionStatus" name="productionStatus" defaultValue="development">
                <option value="planning">planning</option>
                <option value="development">development</option>
                <option value="active_production">active_production</option>
                <option value="maintenance">maintenance</option>
                <option value="paused">paused</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="criticality">重要度<span className="required">※必須</span></label>
              <select id="criticality" name="criticality" defaultValue="medium">
                <option value="high">high</option>
                <option value="medium">medium</option>
                <option value="low">low</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="currentFocus">現在の焦点<span className="required">※任意</span></label>
              <textarea id="currentFocus" name="currentFocus" />
            </div>
            <button className="button" type="submit">保存</button>
          </form>
        </section>
      </div>
    </main>
  );
}
