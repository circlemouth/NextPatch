import { createWorkItem, updateWorkItemStatus } from "@/server/actions/work-items";
import { updateRepositoryFocus } from "@/server/actions/repositories";
import { requireLocalContext } from "@/server/auth/session";
import { getRepositoryById } from "@/server/db/queries/repositories";
import { listWorkItemsForRepository } from "@/server/db/queries/work-items";
import { getWorkItemStatusActions } from "@/server/domain/status";
import Link from "next/link";
import { notFound } from "next/navigation";

type RepositoryDetailPageProps = {
  params: Promise<{ repositoryId: string }>;
};

export default async function RepositoryDetailPage({ params }: RepositoryDetailPageProps) {
  const { repositoryId } = await params;
  const { workspace } = await requireLocalContext();
  const [repo, workItems] = await Promise.all([
    getRepositoryById(workspace.id, repositoryId),
    listWorkItemsForRepository(workspace.id, repositoryId)
  ]);

  if (!repo) {
    notFound();
  }

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Repository</p>
        <h1>{repo.name}</h1>
        <div className="meta-row">
          {repo.github_full_name ? <span className="badge">{repo.github_full_name}</span> : null}
          <span className="badge">{repo.production_status}</span>
          <span className="badge">{repo.criticality}</span>
        </div>
      </header>

      <div className="section-stack">
        <section className="panel">
          <div className="panel__header">
            <h2>現在の焦点</h2>
            <Link className="button button--secondary" href="/repositories">
              一覧へ戻る
            </Link>
          </div>
          <form action={updateRepositoryFocus} className="form-stack">
            <input type="hidden" name="id" value={repositoryId} />
            <div className="field">
              <label htmlFor="currentFocus">
                現在の焦点<span className="required">※任意</span>
              </label>
              <p className="support">今の優先課題を短く書きます。</p>
              <textarea id="currentFocus" name="currentFocus" defaultValue={repo.current_focus ?? ""} />
            </div>
            <button className="button" type="submit">
              保存
            </button>
          </form>
        </section>

        <section className="grid-8-4">
          <section className="panel">
            <div className="panel__header">
              <h2>メモ・タスク</h2>
              <span className="support">{workItems.length} 件</span>
            </div>
            <div className="card-list">
              {workItems.map((item) => {
                const statusActions = getWorkItemStatusActions(item);

                return (
                  <article className="item-card" key={item.id}>
                    <h3>{item.title}</h3>
                    <div className="meta-row">
                      <span className="badge">{item.type}</span>
                      <span className="badge">{item.status}</span>
                      <span className="badge">{item.priority}</span>
                    </div>
                    {item.body ? <p>{item.body}</p> : null}
                    {statusActions.length > 0 ? (
                      <form action={updateWorkItemStatus} className="button-row">
                        <input type="hidden" name="id" value={item.id} />
                        {statusActions.map((action) => (
                          <button
                            className={`button button--${action.style}`}
                            key={action.status}
                            name="status"
                            value={action.status}
                            type="submit"
                          >
                            {action.label}
                          </button>
                        ))}
                      </form>
                    ) : (
                      <p className="support">この状態で実行できる状態変更はありません。</p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h2>すぐ書く</h2>
            <form action={createWorkItem} className="form-stack">
              <input type="hidden" name="repositoryId" value={repositoryId} />
              <div className="field">
                <label htmlFor="quickType">
                  種類<span className="required">※必須</span>
                </label>
                <p className="support">メモ / タスク / バグ から選びます。</p>
                <select id="quickType" name="type" defaultValue="memo">
                  <option value="memo">memo</option>
                  <option value="task">task</option>
                  <option value="bug">bug</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="quickBody">
                  内容<span className="required">※必須</span>
                </label>
                <p className="support">まず本文を書き、必要なら下のタイトルを補います。</p>
                <textarea id="quickBody" name="body" required />
              </div>
              <div className="field">
                <label htmlFor="quickTitle">
                  タイトル<span className="required">※任意</span>
                </label>
                <p className="support">未入力なら内容の先頭行から作ります。</p>
                <input id="quickTitle" name="title" />
              </div>
              <div className="field field--subtle">
                <label htmlFor="priority">
                  優先度<span className="required">※必須</span>
                </label>
                <select id="priority" name="priority" defaultValue="p2">
                  <option value="p0">p0</option>
                  <option value="p1">p1</option>
                  <option value="p2">p2</option>
                  <option value="p3">p3</option>
                  <option value="p4">p4</option>
                </select>
              </div>
              <button className="button" type="submit">
                保存
              </button>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}
