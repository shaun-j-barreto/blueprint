import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";

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
