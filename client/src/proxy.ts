import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Cookie names Better Auth uses in development and over HTTPS. The proxy only
 * performs an optimistic check: the real session is verified by the dashboard
 * guard and by every API request.
 */
const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

const PROTECTED_PREFIXES = [
  "/home",
  "/projects",
  "/priority",
  "/search",
  "/teams",
  "/timeline",
  "/user",
];

const isProtectedPath = (pathname: string) =>
  PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) return NextResponse.next();

  const hasSessionCookie = SESSION_COOKIES.some((name) =>
    request.cookies.has(name),
  );

  if (hasSessionCookie) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  // Preserve the full path and query so the login page can send the visitor
  // back to exactly where they were headed.
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Auth and app API routes must never be redirected: the browser needs the
  // 401 from Express, and the landing/auth pages stay public.
  matcher: [
    "/((?!api|backend|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)",
  ],
};
