import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { getDbPath } from "@/server/db/paths";

export type NextPatchDatabase = DatabaseSync;

export function openNextPatchDatabase(dbPath = getDbPath()) {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new DatabaseSync(dbPath);
  configureDatabase(db);
  return db;
}

export function configureDatabase(db: NextPatchDatabase) {
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA busy_timeout = 5000");
  return db.prepare("PRAGMA journal_mode = WAL").get() as { journal_mode: string };
}

