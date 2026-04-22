import { createWorkItem } from "@/server/actions/work-items";
import { updateRepositoryFocus } from "@/server/actions/repositories";
import { requireLocalContext } from "@/server/auth/session";
import { listRepositorySummaries } from "@/server/db/queries/repositories";
import { listWorkItemsForRepository } from "@/server/db/queries/work-items";
import { getWorkItemStatusActions } from "@/server/domain/status";
import { updateWorkItemStatus } from "@/server/actions/work-items";
import { notFound } from "next/navigation";
import Link from "next/link";

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
        <p className="support">
          {repository.github_full_name || "GitHub 未設定"} · {repository.production_status} · {repository.criticality}
        </p>
        <div className="repository-overview">
          <section className="repository-stat">
            <p className="repository-stat__label">Open items</p>
            <p className="repository-stat__value">{repository.open_item_count}</p>
          </section>
          <section className="repository-stat">
            <p className="repository-stat__label">Memos</p>
            <p className="repository-stat__value">{repository.memo_count}</p>
          </section>
          <section className="repository-stat">
            <p className="repository-stat__label">Latest activity</p>
            <p className="repository-stat__value">{formatDateTime(repository.last_activity_at)}</p>
          </section>
          <section className="repository-stat">
            <p className="repository-stat__label">Current focus</p>
            <p className="repository-stat__value">{repository.current_focus ? "Set" : "Empty"}</p>
          </section>
        </div>
      </header>

      <div className="grid-8-4">
        <section className="panel" aria-labelledby="work-items-heading">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Work items</p>
              <h2 id="work-items-heading">作業</h2>
            </div>
          </div>

          {workItems.length === 0 ? (
            <p className="support">まだ work item はありません。右側のフォームから追加してください。</p>
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
                        <span className="badge">{item.type}</span>
                        <span className="badge">{item.status}</span>
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
            </div>
            <form action={updateRepositoryFocus} className="repository-detail__focus-form">
              <input type="hidden" name="id" value={repository.id} />
              <div className="field">
                <label htmlFor="currentFocus">Focus</label>
                <p className="support">短い文で、今何を進めているかだけ書いてください。</p>
                <textarea id="currentFocus" name="currentFocus" defaultValue={repository.current_focus ?? ""} />
              </div>
              <button className="button button--secondary" type="submit">
                保存
              </button>
            </form>
          </section>

          <section className="panel" aria-labelledby="add-work-item-heading">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Quick write</p>
                <h2 id="add-work-item-heading">追加</h2>
              </div>
            </div>
            <form action={createWorkItem} className="form-stack">
              <input type="hidden" name="repositoryId" value={repository.id} />
              <div className="field">
                <label htmlFor="type">タイプ<span className="required">必須</span></label>
                <select id="type" name="type" defaultValue="memo">
                  <option value="memo">memo</option>
                  <option value="task">task</option>
                  <option value="bug">bug</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="title">タイトル</label>
                <p className="support">未入力なら本文の先頭行を使います。</p>
                <input id="title" name="title" />
              </div>
              <div className="field">
                <label htmlFor="body">本文<span className="required">必須</span></label>
                <textarea id="body" name="body" required />
              </div>
              <div className="field">
                <label htmlFor="priority">優先度</label>
                <select id="priority" name="priority" defaultValue="p2">
                  <option value="p0">p0</option>
                  <option value="p1">p1</option>
                  <option value="p2">p2</option>
                  <option value="p3">p3</option>
                  <option value="p4">p4</option>
                </select>
              </div>
              <button className="button" type="submit">
                追加
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
    return "—";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo"
  }).format(new Date(value));
}
