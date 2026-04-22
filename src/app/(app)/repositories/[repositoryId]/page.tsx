import { updateRepositoryFocus } from "@/server/actions/repositories";
import { createWorkItem, updateWorkItemStatus } from "@/server/actions/work-items";
import { requireLocalContext } from "@/server/auth/session";
import { listRepositorySummaries } from "@/server/db/queries/repositories";
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
  const [repositories, workItems] = await Promise.all([
    listRepositorySummaries(workspace.id),
    listWorkItemsForRepository(workspace.id, repositoryId)
  ]);
  const repository = repositories.find((entry) => entry.id === repositoryId);

  if (!repository) {
    notFound();
  }

  return (
    <main className="page repository-detail">
      <header className="page-header repository-detail__header">
        <p className="eyebrow">Repository</p>
        <h1>{repository.name}</h1>
        <div className="meta-row">
          {repository.github_full_name ? <span className="badge">{repository.github_full_name}</span> : null}
          <span className="badge">{repository.production_status}</span>
          <span className="badge">{repository.criticality}</span>
        </div>
        <div className="repository-overview">
          <section className="repository-stat">
            <p className="repository-stat__label">未完了件数</p>
            <p className="repository-stat__value">{repository.open_item_count}</p>
          </section>
          <section className="repository-stat">
            <p className="repository-stat__label">メモ件数</p>
            <p className="repository-stat__value">{repository.memo_count}</p>
          </section>
          <section className="repository-stat">
            <p className="repository-stat__label">最終更新</p>
            <p className="repository-stat__value">{formatDateTime(repository.last_activity_at)}</p>
          </section>
          <section className="repository-stat">
            <p className="repository-stat__label">現在の焦点</p>
            <p className="repository-stat__value">{repository.current_focus ? "設定済み" : "未設定"}</p>
          </section>
        </div>
      </header>

      <div className="grid-8-4">
        <section className="panel" aria-labelledby="memo-task-heading">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Notes and tasks</p>
              <h2 id="memo-task-heading">メモ・タスク</h2>
            </div>
            <span className="support">{workItems.length} 件</span>
          </div>

          {workItems.length === 0 ? (
            <p className="support">まだメモ・タスクはありません。右側の「すぐ書く」から追加してください。</p>
          ) : (
            <div className="card-list repository-detail__items">
              {workItems.map((item) => {
                const statusActions = getWorkItemStatusActions(item);

                return (
                  <article className="item-card" key={item.id}>
                    <div className="item-card__header">
                      <div className="item-card__title">
                        <h3>
                          <Link href={`/work-items/${item.id}`}>{item.title}</Link>
                        </h3>
                        {item.body ? <p className="support">{item.body.slice(0, 240)}</p> : null}
                      </div>
                      <div className="meta-row">
                        <span className="badge">{formatType(item.type)}</span>
                        <span className="badge">{formatStatus(item.status)}</span>
                        <span className="badge">{item.priority}</span>
                      </div>
                    </div>

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
                      <p className="support">この状態では即時変更できるアクションがありません。</p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="section-stack">
          <section className="panel repository-detail__focus" aria-labelledby="focus-heading">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Focus</p>
                <h2 id="focus-heading">現在の焦点</h2>
              </div>
              <Link className="button button--secondary" href="/repositories">
                一覧へ戻る
              </Link>
            </div>
            <form action={updateRepositoryFocus} className="form-stack">
              <input type="hidden" name="id" value={repository.id} />
              <div className="field">
                <label htmlFor="currentFocus">
                  現在の焦点<span className="required">※任意</span>
                </label>
                <p className="support">今の優先課題を短く書きます。</p>
                <textarea id="currentFocus" name="currentFocus" defaultValue={repository.current_focus ?? ""} />
              </div>
              <button className="button button--secondary" type="submit">
                保存
              </button>
            </form>
          </section>

          <section className="panel" aria-labelledby="quick-write-heading">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Quick write</p>
                <h2 id="quick-write-heading">すぐ書く</h2>
              </div>
            </div>
            <form action={createWorkItem} className="form-stack">
              <input type="hidden" name="repositoryId" value={repository.id} />
              <div className="field">
                <label htmlFor="quickType">
                  種類<span className="required">※必須</span>
                </label>
                <p className="support">メモ / タスク / バグ から選びます。</p>
                <select id="quickType" name="type" defaultValue="memo">
                  <option value="memo">メモ</option>
                  <option value="task">タスク</option>
                  <option value="bug">バグ</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="quickBody">
                  内容<span className="required">※必須</span>
                </label>
                <p className="support">まず内容を書きます。タイトル未入力なら内容の先頭行から作ります。</p>
                <textarea id="quickBody" name="body" required />
              </div>
              <div className="field">
                <label htmlFor="quickTitle">
                  タイトル<span className="required">※任意</span>
                </label>
                <p className="support">一覧で短く見分けたい場合だけ入力します。</p>
                <input id="quickTitle" name="title" />
              </div>
              <div className="field field--subtle">
                <label htmlFor="priority">
                  優先度<span className="required">※必須</span>
                </label>
                <p className="support">通常は p2 のままで問題ありません。</p>
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
        </div>
      </div>
    </main>
  );
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

function formatType(type: string) {
  const labels: Record<string, string> = {
    memo: "メモ",
    task: "タスク",
    bug: "バグ",
    idea: "アイデア",
    implementation: "実装メモ",
    future_feature: "将来機能"
  };

  return labels[type] ?? type;
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    unreviewed: "未確認",
    todo: "未着手",
    doing: "進行中",
    done: "完了",
    unconfirmed: "未確認",
    confirmed: "確認済み",
    fixed_waiting: "修正済み",
    resolved: "解決済み",
    itemized: "項目化済み"
  };

  return labels[status] ?? status;
}
