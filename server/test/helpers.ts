import type { WorkspaceRole } from "../src/generated/prisma/enums.js";
import { auth } from "../src/auth.js";
import { prisma } from "../src/prisma.js";

export const TEST_PASSWORD = "correct horse battery staple";

let sequence = 0;

const nextLabel = (prefix: string): string => {
  sequence += 1;
  return `${prefix}.${Date.now()}.${sequence}`;
};

export type TestUser = {
  id: number;
  email: string;
  username: string;
  password: string;
  /** Ready-to-send `Cookie` header for the Better Auth session. */
  cookie: string;
};

/**
 * Creates a real account through Better Auth (not a hand-written row) so the
 * session cookie and its signature match what a browser would receive. Calling
 * the API directly skips the HTTP rate limiter, which keeps suites fast.
 */
export const signUpUser = async (
  overrides: {
    email?: string;
    username?: string;
    password?: string;
  } = {},
): Promise<TestUser> => {
  const label = nextLabel("user");
  const email = overrides.email ?? `${label}@example.test`;
  const username = overrides.username ?? label.replaceAll(".", "_");
  const password = overrides.password ?? TEST_PASSWORD;

  const { headers, response } = await auth.api.signUpEmail({
    body: { name: username, email, password },
    returnHeaders: true,
  });

  const cookie = headers
    .getSetCookie()
    .map((header) => header.split(";")[0])
    .filter((pair): pair is string => Boolean(pair))
    .join("; ");

  if (!cookie) {
    throw new Error("Better Auth did not return a session cookie");
  }

  return {
    id: Number(response.user.id),
    email,
    username,
    password,
    cookie,
  };
};

/** Creates an account and sets its workspace role in one step. */
export const createUser = async (
  role: WorkspaceRole = "MEMBER",
): Promise<TestUser> => {
  const user = await signUpUser();

  if (role !== "MEMBER") {
    await prisma.user.update({ where: { id: user.id }, data: { role } });
  }

  return user;
};

export const setRole = async (
  userId: number,
  role: WorkspaceRole,
): Promise<void> => {
  await prisma.user.update({ where: { id: userId }, data: { role } });
};

/**
 * Empties every application table. `_prisma_migrations` is preserved so the
 * suite can keep running against the same database.
 */
export const resetDatabase = async (): Promise<void> => {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;

  if (tables.length === 0) return;

  const list = tables
    .map(({ tablename }) => `"${tablename.replaceAll('"', '""')}"`)
    .join(", ");

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`,
  );
};

/** Builds a project directly; controllers are covered by their own suites. */
export const createProjectRow = async (
  name = `Project ${nextLabel("p")}`,
): Promise<{ id: number; name: string }> => {
  return prisma.project.create({
    data: { name },
    select: { id: true, name: true },
  });
};

export const addProjectMember = async (
  projectId: number,
  userId: number,
  role: "MANAGER" | "CONTRIBUTOR" | "VIEWER" = "CONTRIBUTOR",
): Promise<void> => {
  await prisma.projectMember.create({
    data: { projectId, userId, role },
  });
};

export const disconnect = async (): Promise<void> => {
  await prisma.$disconnect();
};
