import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { getDatabasePath } from "./paths";

const migrationDir = path.resolve("drizzle");

function migrate() {
  const dbPath = getDatabasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");

  const files = fs
    .readdirSync(migrationDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationDir, file), "utf8");
    sqlite.exec(sql);
  }

  sqlite.close();
  console.log(`Migrated SQLite database at ${dbPath}`);
}

migrate();
