export default async function TechNotesPage() {
  const techNotes: unknown[] = [];

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Tech Notes</p>
        <h1>技術メモ</h1>
      </header>
      <section className="panel">
        {techNotes.length === 0 ? <p className="support">技術メモはまだありません。</p> : null}
      </section>
    </main>
  );
}
