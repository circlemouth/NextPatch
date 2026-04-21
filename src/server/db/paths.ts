import path from "node:path";

const DEFAULT_DATA_DIR = "./data";
const DEFAULT_DB_FILENAME = "nextpatch.sqlite";

export function getDataDir() {
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.NEXTPATCH_DATA_DIR ?? DEFAULT_DATA_DIR);
}

export function getDbPath() {
  const configuredPath = process.env.NEXTPATCH_DB_PATH;
  if (configuredPath) {
    return path.resolve(/*turbopackIgnore: true*/ process.cwd(), configuredPath);
  }
  return path.join(getDataDir(), DEFAULT_DB_FILENAME);
}
