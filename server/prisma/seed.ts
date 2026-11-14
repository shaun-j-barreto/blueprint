import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import fs from "fs";
import path from "path";
import "dotenv/config";

// 1. Initialize the PostgreSQL Driver and Adapter
const isRDS = process.env.DATABASE_URL?.includes("rds.amazonaws.com");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRDS ? { rejectUnauthorized: false } : false,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 2. Helper to map file names directly to Prisma's camelCase properties
function getClientModelKey(fileName: string): string {
  const baseName = path.basename(fileName, path.extname(fileName)); // e.g., "projectTeam"
  // Ensures the first letter is lowercase to match Prisma's client properties
  return baseName.charAt(0).toLowerCase() + baseName.slice(1);
}

async function deleteAllData(orderedFileNames: string[]) {
  // Reverse the array to delete dependent child rows before parent rows
  const reverseOrder = [...orderedFileNames].reverse();

  for (const fileName of reverseOrder) {
    const modelKey = getClientModelKey(fileName);
    const model = (prisma as any)[modelKey];

    if (!model) {
      console.error(`Model key "${modelKey}" not found on Prisma Client.`);
      continue;
    }

    try {
      await model.deleteMany({});
      console.log(`Cleared data from ${modelKey}`);
    } catch (error) {
      console.error(`Error clearing data from ${modelKey}:`, error);
    }
  }
}

// Seed rows are inserted with explicit ids, which does not advance the
// PostgreSQL sequences behind the serial columns. Resetting them prevents the
// next INSERT (e.g. an uploaded attachment) from reusing an existing id.
const SERIAL_TABLES = [
  { table: "Team", idColumn: "id" },
  { table: "Project", idColumn: "id" },
  { table: "ProjectTeam", idColumn: "id" },
  { table: "User", idColumn: "userId" },
  { table: "Task", idColumn: "id" },
  { table: "Attachment", idColumn: "id" },
  { table: "Comment", idColumn: "id" },
  { table: "TaskAssignment", idColumn: "id" },
] as const;

async function resetSequences() {
  for (const { table, idColumn } of SERIAL_TABLES) {
    await prisma.$queryRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', '${idColumn}'), COALESCE((SELECT MAX("${idColumn}") FROM "${table}"), 0) + 1, false)`,
    );
    console.log(`Reset id sequence for ${table}`);
  }
}

type SeedUser = {
  userId: number;
  username: string;
  [key: string]: unknown;
};

/**
 * seedData/user.json predates authentication. Prisma now exposes the primary
 * key as `id` and requires an email, so the legacy shape is mapped on the way
 * in and the JSON stays untouched.
 */
function toSeedUser(raw: SeedUser) {
  const { userId, ...rest } = raw;

  return {
    ...rest,
    id: userId,
    email: `${raw.username.toLowerCase()}@seed.blueprint.local`,
  };
}

async function main() {
  // Resolves the path relative to the runtime location
  const dataDirectory = path.join(process.cwd(), "prisma", "seedData");

  const orderedFileNames = [
    "team.json",
    "project.json",
    "projectTeam.json",
    "user.json",
    "task.json",
    "attachment.json",
    "comment.json",
    "taskAssignment.json",
  ];

  console.log("Starting database wipe...");
  await deleteAllData(orderedFileNames);

  console.log("Starting data seeding...");
  for (const fileName of orderedFileNames) {
    const filePath = path.join(dataDirectory, fileName);

    if (!fs.existsSync(filePath)) {
      console.error(`File missing: ${filePath}`);
      continue;
    }

    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const modelKey = getClientModelKey(fileName);
    const model = (prisma as any)[modelKey];

    try {
      for (const data of jsonData) {
        await model.create({
          data: modelKey === "user" ? toSeedUser(data) : data,
        });
      }
      console.log(`Seeded ${modelKey} with ${jsonData.length} records.`);
    } catch (error) {
      console.error(`Error seeding data for ${modelKey}:`, error);
    }
  }

  console.log("Resetting id sequences...");
  await resetSequences();
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Close the database connection pool cleanly
  });
