import { getDashboard } from "@/server/domain/dashboard";
import Link from "next/link";

export default async function DashboardPage() {
  const dashboard = await getDashboard();

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Dashboard</p>
        <h1>今やるべきこと</h1>
        <p className="support">固定表示、重大バグ、期限、未整理状態から説明可能な理由で並べます。</p>
      </header>

      <div className="grid-8-4">
        <div className="section-stack">
          <section className="panel" aria-labelledby="now-heading">
            <div className="panel__header">
              <h2 id="now-heading">Now</h2>
              <Link className="button button--secondary" href="/capture/new">
                登録する
              </Link>
            </div>
            <ItemList items={dashboard.now} empty="まだ着手候補はありません。" />
          </section>

          <section className="panel" aria-labelledby="bugs-heading">
            <h2 id="bugs-heading">実稼働中リポジトリの重大バグ</h2>
            <ItemList items={dashboard.criticalBugs} empty="重大バグはありません。" />
          </section>

          <section className="panel" aria-labelledby="inbox-heading">
            <h2 id="inbox-heading">未整理メモ</h2>
            <ItemList items={dashboard.inbox} empty="未整理メモはありません。" />
          </section>
        </div>

        <aside className="section-stack" aria-label="Dashboard summary">
          <section className="panel">
            <h2>最近完了</h2>
            <ItemList items={dashboard.recentCompleted} empty="直近7日で完了した項目はありません。" />
          </section>
          <section className="banner banner--warning">
            <strong>Backup reminder</strong>
            <p>ローカル運用では JSON export を定期的に取得してください。</p>
          </section>
        </aside>
      </div>
    </main>
  );
}

type DashboardItem = Awaited<ReturnType<typeof getDashboard>>["now"][number];

function ItemList({ items, empty }: { items: DashboardItem[]; empty: string }) {
  if (items.length === 0) {
    return <p className="support">{empty}</p>;
  }

  return (
    <div className="card-list">
      {items.map((item) => (
        <article className="item-card" key={item.id}>
          <h3>{item.title}</h3>
          <div className="meta-row">
            <span className="badge">{item.type}</span>
            <span className="badge">{item.status}</span>
            {item.reasons.map((reason: string) => (
              <span className="badge badge--warning" key={reason}>
                {reason}
              </span>
            ))}
          </div>
          {item.repositoryName ? <p className="support">{item.repositoryName}</p> : null}
        </article>
      ))}
    </div>
  );
}
