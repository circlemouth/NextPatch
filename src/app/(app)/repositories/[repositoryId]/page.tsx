import { createWorkItem, updateWorkItemStatus } from "@/server/actions/work-items";
import { requireSession } from "@/server/auth/session";
import { getRepository, listWorkItems } from "@/server/db/queries/context";

type RepositoryDetailPageProps = {
  params: Promise<{ repositoryId: string }>;
};

export default async function RepositoryDetailPage({ params }: RepositoryDetailPageProps) {
  const { repositoryId } = await params;
  const { workspace } = await requireSession();
  const repo = getRepository(workspace.id, repositoryId);
  const workItems = listWorkItems({ workspaceId: workspace.id, repositoryId });

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Repository</p>
        <h1>{repo.name}</h1>
        <div className="meta-row">
          <span className="badge">{repo.production_status}</span>
          <span className="badge">{repo.criticality}</span>
          {repo.github_full_name ? <span className="badge">{repo.github_full_name}</span> : null}
        </div>
      </header>
      <div className="grid-8-4">
        <section className="panel">
          <h2>次アクションと項目</h2>
          <div className="card-list">
            {workItems.map((item) => (
              <article className="item-card" key={item.id}>
                <h3>{item.title}</h3>
                <div className="meta-row">
                  <span className="badge">{item.type}</span>
                  <span className="badge">{item.status}</span>
                  <span className="badge">{item.priority}</span>
                </div>
                {item.body ? <p>{item.body}</p> : null}
                <form action={updateWorkItemStatus} className="button-row">
                  <input type="hidden" name="id" value={item.id} />
                  <button className="button button--secondary" name="status" value={item.type === "bug" ? "fixed_waiting" : "done"} type="submit">
                    {item.type === "bug" ? "修正済み・確認待ち" : "完了"}
                  </button>
                </form>
              </article>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>WorkItem 追加</h2>
          <form action={createWorkItem} className="form-stack">
            <input type="hidden" name="repositoryId" value={repositoryId} />
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
