import { createBackupDocument } from "@/server/domain/export";
import { UnauthorizedError } from "@/server/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const backup = await createBackupDocument("json");
    return Response.json(backup, {
      headers: {
        "Content-Disposition": `attachment; filename="nextpatch-backup-${backup.exportedAt.slice(0, 10)}.json"`
      }
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    throw error;
  }
}
