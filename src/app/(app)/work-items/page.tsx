import { createWorkItem, updateWorkItemStatus } from "@/server/actions/work-items";
import { requireLocalContext } from "@/server/auth/session";
import { listRepositories } from "@/server/db/queries/repositories";
import { listWorkItems } from "@/server/db/queries/work-items";
import { getWorkItemStatusActions } from "@/server/domain/status";

export default async function WorkItemsPage() {
  const { workspace } = await requireLocalContext();
  const [items, repositories] = await Promise.all([listWorkItems(workspace.id), listRepositories(workspace.id)]);

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Work Items</p>
        <h1>横断 WorkItem</h1>
        <p className="support">リポジトリ未紐づけのメモや横断項目もローカル DB から表示します。</p>
      </header>
      <div className="grid-8-4">
        <section className="panel">
          <h2>一覧</h2>
          <div className="card-list">
            {items.map((item) => {
              const statusActions = getWorkItemStatusActions(item);

              return (
                <article className="item-card" key={item.id}>
                  <h3>{item.title}</h3>
                  <div className="meta-row">
                    <span className="badge">{item.type}</span>
                    <span className="badge">{item.status}</span>
                    <span className="badge">{item.priority}</span>
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
                    <p className="support">この状態で実行できる状態変更はありません。</p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
        <section className="panel">
          <h2>新規作成</h2>
          <form action={createWorkItem} className="form-stack">
            <div className="field">
              <label htmlFor="repositoryId">
                Repository<span className="required">※任意</span>
              </label>
              <p className="support">特定のリポジトリに紐づく作業だけ選択します。</p>
              <select id="repositoryId" name="repositoryId" defaultValue="">
                <option value="">未紐づけ</option>
                {repositories.map((repository) => (
                  <option value={repository.id} key={repository.id}>{repository.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="type">
                種類<span className="required">※必須</span>
              </label>
              <p className="support">迷う場合は task を選びます。</p>
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
              <label htmlFor="title">
                タイトル<span className="required">※必須</span>
              </label>
              <p className="support">一覧で判断できる短い名前にします。</p>
              <input id="title" name="title" />
            </div>
            <div className="field">
              <label htmlFor="body">
                本文<span className="required">※任意</span>
              </label>
              <p className="support">背景、判断理由、次にやることを必要な分だけ書きます。</p>
              <textarea id="body" name="body" />
            </div>
            <button className="button" type="submit">保存</button>
          </form>
        </section>
      </div>
    </main>
  );
}
