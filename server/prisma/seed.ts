import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import fs from "fs";
import path from "path";
import "dotenv/config";

// 1. Initialize the PostgreSQL Driver and Adapter
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
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

async function main() {
  // Resolves the path relative to the runtime location
  const dataDirectory = path.resolve(__dirname, "seedData");

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
        await model.create({ data });
      }
      console.log(`Seeded ${modelKey} with ${jsonData.length} records.`);
    } catch (error) {
      console.error(`Error seeding data for ${modelKey}:`, error);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Close the database connection pool cleanly
  });
