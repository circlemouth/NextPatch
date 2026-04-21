import { getDb } from "@/server/db/client";

export type TechNoteRow = {
  id: string;
  name: string;
  category: string | null;
  adoption_status: string;
  reason: string | null;
  official_url: string | null;
  concerns: string | null;
};

export type ReferenceServiceRow = {
  id: string;
  name: string;
  url: string | null;
  reference_point: string | null;
  strengths: string | null;
  concerns: string | null;
};

export async function listTechNotes(workspaceId: string) {
  return getDb()
    .prepare(
      `
        select id, name, category, adoption_status, reason, official_url, concerns
        from tech_notes
        where workspace_id = ? and deleted_at is null
        order by updated_at desc
      `
    )
    .all(workspaceId) as TechNoteRow[];
}

export async function listReferenceServices(workspaceId: string) {
  return getDb()
    .prepare(
      `
        select id, name, url, reference_point, strengths, concerns
        from reference_services
        where workspace_id = ? and deleted_at is null
        order by updated_at desc
      `
    )
    .all(workspaceId) as ReferenceServiceRow[];
}
