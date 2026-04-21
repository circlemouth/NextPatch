import fs from "node:fs";
import path from "node:path";

const defaultRelativePath = ".data/nextpatch.sqlite";

export function getDatabasePath() {
  return path.resolve(process.cwd(), process.env.NEXTPATCH_DB_PATH ?? defaultRelativePath);
}

export function ensureDatabaseDirectory(databasePath = getDatabasePath()) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
}
