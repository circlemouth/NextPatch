import { createBackupDocument, toCsvExport } from "@/server/domain/export";

export const runtime = "nodejs";

export async function GET() {
  const backup = await createBackupDocument("csv");
  return new Response(toCsvExport(backup), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nextpatch-work-items-${backup.exportedAt.slice(0, 10)}.csv"`
    }
  });
}
