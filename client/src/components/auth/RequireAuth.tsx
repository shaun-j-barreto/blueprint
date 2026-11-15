"use client";

import { useSession } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Client-side session guard for the dashboard shell. The proxy already
 * redirects requests without a session cookie; this verifies the cookie is
 * still a real, unexpired session before rendering any protected UI.
 */
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isSignedIn = Boolean(session?.user);

  useEffect(() => {
    if (isPending || isSignedIn) return;

    const next = `${pathname}${window.location.search}`;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [isPending, isSignedIn, pathname, router]);

  if (isPending || !isSignedIn) {
    return (
      <div className="bg-brand-100 text-brand-700 flex min-h-screen items-center justify-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>Checking your session…</span>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAuth;
