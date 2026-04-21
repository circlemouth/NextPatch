import path from "node:path";

export function getDataDir() {
  return path.resolve(process.cwd(), process.env.NEXTPATCH_DATA_DIR ?? "./data");
}

export function getDbPath() {
  return path.resolve(process.cwd(), process.env.NEXTPATCH_DB_PATH ?? path.join(getDataDir(), "nextpatch.sqlite"));
}

export function getExportDir() {
  return path.resolve(process.cwd(), process.env.NEXTPATCH_EXPORT_DIR ?? path.join(getDataDir(), "exports"));
}

