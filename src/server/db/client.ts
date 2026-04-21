import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { getDbPath } from "./paths";

let sqlite: Database.Database | null = null;
let sqlitePath: string | null = null;

export function getSqliteDb() {
  const dbPath = getDbPath();
  if (sqlite && sqlitePath === dbPath) {
    return sqlite;
  }

  if (sqlite) {
    sqlite.close();
  }

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");
  sqlitePath = dbPath;

  return sqlite;
}

export function closeSqliteDbForTests() {
  sqlite?.close();
  sqlite = null;
  sqlitePath = null;
}
