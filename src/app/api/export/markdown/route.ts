import { createBackupDocument, toMarkdownExport } from "@/server/domain/export";

export async function GET() {
  const backup = await createBackupDocument();
  return new Response(toMarkdownExport(backup), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="nextpatch-export-${backup.exportedAt.slice(0, 10)}.md"`
    }
  });
}
