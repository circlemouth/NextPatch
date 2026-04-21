import { classifyMemo } from "@/server/actions/classification";
import { requireLocalContext } from "@/server/auth/session";
import { listRepositories } from "@/server/db/queries/repositories";
import { listMemoWorkItems } from "@/server/db/queries/work-items";

export default async function InboxPage() {
  const { workspace } = await requireLocalContext();
  const [memoItems, repoOptions] = await Promise.all([listMemoWorkItems(workspace.id), listRepositories(workspace.id)]);

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Inbox</p>
        <h1>未整理メモ</h1>
        <p className="support">元メモを破壊せず、分類先の WorkItem を作ります。</p>
      </header>
      <section className="panel">
        {memoItems.length === 0 ? (
          <p className="support">未整理メモはありません。</p>
        ) : (
          <div className="card-list">
            {memoItems.map((memo) => (
              <article className="item-card" key={memo.id}>
                <h2>{memo.title}</h2>
                <div className="meta-row">
                  <span className="badge">{memo.status}</span>
                  <span className="badge">{memo.privacy_level}</span>
                </div>
                {memo.body ? <p>{memo.body.slice(0, 360)}</p> : null}
                <form action={classifyMemo} className="form-stack">
                  <input type="hidden" name="memoId" value={memo.id} />
                  <div className="field">
                    <label htmlFor={`targetType-${memo.id}`}>分類先<span className="required">※必須</span></label>
                    <select id={`targetType-${memo.id}`} name="targetType" defaultValue="task">
                      <option value="task">task</option>
                      <option value="bug">bug</option>
                      <option value="idea">idea</option>
                      <option value="implementation">implementation</option>
                      <option value="future_feature">future_feature</option>
                      <option value="memo">memo</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor={`repo-${memo.id}`}>Repository<span className="required">※任意</span></label>
                    <select id={`repo-${memo.id}`} name="repositoryId" defaultValue="">
                      <option value="">未紐づけ</option>
                      {repoOptions.map((repository) => (
                        <option value={repository.id} key={repository.id}>{repository.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor={`title-${memo.id}`}>タイトル<span className="required">※必須</span></label>
                    <input id={`title-${memo.id}`} name="title" defaultValue={memo.title} />
                  </div>
                  <div className="field">
                    <label htmlFor={`body-${memo.id}`}>本文<span className="required">※任意</span></label>
                    <textarea id={`body-${memo.id}`} name="body" defaultValue={memo.body ?? ""} />
                  </div>
                  <button className="button" type="submit">分類して作成</button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
