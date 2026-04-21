import { createWorkItem, updateWorkItemStatus } from "@/server/actions/work-items";
import { requireSession } from "@/server/auth/session";
import { listRepositories, listWorkItems } from "@/server/db/queries/context";

export default async function WorkItemsPage() {
  const { workspace } = await requireSession();
  const items = listWorkItems({ workspaceId: workspace.id, includeRepository: true });
  const repositories = listRepositories(workspace.id);

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Work Items</p>
        <h1>横断 WorkItem</h1>
        <p className="support">repositoryId が null の未整理・横断項目も表示します。</p>
      </header>
      <div className="grid-8-4">
        <section className="panel">
          <h2>一覧</h2>
          <div className="card-list">
            {items.map((item) => (
              <article className="item-card" key={item.id}>
                <h3>{item.title}</h3>
                <div className="meta-row">
                  <span className="badge">{item.type}</span>
                  <span className="badge">{item.status}</span>
                  <span className="badge">{item.priority}</span>
                </div>
                <form action={updateWorkItemStatus} className="button-row">
                  <input type="hidden" name="id" value={item.id} />
                  <button className="button button--secondary" name="status" value={item.type === "bug" ? "resolved" : "done"} type="submit">
                    完了扱いにする
                  </button>
                  <button className="button button--tertiary" name="status" value="todo" type="submit">
                    再オープン
                  </button>
                </form>
              </article>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>新規作成</h2>
          <form action={createWorkItem} className="form-stack">
            <div className="field">
              <label htmlFor="repositoryId">Repository<span className="required">※任意</span></label>
              <select id="repositoryId" name="repositoryId" defaultValue="">
                <option value="">未紐づけ</option>
                {repositories.map((repository) => (
                  <option value={repository.id} key={repository.id}>{repository.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="type">種類<span className="required">※必須</span></label>
              <select id="type" name="type" defaultValue="task">
                <option value="task">task</option>
                <option value="bug">bug</option>
                <option value="idea">idea</option>
                <option value="implementation">implementation</option>
                <option value="future_feature">future_feature</option>
                <option value="memo">memo</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="title">タイトル<span className="required">※必須</span></label>
              <input id="title" name="title" />
            </div>
            <div className="field">
              <label htmlFor="body">本文<span className="required">※任意</span></label>
              <textarea id="body" name="body" />
            </div>
            <button className="button" type="submit">保存</button>
          </form>
        </section>
      </div>
    </main>
  );
}
