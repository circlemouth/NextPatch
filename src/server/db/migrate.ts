import fs from "node:fs";
import path from "node:path";
import { openSqliteDatabase } from "./client";
import { getDatabasePath } from "./paths";

const migrationDir = path.resolve("drizzle");

export function migrateDatabase(dbPath = getDatabasePath()) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = openSqliteDatabase(dbPath);
  const files = fs
    .readdirSync(migrationDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationDir, file), "utf8");
    sqlite.exec(sql);
  }

  sqlite.close();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dbPath = getDatabasePath();
  migrateDatabase(dbPath);
  console.log(`Migrated SQLite database at ${dbPath}`);
}
