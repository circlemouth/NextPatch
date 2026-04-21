import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { getDatabasePath } from "@/server/db/paths";
import * as schema from "@/server/db/schema";

let sqlite: Database.Database | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function configureSqliteDatabase(database: Database.Database) {
  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = WAL");
  database.pragma("busy_timeout = 5000");
}

export function openSqliteDatabase(dbPath = getDatabasePath()) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const database = new Database(dbPath);
  configureSqliteDatabase(database);
  return database;
}

export function getSqlite() {
  if (!sqlite) {
    sqlite = openSqliteDatabase();
  }
  return sqlite;
}

export function getDb() {
  if (!db) {
    db = drizzle(getSqlite(), { schema });
  }

  return db;
}

export function closeDatabaseConnection() {
  sqlite?.close();
  sqlite = null;
  db = null;
}
