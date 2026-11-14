/**
 * Creates the single workspace owner for a fresh install.
 *
 * Seeded users are historical data only: they have no password and cannot sign
 * in. The owner is created through Better Auth so the password hash, account
 * row, and field mapping are exactly what the running server expects.
 *
 * Usage:
 *   npm run auth:bootstrap                 # interactive
 *   npm run auth:bootstrap -- --force      # allow a second owner
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { stdin, stdout } from "node:process";
import { createInterface, type Interface } from "node:readline";
import { prisma } from "../prisma.js";
import { auth } from "../auth.js";

const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,32}$/;

const force = process.argv.includes("--force");

/**
 * Readline drops the remainder of a pipe once its first question is answered,
 * so redirected input is read up front instead.
 */
const pipedAnswers = stdin.isTTY
  ? null
  : readFileSync(0, "utf8").split(/\r?\n/);

let pipedIndex = 0;
let rl: Interface | null = null;

const ask = (question: string): Promise<string> => {
  stdout.write(question);

  if (pipedAnswers) {
    const answer = (pipedAnswers[pipedIndex++] ?? "").trim();
    stdout.write("\n");

    return Promise.resolve(answer);
  }

  const iface = (rl ??= createInterface({ input: stdin, output: stdout }));

  return new Promise((resolve) => {
    iface.question("", (answer) => resolve(answer.trim()));
  });
};

/** Pipes may not be a TTY; fall back to a plain read so `printf |` still works. */
const askHidden = async (question: string): Promise<string> => {
  if (!stdin.isTTY) return ask(question);

  // The terminal needs raw mode to hide characters, which conflicts with
  // readline's own key handling, so hand the stream over temporarily.
  rl?.close();
  rl = null;

  return new Promise((resolve, reject) => {
    stdout.write(question);
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();

    let value = "";

    const cleanup = () => {
      stdin.removeListener("data", onData);
      stdin.setRawMode(wasRaw ?? false);
      stdin.pause();
    };

    const onData = (chunk: Buffer) => {
      for (const char of chunk.toString("utf8")) {
        if (char === "\r" || char === "\n") {
          cleanup();
          stdout.write("\n");
          resolve(value);
          return;
        }

        if (char === "\u0003") {
          cleanup();
          stdout.write("\n");
          reject(new Error("Cancelled"));
          return;
        }

        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }

        value += char;
      }
    };

    stdin.on("data", onData);
  });
};

const fail = (message: string) => {
  console.error(message);
  process.exitCode = 1;
};

const main = async () => {
  const existingOwner = await prisma.user.findFirst({
    where: { role: "OWNER", deactivatedAt: null },
    select: { id: true, email: true },
  });

  if (existingOwner && !force) {
    fail(
      `An owner already exists (${existingOwner.email}). Re-run with --force to add another.`,
    );
    return;
  }

  const email = (await ask("Owner email: ")).toLowerCase();
  const username = await ask("Display name (username): ");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail("That does not look like an email address.");
    return;
  }

  if (!USERNAME_PATTERN.test(username)) {
    fail(
      "Username must be 3-32 characters and may only contain letters, numbers, dot, underscore, or hyphen.",
    );
    return;
  }

  const password = await askHidden("Password (min 10 chars): ");

  if (password.length < 10) {
    fail("Password must be at least 10 characters.");
    return;
  }

  const confirmation = await askHidden("Confirm password: ");

  if (password !== confirmation) {
    fail("Passwords do not match.");
    return;
  }

  const taken = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });

  if (taken) {
    fail(
      taken.email === email
        ? `A user with email ${email} already exists.`
        : `Username ${username} is already taken.`,
    );
    return;
  }

  const result = await auth.api.signUpEmail({
    body: { email, password, name: username },
  });

  if (!result?.user?.id) {
    fail("Sign-up did not return a user. Nothing was changed.");
    return;
  }

  // Better Auth ids are strings; the column is an Int.
  const id = Number(result.user.id);

  await prisma.user.update({
    where: { id },
    data: {
      role: "OWNER",
      emailVerified: true,
      // onboardedAt stays null: the owner still walks the first-run flow.
    },
  });

  const signInUrl = `${process.env.BETTER_AUTH_URL ?? ""}/sign-in`;

  console.log("");
  console.log(`Owner created: ${username} <${email}> (id ${id})`);
  console.log(`Sign in at:    ${signInUrl}`);
};

main()
  .catch((error: unknown) => {
    fail(
      `\nCould not create the owner: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  })
  .finally(async () => {
    rl?.close();
    await prisma.$disconnect();
  });
