"use client";

import StoreProvider from "@/app/redux";
import {
  authCardStyles,
  authErrorStyles,
  authInputStyles,
  authLabelStyles,
} from "@/components/auth/styles";
import { BrandMark } from "@/components/marketing/blueprint";
import { useSession } from "@/lib/auth-client";
import { getApiErrorMessage } from "@/lib/utils";
import {
  useCompleteOnboardingMutation,
  useGetMeQuery,
  useGetProjectsQuery,
} from "@/state/api";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock3,
  ListChecks,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

const DISPLAY_NAME_NOTE = "You can change your display name later.";

const STEPS = [
  {
    title: "Your profile",
    detail: "Name and photo, so the team knows who you are.",
  },
  {
    title: "Workspace",
    detail: "Start empty. Create your first project in the app.",
  },
  {
    title: "Dashboard",
    detail: "Land on your home view with everything in one place.",
  },
];

const NEXT_UP = [
  "Create your first project",
  "Invite the team from Settings",
  "Choose a board, list, table, or timeline view",
];

const initialsFor = (value: string): string =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "B";

/**
 * First-run screen. It is the only page that clears `onboardedAt`, so it sits
 * outside the dashboard shell (otherwise the gate would redirect to itself).
 */
const OnboardingPage = () => {
  const router = useRouter();
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
  const fallbackName = me?.user?.username ?? session?.user?.name ?? "";
  // `null` means "follow the loaded profile"; typing takes over immediately.
  const [draftName, setDraftName] = useState<string | null>(null);
  const name = draftName ?? fallbackName;

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
      <div className="flex min-h-screen items-center justify-center bg-brand-200 px-4">
        <div className={authCardStyles}>
          <div className="flex items-center gap-2 text-xs text-brand-700">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading your workspace…
          </div>
        </div>
      </div>
    );
  }

  const previewName = name.trim() || fallbackName;
  const firstName = previewName.split(/\s+/)[0] || previewName;

  return (
    <div className="relative min-h-screen bg-brand-200">
      <div
        aria-hidden="true"
        className="blueprint-grid blueprint-fade absolute inset-0 opacity-50"
      />

      <header className="relative border-b border-brand-500/70 bg-brand-100/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            aria-label="BluePrint home"
            className="rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
          >
            <BrandMark />
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-brand-500/70 bg-brand-200 px-2.5 py-1 text-[10px] font-semibold text-brand-700 sm:flex">
              <Clock3 className="h-3 w-3" aria-hidden="true" />
              About 30 seconds
            </span>
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">
              Final step
            </span>
          </div>
        </div>
      </header>

      <main className="relative mx-auto grid w-full max-w-5xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[270px_1fr] lg:items-start">
        <aside className="order-2 rounded-2xl border border-brand-500/80 bg-brand-100 p-5 lg:order-1">
          <p className="font-mono text-[9px] font-semibold tracking-[0.18em] text-brand-700 uppercase">
            Your setup
          </p>
          <h2 className="mt-1.5 text-sm font-semibold text-brand-900">
            What&rsquo;s ahead
          </h2>

          <ol className="mt-5 space-y-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
                    index === 0
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-brand-500 bg-brand-200 text-brand-700"
                  }`}
                >
                  {index === 0 ? (
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
                <div>
                  <p
                    className={`text-[11px] font-semibold ${
                      index === 0 ? "text-brand-900" : "text-brand-700"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-brand-700">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-xl border border-brand-500/70 bg-brand-200/60 p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold text-brand-800">
              <BadgeCheck
                className="h-3.5 w-3.5 text-indigo-500"
                aria-hidden="true"
              />
              What happens next
            </p>
            <ul className="mt-2 space-y-1.5">
              {NEXT_UP.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-1.5 text-[10px] leading-relaxed text-brand-700"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-400"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="order-1 rounded-2xl border border-brand-500/80 bg-brand-100 p-6 shadow-sm sm:p-7 lg:order-2">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-brand-700 uppercase">
            One last step
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-brand-900">
            Welcome, {firstName}
          </h1>
          <p className="mt-1.5 max-w-md text-xs leading-relaxed text-brand-700">
            Confirm how your name appears to the team, then jump into your
            workspace.
          </p>

          <div className="mt-5 flex items-center gap-4 rounded-2xl border border-brand-500/70 bg-brand-200/60 p-4">
            <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-indigo-500 to-cyan-400 text-lg font-bold text-white ring-4 ring-brand-100">
              {initialsFor(previewName)}
              <span className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-brand-100 bg-white text-indigo-600">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
              </span>
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[9px] font-semibold tracking-[0.14em] text-brand-700 uppercase">
                Profile preview
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-brand-900">
                {previewName || "Your name"}
              </p>
              <p className="mt-0.5 text-[11px] text-brand-700">
                This is how teammates will see you.
              </p>
            </div>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label htmlFor="onboarding-username" className={authLabelStyles}>
                  Display name
                </label>
                <span className="text-[10px] text-brand-700 tabular-nums">
                  {name.length}/40
                </span>
              </div>
              <div className="relative">
                <User
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-brand-700/70"
                  aria-hidden="true"
                />
                <input
                  id="onboarding-username"
                  name="username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={40}
                  value={name}
                  onChange={(event) => setDraftName(event.target.value)}
                  autoComplete="username"
                  className={`${authInputStyles} pl-10`}
                  disabled={isSaving}
                />
              </div>
              <p className="mt-1 text-[11px] text-brand-700">
                {DISPLAY_NAME_NOTE}
              </p>
            </div>

            <div>
              <label
                htmlFor="onboarding-profile-picture"
                className={authLabelStyles}
              >
                Profile image URL{" "}
                <span className="font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Camera
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-brand-700/70"
                  aria-hidden="true"
                />
                <input
                  id="onboarding-profile-picture"
                  name="profilePictureUrl"
                  type="text"
                  placeholder="/i1.jpg or https://…"
                  className={`${authInputStyles} pl-10`}
                  disabled={isSaving}
                />
              </div>
            </div>

            {projects.length > 0 && (
              <div className="rounded-xl border border-brand-500/70 bg-brand-200/60 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-800">
                  <ListChecks
                    className="h-3.5 w-3.5 text-indigo-500"
                    aria-hidden="true"
                  />
                  You have access to{" "}
                  {projects.length === 1
                    ? "this project"
                    : `${projects.length} projects`}
                </p>
                <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                  {projects.slice(0, 5).map((project) => (
                    <li key={project.id}>
                      <Link
                        href={`/projects/${project.id}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-transparent px-2 py-1.5 text-[11px] font-medium text-brand-800 transition-colors hover:border-brand-500/70 hover:bg-brand-100 hover:text-brand-900"
                      >
                        <span className="truncate">{project.name}</span>
                        <ArrowRight
                          className="h-3.5 w-3.5 shrink-0 text-brand-700"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
                {projects.length > 5 && (
                  <p className="mt-1 px-2 text-[10px] text-brand-700">
                    +{projects.length - 5} more in your dashboard
                  </p>
                )}
              </div>
            )}

            {error && (
              <p role="alert" className={authErrorStyles}>
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                )}
                {isSaving ? "Saving…" : "Finish setup"}
              </button>
              <button
                type="button"
                onClick={() => void finish(null)}
                disabled={isSaving}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-brand-500 bg-brand-100 px-4 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-300 hover:text-brand-900 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none disabled:opacity-60"
              >
                Skip for now
              </button>
            </div>
          </form>
        </section>
      </main>
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
