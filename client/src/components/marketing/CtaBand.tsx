"use client";

import { ArrowRight, Check, CheckCircle2, Circle, Mail } from "lucide-react";
import Link from "next/link";
import Reveal from "@/components/motion/Reveal";

const POINTS = [
  "No credit card",
  "Start with an empty workspace",
  "Invite the team when you are ready",
];

const FIRST_STEPS = [
  { label: "Name your workspace", done: true },
  { label: "Add the first project", done: true },
  { label: "Invite a teammate", done: false },
];

export default function CtaBand({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <section
      id="get-started"
      className="bg-brand-100 scroll-mt-24 py-24 sm:py-28"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#141235] via-indigo-700 to-cyan-600 px-6 py-12 shadow-[0_50px_120px_-50px_rgba(30,27,75,0.75)] sm:px-10 sm:py-16 lg:px-14 lg:py-20">
            <div
              aria-hidden="true"
              className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.32)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.32)_1px,transparent_1px)] [background-size:42px_42px] opacity-25"
            />
            <div
              aria-hidden="true"
              className="absolute -top-28 -right-14 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-indigo-300/25 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute top-1/2 right-[28%] h-64 w-64 rounded-full border border-white/10"
            />
            <div
              aria-hidden="true"
              className="absolute top-1/2 right-[24%] h-96 w-96 rounded-full border border-white/10"
            />

            <div className="relative flex flex-col items-start justify-between gap-12 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <p className="font-mono text-[10px] font-semibold tracking-[0.2em] text-cyan-200 uppercase">
                  Start here
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-balance text-white sm:text-4xl lg:text-5xl">
                  Your first project is a few clicks away.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-indigo-100 sm:text-base">
                  Create an account, name your first project, and invite the
                  rest of the team when you are ready. No setup call, no
                  migration, no noise.
                </p>

                <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2.5 text-[11px] font-medium text-indigo-100/90 sm:text-xs">
                  {POINTS.map((point) => (
                    <li key={point} className="flex items-center gap-2">
                      <CheckCircle2
                        className="h-4 w-4 text-cyan-200"
                        aria-hidden="true"
                      />
                      {point}
                    </li>
                  ))}
                </ul>

                <div className="mt-9 flex flex-col gap-2.5 sm:flex-row">
                  <Link
                    href={isSignedIn ? "/home" : "/signup"}
                    className="shine group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-indigo-700 shadow-xl shadow-indigo-900/25 transition-all hover:-translate-y-0.5 hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
                  >
                    {isSignedIn ? "Open dashboard" : "Get started free"}
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 bg-white/[0.06] px-6 text-sm font-semibold text-white backdrop-blur transition-colors hover:border-white/60 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
                  >
                    Sign in
                  </Link>
                </div>
              </div>

              <div className="relative hidden w-full max-w-[280px] lg:block">
                <div
                  aria-hidden="true"
                  className="absolute -inset-6 rounded-[2rem] bg-white/10 blur-2xl"
                />

                <div className="relative -rotate-2 rounded-2xl border border-white/20 bg-white/10 p-3 shadow-2xl shadow-indigo-950/40 backdrop-blur">
                  <div className="rounded-xl bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900">
                        Your first project
                      </p>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[8px] font-semibold text-emerald-700">
                        Active
                      </span>
                    </div>

                    <ul className="mt-4 space-y-2.5">
                      {FIRST_STEPS.map((step) => (
                        <li
                          key={step.label}
                          className="flex items-center gap-2"
                        >
                          {step.done ? (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                              <Check
                                className="h-2.5 w-2.5"
                                aria-hidden="true"
                              />
                            </span>
                          ) : (
                            <Circle
                              className="h-4 w-4 text-slate-300"
                              aria-hidden="true"
                            />
                          )}
                          <span
                            className={`text-[10px] font-medium ${
                              step.done
                                ? "text-slate-500 line-through"
                                : "text-slate-800"
                            }`}
                          >
                            {step.label}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[8px] font-semibold text-slate-500">
                        <span>Setup</span>
                        <span>2 of 3</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
                        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-5 -bottom-6 flex rotate-3 items-center gap-2 rounded-xl border border-white/25 bg-[#0b1120]/90 px-3 py-2 shadow-xl backdrop-blur">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                    <Mail className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <span className="text-[10px] font-semibold text-slate-200">
                    Invitation ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
