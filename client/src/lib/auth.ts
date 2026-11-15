export const DEFAULT_AUTH_REDIRECT = "/home";

const AUTH_PAGES = ["/login", "/signup"];

/**
 * Only allow same-origin, absolute paths as post-auth destinations. Anything
 * else (protocol-relative URLs, absolute URLs, backslash tricks, or another
 * auth page that would bounce) falls back to the dashboard.
 */
export const safeAuthRedirect = (value: string | null): string => {
  if (!value) return DEFAULT_AUTH_REDIRECT;
  if (!value.startsWith("/")) return DEFAULT_AUTH_REDIRECT;
  if (value.startsWith("//") || value.startsWith("/\\")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  if (
    AUTH_PAGES.some(
      (page) =>
        value === page ||
        value.startsWith(`${page}?`) ||
        value.startsWith(`${page}/`),
    )
  ) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return value;
};

const authPageHref = (path: "/login" | "/signup", next: string) =>
  next === DEFAULT_AUTH_REDIRECT
    ? path
    : `${path}?next=${encodeURIComponent(next)}`;

export const loginHref = (next: string) => authPageHref("/login", next);
export const signupHref = (next: string) => authPageHref("/signup", next);
