import { requireSession } from "@/server/auth/session";

export default async function TechNotesPage() {
  const { supabase, workspace } = await requireSession();
  const { data, error } = await supabase
    .from("tech_notes")
    .select("*")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Tech Notes</p>
        <h1>技術メモ</h1>
      </header>
      <section className="panel">
        {(data ?? []).length === 0 ? <p className="support">技術メモはまだありません。</p> : null}
      </section>
    </main>
  );
}
