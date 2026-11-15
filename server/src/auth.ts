import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";
import { sendEmail } from "./lib/email.js";
import { resetPasswordEmail } from "./emails/resetPasswordEmail.js";

const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;
const clientOrigin = process.env.CLIENT_ORIGIN;

if (!secret) throw new Error("BETTER_AUTH_SECRET is not set");
if (!baseURL) throw new Error("BETTER_AUTH_URL is not set");
if (!clientOrigin) throw new Error("CLIENT_ORIGIN is not set");

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

/** The adapter accepts any Prisma client, which lets the Phase 0 spike run the
 * exact same auth options against a throwaway database. */
type AuthDatabase = Parameters<typeof prismaAdapter>[0];

export const createAuth = (database: AuthDatabase) =>
  betterAuth({
    appName: "BluePrint",
    secret,
    // Public origin (the Next.js app), not the Express port. OAuth callbacks and
    // emailed links must point at the host the browser actually uses.
    baseURL,
    trustedOrigins: [clientOrigin],
    database: prismaAdapter(database, { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        const message = resetPasswordEmail({
          name: user.name || user.email,
          url,
        });

        await sendEmail({
          to: user.email,
          subject: message.subject,
          html: message.html,
          text: message.text,
        });
      },
      // The plan invalidates every session after a password reset.
      onPasswordReset: async ({ user }) => {
        await prisma.session.deleteMany({
          where: { userId: Number(user.id) },
        });
      },
    },
    socialProviders:
      googleClientId && googleClientSecret
        ? {
            google: {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
            },
          }
        : {},
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 20,
    },
    advanced: {
      // Keep the existing Int primary keys instead of Better Auth's string ids.
      database: { generateId: "serial" },
      // The API is reached through the Next.js rewrite, which sets
      // x-forwarded-for. Without a resolvable client IP every caller shares a
      // single rate-limit bucket.
      ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
    },
    databaseHooks: {
      user: {
        create: {
          // Registration maps Better Auth's `name` onto `username`. Validate it
          // here so a bad or duplicate username is a friendly 400 instead of a
          // Prisma unique-constraint 500.
          before: async (user) => {
            const username =
              typeof user.name === "string" ? user.name.trim() : "";

            if (username.length < 3 || username.length > 40) {
              throw new APIError("BAD_REQUEST", {
                message: "Username must be between 3 and 40 characters",
              });
            }

            if (!/^[A-Za-z0-9][A-Za-z0-9 ._-]*$/.test(username)) {
              throw new APIError("BAD_REQUEST", {
                message:
                  "Username can only use letters, numbers, spaces, dots, dashes, and underscores",
              });
            }

            const existing = await (database as typeof prisma).user.findUnique({
              where: { username },
              select: { id: true },
            });

            if (existing) {
              throw new APIError("BAD_REQUEST", {
                message: "That username is already taken",
              });
            }

            return { data: { ...user, name: username } };
          },
        },
      },
    },
    user: {
      // The database already stores these columns; map instead of renaming so the
      // rest of the app keeps using `username` and `profilePictureUrl`.
      fields: {
        name: "username",
        image: "profilePictureUrl",
      },
    },
  });

export const auth = createAuth(prisma);
