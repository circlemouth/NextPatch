import { requireLocalContext } from "@/server/auth/session";
import { listTechNotes } from "@/server/db/queries/auxiliary";

export default async function TechNotesPage() {
  const { workspace } = await requireLocalContext();
  const notes = await listTechNotes(workspace.id);

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Tech Notes</p>
        <h1>技術メモ</h1>
      </header>
      <section className="panel">
        {notes.length === 0 ? (
          <p className="support">技術メモはまだありません。</p>
        ) : (
          <div className="card-list">
            {notes.map((note) => (
              <article className="item-card" key={note.id}>
                <h2>{note.name}</h2>
                <div className="meta-row">
                  <span className="badge">{note.adoption_status}</span>
                  {note.category ? <span className="badge">{note.category}</span> : null}
                </div>
                {note.reason ? <p>{note.reason}</p> : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
