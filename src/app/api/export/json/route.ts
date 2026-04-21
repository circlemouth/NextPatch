import { createBackupDocument } from "@/server/domain/export";

export const runtime = "nodejs";

export async function GET() {
  const backup = await createBackupDocument("json");
  return Response.json(backup, {
    headers: {
      "Content-Disposition": `attachment; filename="nextpatch-backup-${backup.exportedAt.slice(0, 10)}.json"`
    }
  });
}
