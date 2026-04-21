import fs from "node:fs";
import path from "node:path";

const DEFAULT_DATA_DIR = "./data";
const DEFAULT_DB_FILE = "nextpatch.sqlite";
const DEFAULT_EXPORT_DIR = "exports";

function resolveRuntimePath(value: string) {
  return path.isAbsolute(value) ? value : path.join(/*turbopackIgnore: true*/ process.cwd(), value);
}

export function getDataDir() {
  return resolveRuntimePath(process.env.NEXTPATCH_DATA_DIR ?? DEFAULT_DATA_DIR);
}

export function getDatabasePath() {
  const explicitPath = process.env.NEXTPATCH_DB_PATH;
  return explicitPath ? resolveRuntimePath(explicitPath) : path.join(getDataDir(), DEFAULT_DB_FILE);
}

export function getDbPath() {
  return getDatabasePath();
}

export function getExportDir() {
  const explicitPath = process.env.NEXTPATCH_EXPORT_DIR;
  return explicitPath ? resolveRuntimePath(explicitPath) : path.join(getDataDir(), DEFAULT_EXPORT_DIR);
}

export function getRuntimeInfo() {
  const dbPath = getDatabasePath();

  return {
    runtime: process.env.NEXTPATCH_RUNTIME_MODE ?? "local-server",
    dataDir: getDataDir(),
    dbPath,
    exportDir: getExportDir(),
    dbFileExists: fs.existsSync(dbPath)
  };
}
