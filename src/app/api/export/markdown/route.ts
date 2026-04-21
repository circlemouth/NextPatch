import { createBackupDocument, toMarkdownExport } from "@/server/domain/export";
import { UnauthorizedError } from "@/server/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const backup = await createBackupDocument("markdown");
    return new Response(toMarkdownExport(backup), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="nextpatch-export-${backup.exportedAt.slice(0, 10)}.md"`
      }
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return new Response("Unauthorized", {
        status: 401,
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      });
    }

    throw error;
  }
}
