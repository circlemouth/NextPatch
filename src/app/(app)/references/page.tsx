import { requireSession } from "@/server/auth/session";

export default async function ReferencesPage() {
  const { supabase, workspace } = await requireSession();
  const { data, error } = await supabase
    .from("reference_services")
    .select("*")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">References</p>
        <h1>参考サービス</h1>
      </header>
      <section className="panel">
        {(data ?? []).length === 0 ? <p className="support">参考サービスはまだありません。</p> : null}
      </section>
    </main>
  );
}
