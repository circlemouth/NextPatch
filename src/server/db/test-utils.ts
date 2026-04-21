import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { openNextPatchDatabase, type NextPatchDatabase } from "@/server/db/client";
import { migrateDatabase } from "@/server/db/migrate";
import { createQueryContext, type QueryContext } from "@/server/db/queries/context";
import { seedDatabase } from "@/server/db/seed";

export type TestDatabase = {
  db: NextPatchDatabase;
  dbPath: string;
  tempDir: string;
  ctx: QueryContext;
  cleanup: () => void;
};

export function createMigratedTestDatabase(): TestDatabase {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nextpatch-sqlite-"));
  const dbPath = path.join(tempDir, "nextpatch.test.sqlite");
  const db = openNextPatchDatabase(dbPath);

  migrateDatabase(db);
  seedDatabase(db);

  return {
    db,
    dbPath,
    tempDir,
    ctx: createQueryContext(db),
    cleanup() {
      db.close();
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  };
}

