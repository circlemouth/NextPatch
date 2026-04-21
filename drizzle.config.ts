import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.NEXTPATCH_DB_PATH ?? "./.data/nextpatch.sqlite"
  },
  strict: true,
  verbose: true
});
