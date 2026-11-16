import { execFileSync } from "node:child_process";
import { config as loadEnv } from "dotenv";

// Mirrors vitest.config.ts: the integration suite runs against a throwaway
// database derived from DATABASE_URL.
loadEnv();

const sourceUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!sourceUrl) {
  throw new Error("DATABASE_URL is not set");
}

const url = new URL(sourceUrl);
if (!process.env.TEST_DATABASE_URL) {
  url.pathname = "/blueprint_test";
}

if (url.pathname === "/blueprint" || url.pathname === "/postgres") {
  throw new Error(
    `Refusing to migrate ${url.pathname}: that is the development database.`,
  );
}

console.log(`Applying migrations to ${url.pathname}`);

execFileSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url.toString() },
});
