import { requireSession } from "@/server/auth/session";
import type { WorkItemRow } from "@/server/types";

export default async function IdeasPage() {
  const { supabase, workspace } = await requireSession();
  const { data, error } = await supabase
    .from("work_items")
    .select("*")
    .eq("workspace_id", workspace.id)
    .in("type", ["idea", "future_feature", "implementation"])
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Ideas</p>
        <h1>アイデアと将来構想</h1>
      </header>
      <section className="panel">
        <div className="card-list">
          {((data ?? []) as WorkItemRow[]).map((item) => (
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
