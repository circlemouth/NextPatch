import { requireLocalContext } from "@/server/auth/session";
import { listReferenceServices } from "@/server/db/queries/misc";

export default async function ReferencesPage() {
  const { workspace } = await requireLocalContext();
  const data = await listReferenceServices(workspace.id);

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">References</p>
        <h1>参考サービス</h1>
      </header>
      <section className="panel">
        {data.length === 0 ? <p className="support">参考サービスはまだありません。</p> : null}
      </section>
    </main>
  );
}
