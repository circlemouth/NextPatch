import { requireLocalContext } from "@/server/auth/session";
import { getWorkItemById } from "@/server/db/queries/work-items";
import { notFound } from "next/navigation";

type WorkItemDetailPageProps = {
  params: Promise<{ workItemId: string }>;
};

export default async function WorkItemDetailPage({ params }: WorkItemDetailPageProps) {
  const { workItemId } = await params;
  const { workspace } = await requireLocalContext();
  const item = await getWorkItemById(workspace.id, workItemId);

  if (!item) {
    notFound();
  }

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
