export default function SystemSettingsPage() {
  const runtimeMode = process.env.NEXTPATCH_RUNTIME_MODE ?? "development";
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">System</p>
        <h1>システム状態</h1>
        <p className="support">機密値は表示しません。設定の有無だけを確認します。</p>
      </header>
      <section className="panel">
        <dl>
          <dt>Runtime</dt>
          <dd>{runtimeMode}</dd>
          <dt>Supabase URL</dt>
          <dd>{hasSupabaseUrl ? "設定済み" : "未設定"}</dd>
          <dt>Supabase anon key</dt>
          <dd>{hasAnonKey ? "設定済み" : "未設定"}</dd>
          <dt>Service role key</dt>
          <dd>{hasServiceRole ? "設定済み" : "未設定"}</dd>
        </dl>
      </section>
    </main>
  );
}
