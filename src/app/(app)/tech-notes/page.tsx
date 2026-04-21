import { requireSession } from "@/server/auth/session";
import { listTechNotes } from "@/server/db/queries/context";

export default async function TechNotesPage() {
  const { workspace } = await requireSession();
  const techNoteRows = listTechNotes(workspace.id);

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Tech Notes</p>
        <h1>技術メモ</h1>
      </header>
      <section className="panel">
        {techNoteRows.length === 0 ? <p className="support">技術メモはまだありません。</p> : null}
      </section>
    </main>
  );
}
