import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { ensureDatabaseDirectory, getDatabasePath } from "@/server/db/paths";
import * as schema from "@/server/db/schema";

type ClientEntry = {
  sqlite: Database.Database;
  db: BetterSQLite3Database<typeof schema>;
};

const clients = new Map<string, ClientEntry>();

export function getSqliteClient() {
  const databasePath = getDatabasePath();
  const existing = clients.get(databasePath);

  if (existing) {
    return existing.sqlite;
  }

  ensureDatabaseDirectory(databasePath);
  const sqlite = new Database(databasePath);
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");

  const db = drizzle(sqlite, { schema });
  clients.set(databasePath, { sqlite, db });

  return sqlite;
}

export function getDb() {
  const databasePath = getDatabasePath();
  const existing = clients.get(databasePath);

  if (existing) {
    return existing.db;
  }

  getSqliteClient();
  return clients.get(databasePath)!.db;
}

export function closeDb(databasePath = getDatabasePath()) {
  const existing = clients.get(databasePath);

  if (!existing) {
    return;
  }

  existing.sqlite.close();
  clients.delete(databasePath);
}
