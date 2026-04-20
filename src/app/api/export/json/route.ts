import { createBackupDocument } from "@/server/domain/export";

export async function GET() {
  const backup = await createBackupDocument();
  return Response.json(backup, {
    headers: {
      "Content-Disposition": `attachment; filename="nextpatch-backup-${backup.exportedAt.slice(0, 10)}.json"`
    }
  });
}
