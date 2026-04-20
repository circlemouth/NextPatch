import { requireSession } from "@/server/auth/session";
import type { WorkItemRow } from "@/server/types";

type WorkItemDetailPageProps = {
  params: Promise<{ workItemId: string }>;
};

export default async function WorkItemDetailPage({ params }: WorkItemDetailPageProps) {
  const { workItemId } = await params;
  const { supabase, workspace } = await requireSession();
  const { data, error } = await supabase
    .from("work_items")
    .select("*, repositories(name)")
    .eq("workspace_id", workspace.id)
    .eq("id", workItemId)
    .single();

  if (error) throw error;
  const item = data as WorkItemRow;

  return (
    <main className="page">
      <article className="panel">
        <p className="eyebrow">{item.type}</p>
        <h1>{item.title}</h1>
        <div className="meta-row">
          <span className="badge">{item.status}</span>
          <span className="badge">{item.priority}</span>
          <span className="badge">{item.scope}</span>
        </div>
        {item.body ? <p>{item.body}</p> : <p className="support">本文はありません。</p>}
      </article>
    </main>
  );
}
