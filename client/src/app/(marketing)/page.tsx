"use client";

import { useSession } from "@/lib/auth-client";
import {
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  LayoutDashboard,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

const FEATURES = [
  {
    icon: FolderKanban,
    title: "Projects with a plan",
    description:
      "Keep scope, dates, and progress together. Board, list, table, and timeline views all read from the same source of truth.",
  },
  {
    icon: LayoutDashboard,
    title: "A dashboard that answers",
    description:
      "See what is overdue, what is in review, and what needs attention today without digging through every project.",
  },
  {
    icon: Users,
    title: "One shared workspace",
    description:
      "Bring your team, their tasks, and their workload into one place so nobody has to ask for a status update.",
  },
];

const PREVIEW_STATS = [
  { label: "Projects", value: "12", hint: "4 active" },
  { label: "Open tasks", value: "38", hint: "9 in progress" },
  { label: "Overdue", value: "3", hint: "2 projects" },
];

const PREVIEW_TASKS = [
  {
    title: "Finalise onboarding flow",
    project: "Mobile app",
    status: "In progress",
    tone: "bg-amber-500",
  },
  {
    title: "Review Q3 launch checklist",
    project: "Website refresh",
    status: "In review",
    tone: "bg-sky-500",
  },
  {
    title: "Ship workspace permissions",
    project: "Platform",
    status: "To do",
    tone: "bg-slate-400",
  },
];

const MarketingPage = () => {
  const { data: session, isPending } = useSession();
  const isSignedIn = Boolean(session?.user);

  return (
    <div className="bg-brand-100 text-brand-800 flex min-h-screen flex-col">
      <header className="border-brand-500/70 bg-brand-100/90 supports-[backdrop-filter]:bg-brand-100/70 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
          >
            <span className="border-brand-500/80 bg-slate-900 flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold text-white">
              B
            </span>
            <span className="text-brand-900 text-base font-semibold tracking-tight">
              BluePrint
            </span>
          </Link>

          <nav
            aria-label="Landing"
            className="text-brand-700 hidden items-center gap-6 text-sm font-medium md:flex"
          >
            <a href="#features" className="hover:text-brand-900 transition-colors">
              Features
            </a>
            <a href="#preview" className="hover:text-brand-900 transition-colors">
              Product
            </a>
            <a href="#get-started" className="hover:text-brand-900 transition-colors">
              Get started
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {isPending ? (
              <span className="text-brand-700 flex h-9 items-center gap-1.5 px-2 text-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Loading…
              </span>
            ) : isSignedIn ? (
              <Link
                href="/home"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
              >
                Open dashboard
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-brand-800 hover:bg-brand-300 inline-flex h-9 items-center rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-9 items-center rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-14 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pt-20">
          <div>
            <span className="border-brand-500/80 bg-brand-200 text-brand-700 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold">
              <Sparkles className="h-3 w-3 text-indigo-500" aria-hidden="true" />
              Built for small teams that ship
            </span>

            <h1 className="text-brand-900 mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              Turn a messy sprint into a{" "}
              <span className="text-indigo-600">clear plan.</span>
            </h1>

            <p className="text-brand-700 mt-5 max-w-xl text-base leading-relaxed">
              BluePrint keeps projects, tasks, and people in one shared
              workspace — so you always know what is moving, what is blocked,
              and what comes next.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={isSignedIn ? "/home" : "/signup"}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {isSignedIn ? "Go to your dashboard" : "Create your workspace"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="border-brand-500 text-brand-800 hover:bg-brand-300 inline-flex h-11 items-center rounded-lg border px-5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
              >
                Sign in
              </Link>
            </div>

            <ul className="text-brand-700 mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                No credit card
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                Start with an empty workspace
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                Your data stays yours
              </li>
            </ul>
          </div>

          <div id="preview" className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-indigo-500/15 via-sky-400/10 to-transparent blur-2xl"
            />
            <div className="border-brand-500/80 bg-brand-200 relative overflow-hidden rounded-2xl border p-4 shadow-xl shadow-slate-900/5 sm:p-5">
              <div className="border-brand-500/70 bg-brand-100 flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold text-white">
                    B
                  </span>
                  <span className="text-brand-900 text-xs font-semibold">
                    Sprint overview
                  </span>
                </div>
                <span className="border-brand-500/70 bg-brand-200 text-brand-700 rounded-full border px-2 py-0.5 text-[10px] font-semibold">
                  Live
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {PREVIEW_STATS.map((stat, index) => (
                  <div
                    key={stat.label}
                    className="border-brand-500/70 bg-brand-100 rounded-xl border p-3"
                  >
                    <p className="text-brand-700 text-[9px] font-semibold tracking-[0.08em] uppercase">
                      {stat.label}
                    </p>
                    <p
                      className={`mt-1.5 text-xl font-semibold tracking-tight ${
                        index === 2 ? "text-red-600" : "text-brand-900"
                      }`}
                    >
                      {stat.value}
                    </p>
                    <p className="text-brand-700 mt-0.5 text-[10px]">{stat.hint}</p>
                  </div>
                ))}
              </div>

              <div className="border-brand-500/70 bg-brand-100 mt-3 rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-brand-900 text-[11px] font-semibold">My tasks</p>
                  <span className="text-brand-700 text-[10px] font-medium">3 of 3</span>
                </div>
                <div className="divide-brand-500/60 mt-1 divide-y">
                  {PREVIEW_TASKS.map((task) => (
                    <div key={task.title} className="flex items-center gap-2.5 py-2.5">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${task.tone}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-brand-900 truncate text-[11px] font-semibold">
                          {task.title}
                        </p>
                        <p className="text-brand-700 mt-0.5 truncate text-[9px]">
                          {task.project}
                        </p>
                      </div>
                      <span className="border-brand-500/70 bg-brand-200 text-brand-700 shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold">
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="border-brand-500/70 bg-brand-200/60 border-y"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-brand-700 text-[10px] font-semibold tracking-[0.08em] uppercase">
                Everything in one place
              </p>
              <h2 className="text-brand-900 mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Less status chasing. More shipping.
              </h2>
              <p className="text-brand-700 mt-3 text-sm leading-relaxed">
                BluePrint is deliberately small: a clear dashboard, flexible
                project views, and a directory that keeps the team connected.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className="border-brand-500/80 bg-brand-100 rounded-2xl border p-5"
                >
                  <span className="border-brand-500/70 bg-brand-300 text-brand-800 flex h-9 w-9 items-center justify-center rounded-xl border">
                    <feature.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="text-brand-900 mt-4 text-sm font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-brand-700 mt-2 text-xs leading-relaxed">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="get-started" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="border-brand-500/80 bg-slate-900 relative overflow-hidden rounded-2xl border px-6 py-10 sm:px-10">
            <div
              aria-hidden="true"
              className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-indigo-500/25 blur-3xl"
            />
            <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  Your first project is a few clicks away.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Create an account, name your first project, and invite the
                  rest of the team when you are ready.
                </p>
              </div>
              <Link
                href={isSignedIn ? "/home" : "/signup"}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-indigo-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-400 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
              >
                {isSignedIn ? "Open dashboard" : "Get started free"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-brand-500/70 border-t">
        <div className="text-brand-700 mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} BluePrint. Built for focused teams.</p>
          <div className="flex items-center gap-4 font-medium">
            <Link href="/login" className="hover:text-brand-900 transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-brand-900 transition-colors">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingPage;
