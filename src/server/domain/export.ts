import crypto from "node:crypto";
import { requireLocalContext } from "@/server/auth/session";
import { getBackupEntities } from "@/server/db/queries/export";

export type BackupDocument = {
  format: "nextpatch.backup";
  schemaVersion: 1;
  exportedAt: string;
  app: { name: "NextPatch"; version: string };
  scope: { type: "workspace"; workspaceId: string };
  options: {
    includeArchived: true;
    includeDeleted: true;
    includeAuditLogs: false;
    includeAttachments: false;
    redaction: "none";
  };
  entities: Record<string, unknown[]>;
  integrity: {
    counts: Record<string, number>;
    contentHash: string;
  };
};

export async function createBackupDocument(): Promise<BackupDocument> {
  const { workspace } = await requireLocalContext();
  const entities = await getBackupEntities(workspace.id);

  const counts = Object.fromEntries(Object.entries(entities).map(([key, value]) => [key, value.length]));
  const hashPayload = JSON.stringify({ entities, counts });
  const contentHash = `sha256:${crypto.createHash("sha256").update(hashPayload).digest("hex")}`;

  return {
    format: "nextpatch.backup",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    app: { name: "NextPatch", version: "0.1.0" },
    scope: { type: "workspace", workspaceId: workspace.id },
    options: {
      includeArchived: true,
      includeDeleted: true,
      includeAuditLogs: false,
      includeAttachments: false,
      redaction: "none"
    },
    entities,
    integrity: {
      counts,
      contentHash
    }
  };
}

export function validateBackupJson(input: string) {
  try {
    const parsed = JSON.parse(input) as Partial<BackupDocument>;
    if (parsed.format !== "nextpatch.backup") {
      return { ok: false as const, message: "format が nextpatch.backup ではありません。" };
    }
    if (parsed.schemaVersion !== 1) {
      return { ok: false as const, message: "対応していない schemaVersion です。" };
    }
    if (!parsed.entities || typeof parsed.entities !== "object") {
      return { ok: false as const, message: "entities がありません。" };
    }
    return { ok: true as const, message: "JSON backup として読み込めます。" };
  } catch {
    return { ok: false as const, message: "JSONとして読み込めません。" };
  }
}

export function toMarkdownExport(backup: BackupDocument) {
  const repositories = backup.entities.repositories as Array<{ name?: string; github_full_name?: string | null }>;
  const workItems = backup.entities.workItems as Array<{ title?: string; type?: string; status?: string }>;
  return [
    "# NextPatch Export",
    "",
    `Exported at: ${backup.exportedAt}`,
    "",
    "## Repositories",
    ...repositories.map((repository) => `- ${repository.name ?? "Untitled"}${repository.github_full_name ? ` (${repository.github_full_name})` : ""}`),
    "",
    "## Work Items",
    ...workItems.map((item) => `- [${item.type ?? "item"} / ${item.status ?? "unknown"}] ${item.title ?? "Untitled"}`),
    ""
  ].join("\n");
}

export function toCsvExport(backup: BackupDocument) {
  const workItems = backup.entities.workItems as Array<{ id?: string; type?: string; title?: string; status?: string; priority?: string }>;
  return [
    "id,type,title,status,priority",
    ...workItems.map((item) =>
      [item.id, item.type, item.title, item.status, item.priority].map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")
    )
  ].join("\n");
}
