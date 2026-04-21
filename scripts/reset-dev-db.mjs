import fs from "node:fs";
import path from "node:path";

function resolveRuntimePath(value) {
  return path.isAbsolute(value) ? value : path.join(process.cwd(), value);
}

const dbPath = resolveRuntimePath(process.env.NEXTPATCH_DB_PATH ?? "./data/nextpatch.sqlite");

for (const filePath of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
  try {
    fs.rmSync(filePath);
  } catch {
    // Ignore missing files; the command is intentionally idempotent.
  }
}
