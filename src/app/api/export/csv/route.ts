import { createBackupDocument, toCsvExport } from "@/server/domain/export";
import { UnauthorizedError } from "@/server/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const backup = await createBackupDocument("csv");
    return new Response(toCsvExport(backup), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nextpatch-work-items-${backup.exportedAt.slice(0, 10)}.csv"`
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
