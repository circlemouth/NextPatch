import fs from "node:fs";
import path from "node:path";

function resolvePath(value: string | undefined, fallback: string) {
  const target = value?.trim() || fallback;
  return path.isAbsolute(target) ? target : path.join(/*turbopackIgnore: true*/ process.cwd(), target);
}

export function getDataDir() {
  return resolvePath(process.env.NEXTPATCH_DATA_DIR, "./data");
}

export function getDbPath() {
  return resolvePath(process.env.NEXTPATCH_DB_PATH, path.join(getDataDir(), "nextpatch.sqlite"));
}

export function getExportDir() {
  return resolvePath(process.env.NEXTPATCH_EXPORT_DIR, path.join(getDataDir(), "exports"));
}

export function getRuntimeInfo() {
  const dbPath = getDbPath();

  return {
    runtime: process.env.NEXTPATCH_RUNTIME_MODE ?? "local-sqlite",
    dataDir: getDataDir(),
    dbPath,
    exportDir: getExportDir(),
    dbFileExists: fs.existsSync(dbPath)
  };
}
