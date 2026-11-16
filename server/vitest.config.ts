import { config as loadEnv } from "dotenv";
import { defineConfig } from "vitest/config";

// Integration tests talk to a real PostgreSQL database, so the suite needs the
// same secrets the app uses. The database itself is swapped for a throwaway one
// derived from DATABASE_URL (`blueprint` -> `blueprint_test`) unless
// TEST_DATABASE_URL points somewhere explicit.
loadEnv();

const sourceUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!sourceUrl) {
  throw new Error(
    "DATABASE_URL is not set. Copy server/.env.example to server/.env first.",
  );
}

const url = new URL(sourceUrl);
if (!process.env.TEST_DATABASE_URL) {
  url.pathname = "/blueprint_test";
}

const databaseUrl = url.toString();

if (url.pathname === "/blueprint" || url.pathname === "/postgres") {
  throw new Error(
    `Refusing to run destructive integration tests against ${url.pathname}.`,
  );
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // Every suite truncates the shared database, so files must not overlap.
    fileParallelism: false,
    maxWorkers: 1,
    pool: "threads",
    hookTimeout: 30_000,
    testTimeout: 30_000,
    env: {
      DATABASE_URL: databaseUrl,
      NODE_ENV: "test",
      // Keep email previews out of the test log and exercise the no-SMTP path.
      SMTP_HOST: "",
    },
  },
});
