import { createAuthClient } from "better-auth/react";

/**
 * The browser talks to Better Auth through the Next.js rewrite at
 * `/api/auth/*`, so the default same-origin base URL keeps the session cookie
 * first-party. Never point this at the Express port directly.
 */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
