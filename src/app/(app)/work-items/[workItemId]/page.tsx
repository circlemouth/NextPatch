import { requireLocalContext } from "@/server/auth/session";
import { getWorkItemById } from "@/server/db/queries/work-items";
import { formatWorkItemScope, formatWorkItemStatus, formatWorkItemType } from "@/server/domain/work-item-labels";
import Link from "next/link";
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
        <div className="panel__header">
          <div>
            <p className="eyebrow">メモ・タスク詳細</p>
            <h1>{item.title}</h1>
          </div>
          {item.repository_id ? (
            <Link className="button" href={`/repositories/${item.repository_id}`}>
              リポジトリ詳細へ戻る
            </Link>
          ) : null}
        </div>
        <div className="meta-row">
          <span className="badge">{formatWorkItemType(item.type)}</span>
          <span className="badge">{formatWorkItemStatus(item.status)}</span>
          <span className="badge">{item.priority}</span>
          <span className="badge">{formatWorkItemScope(item.scope)}</span>
        </div>
        {item.repository_id ? <p className="support">リポジトリ: {item.repositories?.name ?? "不明なリポジトリ"}</p> : null}
        {item.body ? <div className="work-item-body">{item.body}</div> : <p className="support">本文はありません。</p>}
      </article>
    </main>
  );
}
