import { createBackupDocument, toMarkdownExport } from "@/server/domain/export";

export const runtime = "nodejs";

export async function GET() {
  const backup = await createBackupDocument("markdown");
  return new Response(toMarkdownExport(backup), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="nextpatch-export-${backup.exportedAt.slice(0, 10)}.md"`
    }
  });
}
