"use client";

import { useGetMeQuery } from "@/state/api";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Sends members who have not finished the first-run screen to `/onboarding`.
 * Lives inside the dashboard shell so every protected page is covered by one
 * check. Failures are left to RequireAuth and the API's 401 handling.
 */
const RequireOnboarding = ({ children }: { children: React.ReactNode }) => {
  const { data, isLoading, isError } = useGetMeQuery();
  const router = useRouter();
  const isPending = data?.user?.onboardedAt === null;

  useEffect(() => {
    if (isLoading || isError || !isPending) return;
    router.replace("/onboarding");
  }, [isLoading, isError, isPending, router]);

  if (isLoading || isPending) {
    return (
      <div className="bg-brand-100 text-brand-700 flex min-h-screen items-center justify-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>Loading your workspace…</span>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireOnboarding;
