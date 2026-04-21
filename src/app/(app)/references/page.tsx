import { requireSession } from "@/server/auth/session";
import { listReferenceServices } from "@/server/db/queries/context";

export default async function ReferencesPage() {
  const { workspace } = await requireSession();
  const references = listReferenceServices(workspace.id);

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">References</p>
        <h1>参考サービス</h1>
      </header>
      <section className="panel">
        {references.length === 0 ? <p className="support">参考サービスはまだありません。</p> : null}
      </section>
    </main>
  );
}
