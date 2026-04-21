import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { openSqliteDatabase } from "./client";
import { getDatabasePath } from "./paths";

export const DEFAULT_MIGRATION_DIR = path.resolve(process.cwd(), "drizzle");

function getMigrationFiles(migrationDir: string) {
  return fs
    .readdirSync(migrationDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

function checksumMigration(sql: string) {
  return crypto.createHash("sha256").update(sql).digest("hex");
}

export function migrateDatabase(dbPath = getDatabasePath(), migrationDir = DEFAULT_MIGRATION_DIR) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = openSqliteDatabase(dbPath);
  try {
    const files = getMigrationFiles(migrationDir);

    if (files.length === 0) {
      throw new Error(`No migration SQL files found in ${migrationDir}`);
    }

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS nextpatch_migrations (
        id TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TEXT NOT NULL
      )
    `);

    const getAppliedMigration = sqlite.prepare(
      "select id, checksum from nextpatch_migrations where id = ?"
    );
    const insertMigration = sqlite.prepare(
      "insert into nextpatch_migrations (id, checksum, applied_at) values (?, ?, ?)"
    );
    const applyMigration = sqlite.transaction((file: string, sql: string, checksum: string) => {
      sqlite.exec(sql);
      insertMigration.run(file, checksum, new Date().toISOString());
    });

    const migrations = files.map((file) => {
      const sql = fs.readFileSync(path.join(migrationDir, file), "utf8");
      const checksum = checksumMigration(sql);
      const applied = getAppliedMigration.get(file) as { id: string; checksum: string } | undefined;

      return { file, sql, checksum, applied };
    });

    for (const migration of migrations) {
      if (migration.applied && migration.applied.checksum !== migration.checksum) {
        throw new Error(
          `Migration checksum changed for ${migration.file}: expected ${migration.applied.checksum}, got ${migration.checksum}`
        );
      }
    }

    for (const migration of migrations) {
      if (migration.applied) {
        continue;
      }

      applyMigration(migration.file, migration.sql, migration.checksum);
    }
  } finally {
    sqlite.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dbPath = getDatabasePath();
  migrateDatabase(dbPath);
  console.log(`Migrated SQLite database at ${dbPath}`);
}
