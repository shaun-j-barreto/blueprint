/**
 * Dev-only test identities for the Sprint 1 verification matrix.
 *
 * Invitations land in Phase 4, so there is no UI path to create a MEMBER or a
 * VIEWER yet. This script creates two signable accounts and gives them project
 * memberships on the first project:
 *
 *   dev-member@blueprint.local  MEMBER  ProjectMember(CONTRIBUTOR)
 *   dev-viewer@blueprint.local  VIEWER  ProjectMember(VIEWER)
 *
 * It refuses to run in production and requires --yes, because it writes real
 * accounts (and reuses them on later runs).
 *
 * Usage:
 *   npm run auth:fixture -- --yes
 */
import "dotenv/config";
import { prisma } from "../prisma.js";
import { auth } from "../auth.js";

const PASSWORD = "blueprint-dev-password";
const ONBOARDED_AT = new Date();

type FixtureUser = {
  email: string;
  username: string;
  role: "MEMBER" | "VIEWER";
  projectRole: "CONTRIBUTOR" | "VIEWER";
};

const FIXTURES: FixtureUser[] = [
  {
    email: "dev-member@blueprint.local",
    username: "dev-member",
    role: "MEMBER",
    projectRole: "CONTRIBUTOR",
  },
  {
    email: "dev-viewer@blueprint.local",
    username: "dev-viewer",
    role: "VIEWER",
    projectRole: "VIEWER",
  },
];

const fail = (message: string) => {
  console.error(message);
  process.exitCode = 1;
};

const main = async () => {
  if (process.env.NODE_ENV === "production") {
    fail("Refusing to create fixture accounts in production.");
    return;
  }

  if (!process.argv.includes("--yes")) {
    fail(
      "This creates real accounts. Re-run with --yes:\n  npm run auth:fixture -- --yes",
    );
    return;
  }

  // Both fixtures share one project so cross-project reads can be tested
  // against the seeded projects they are deliberately not members of.
  const project = await prisma.project.findFirst({
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });

  if (!project) {
    fail("No projects found. Seed the database before creating fixtures.");
    return;
  }

  for (const fixture of FIXTURES) {
    const existing = await prisma.user.findUnique({
      where: { email: fixture.email },
      select: { id: true },
    });

    let userId: number;

    if (existing) {
      userId = existing.id;
    } else {
      const result = await auth.api.signUpEmail({
        body: {
          email: fixture.email,
          password: PASSWORD,
          name: fixture.username,
        },
      });

      if (!result?.user?.id) {
        fail(`Sign-up did not return a user for ${fixture.email}.`);
        return;
      }

      // Better Auth ids are strings; the column is an Int.
      userId = Number(result.user.id);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        username: fixture.username,
        role: fixture.role,
        emailVerified: true,
        onboardedAt: ONBOARDED_AT,
        deactivatedAt: null,
      },
    });

    await prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId: project.id, userId },
      },
      create: {
        projectId: project.id,
        userId,
        role: fixture.projectRole,
      },
      update: { role: fixture.projectRole },
    });

    // Sign-up can leave a session behind; the matrix must start signed out.
    await prisma.session.deleteMany({ where: { userId } });

    console.log(
      `${fixture.username.padEnd(12)} id=${userId}  ${fixture.role}/${
        fixture.projectRole
      }  ${fixture.email}`,
    );
  }

  console.log("");
  console.log(`Project:   #${project.id} ${project.name}`);
  console.log(`Password:  ${PASSWORD}`);
};

main()
  .catch((error: unknown) => {
    fail(
      `\nCould not create fixture accounts: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
