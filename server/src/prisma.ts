import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

// Initialize the single PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

// Instantiate the client with the required adapter option
export const prisma = new PrismaClient({ adapter });
