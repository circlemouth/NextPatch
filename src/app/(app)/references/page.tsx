export default async function ReferencesPage() {
  const referenceServices: unknown[] = [];

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">References</p>
        <h1>参考サービス</h1>
      </header>
      <section className="panel">
        {referenceServices.length === 0 ? <p className="support">参考サービスはまだありません。</p> : null}
      </section>
    </main>
  );
}
