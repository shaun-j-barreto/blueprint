"use client";

import StoreProvider from "@/app/redux";
import {
  authCardStyles,
  authErrorStyles,
  authInputStyles,
  authLabelStyles,
  authPrimaryButtonStyles,
} from "@/components/auth/styles";
import { useSession } from "@/lib/auth-client";
import { getApiErrorMessage } from "@/lib/utils";
import {
  useCompleteOnboardingMutation,
  useGetMeQuery,
  useGetProjectsQuery,
} from "@/state/api";
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

const DISPLAY_NAME_NOTE = "You can change your display name later.";

/**
 * First-run screen. It is the only page that clears `onboardedAt`, so it sits
 * outside the dashboard shell (otherwise the gate would redirect to itself).
 */
const OnboardingPage = () => {  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const { data: me, isLoading: isMeLoading } = useGetMeQuery(undefined, {
    skip: !session?.user,
  });
  const { data: projects = [] } = useGetProjectsQuery(undefined, {
    skip: !session?.user,
  });
  const [completeOnboarding, { isLoading: isSaving }] =
    useCompleteOnboardingMutation();

  const [error, setError] = useState("");

  const isAlreadyOnboarded = Boolean(me?.user?.onboardedAt);

  useEffect(() => {
    if (isSessionPending) return;
    if (!session?.user) {
      router.replace("/login?next=%2Fonboarding");
      return;
    }
    if (isAlreadyOnboarded) router.replace("/home");
  }, [isSessionPending, session?.user, isAlreadyOnboarded, router]);

  const finish = async (form: HTMLFormElement | null) => {
    setError("");

    const username = form
      ? String(new FormData(form).get("username") ?? "").trim()
      : undefined;
    const profilePictureUrl = form
      ? String(new FormData(form).get("profilePictureUrl") ?? "").trim()
      : undefined;

    try {
      await completeOnboarding({
        ...(username ? { username } : {}),
        ...(profilePictureUrl ? { profilePictureUrl } : {}),
      }).unwrap();

      router.replace("/home");
      router.refresh();
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          "Could not save your profile. Please try again.",
        ),
      );
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void finish(event.currentTarget);
  };

  if (isSessionPending || isMeLoading || (!me && session?.user)) {
    return (
      <div className={authCardStyles}>
        <div className="text-brand-700 flex items-center gap-2 text-xs">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading your workspace…
        </div>
      </div>
    );
  }

  const displayName = me?.user?.username ?? session?.user?.name ?? "";
  const firstName = displayName.split(/\s+/)[0] || displayName;

  return (
    <div className={authCardStyles}>
      <span className="border-brand-500/80 bg-brand-200 text-brand-700 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold">
        <Sparkles className="h-3 w-3 text-indigo-500" aria-hidden="true" />
        One last step
      </span>

      <h1 className="text-brand-900 mt-4 text-2xl font-semibold tracking-tight">
        Welcome, {firstName}
      </h1>
      <p className="text-brand-700 mt-1.5 text-xs leading-relaxed">
        Confirm how your name appears to the team, then jump into your
        workspace.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="onboarding-username" className={authLabelStyles}>
            Display name
          </label>
          <input
            id="onboarding-username"
            name="username"
            type="text"
            required
            minLength={3}
            maxLength={40}
            defaultValue={displayName}
            autoComplete="username"
            className={authInputStyles}
            disabled={isSaving}
          />
          <p className="text-brand-700 mt-1 text-[11px]">{DISPLAY_NAME_NOTE}</p>
        </div>

        <div>
          <label
            htmlFor="onboarding-profile-picture"
            className={authLabelStyles}
          >
            Profile image URL <span className="font-normal">(optional)</span>
          </label>
          <input
            id="onboarding-profile-picture"
            name="profilePictureUrl"
            type="text"
            placeholder="/i1.jpg or https://…"
            className={authInputStyles}
            disabled={isSaving}
          />
        </div>

        {projects.length > 0 && (
          <div className="border-brand-500/70 bg-brand-200/60 rounded-xl border p-3">
            <p className="text-brand-800 text-[11px] font-semibold">
              You have access to{" "}
              {projects.length === 1
                ? "this project"
                : `${projects.length} projects`}
            </p>
            <ul className="mt-2 space-y-1.5">
              {projects.slice(0, 5).map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-brand-800 hover:text-brand-900 flex items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-xs font-medium transition-colors hover:bg-white/60"
                  >
                    <span className="truncate">{project.name}</span>
                    <ArrowRight
                      className="h-3.5 w-3.5 shrink-0"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p role="alert" className={authErrorStyles}>
            {error}
          </p>
        )}

        <button
          type="submit"
          className={authPrimaryButtonStyles}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          )}
          {isSaving ? "Saving…" : "Finish setup"}
        </button>

        <button
          type="button"
          onClick={() => void finish(null)}
          disabled={isSaving}
          className="text-brand-700 hover:text-brand-900 w-full cursor-pointer text-center text-xs font-medium underline-offset-2 hover:underline disabled:opacity-60"
        >
          Skip for now
        </button>
      </form>
    </div>
  );
};

/**
 * This route sits outside the dashboard shell, so it has to bring its own
 * Redux store: the first-run screen reads the current user through RTK Query.
 */
export default function OnboardingRoute() {
  return (
    <StoreProvider>
      <OnboardingPage />
    </StoreProvider>
  );
}
