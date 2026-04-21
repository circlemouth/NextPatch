import { requireLocalContext } from "@/server/auth/session";
import { listReferenceServices } from "@/server/db/queries/auxiliary";

export default async function ReferencesPage() {
  const { workspace } = await requireLocalContext();
  const services = await listReferenceServices(workspace.id);

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">References</p>
        <h1>参考サービス</h1>
      </header>
      <section className="panel">
        {services.length === 0 ? (
          <p className="support">参考サービスはまだありません。</p>
        ) : (
          <div className="card-list">
            {services.map((service) => (
              <article className="item-card" key={service.id}>
                <h2>{service.name}</h2>
                {service.reference_point ? <p>{service.reference_point}</p> : null}
                {service.url ? <a href={service.url}>{service.url}</a> : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
