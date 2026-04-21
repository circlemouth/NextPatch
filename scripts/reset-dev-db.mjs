import fs from "node:fs";
import path from "node:path";

const DEFAULT_DATA_DIR = "./data";
const DEFAULT_DB_FILE = "nextpatch.sqlite";

function resolveRuntimePath(value) {
  return path.isAbsolute(value) ? value : path.join(process.cwd(), value);
}

function getDataDir() {
  return resolveRuntimePath(process.env.NEXTPATCH_DATA_DIR ?? DEFAULT_DATA_DIR);
}

function getDatabasePath() {
  const explicitPath = process.env.NEXTPATCH_DB_PATH;
  return explicitPath ? resolveRuntimePath(explicitPath) : path.join(getDataDir(), DEFAULT_DB_FILE);
}

const dbPath = getDatabasePath();

for (const filePath of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
  try {
    fs.rmSync(filePath);
  } catch {
    // Ignore missing files; the command is intentionally idempotent.
  }
}
