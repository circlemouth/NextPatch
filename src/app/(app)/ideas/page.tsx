import { requireSession } from "@/server/auth/session";
import { listWorkItems } from "@/server/db/queries/context";

export default async function IdeasPage() {
  const { workspace } = await requireSession();
  const items = listWorkItems({ workspaceId: workspace.id, types: ["idea", "future_feature", "implementation"] });

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Ideas</p>
        <h1>アイデアと将来構想</h1>
      </header>
      <section className="panel">
        <div className="card-list">
          {items.map((item) => (
            <article className="item-card" key={item.id}>
              <h2>{item.title}</h2>
              <div className="meta-row">
                <span className="badge">{item.type}</span>
                <span className="badge">{item.status}</span>
              </div>
              {item.body ? <p>{item.body}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
