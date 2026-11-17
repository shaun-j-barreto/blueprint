"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { Check, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/marketing/blueprint";

const LINES = [
  "Four views. One source of truth.",
  "Owners, admins, members, viewers — clear from day one.",
  "Invite the team without leaving the workspace.",
  "Search stays scoped to what you can actually see.",
];

const MINI_COLUMNS = [
  {
    title: "In progress",
    dot: "bg-amber-500",
    cards: [
      { title: "Invite flow", tag: "Engineering" },
      { title: "Board polish", tag: "Design" },
    ],
  },
  {
    title: "Shipped",
    dot: "bg-emerald-500",
    cards: [
      { title: "Roles & access", tag: "Engineering" },
      { title: "Settings", tag: "Design" },
    ],
  },
];

export default function AuthAside() {
  const reduceMotion = useReducedMotion();
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;

    const timer = window.setInterval(() => {
      setLineIndex((current) => (current + 1) % LINES.length);
    }, 4600);

    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <aside
      aria-label="About BluePrint"
      className="relative hidden min-h-screen overflow-hidden bg-[#070a13] lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-12"
    >
      <div
        aria-hidden="true"
        className="blueprint-grid-dark absolute inset-0 opacity-60"
      />
      <div
        aria-hidden="true"
        className="absolute -top-28 -left-24 h-[380px] w-[380px] rounded-full bg-indigo-600/30 blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="absolute right-[-18%] bottom-[-12%] h-[360px] w-[360px] rounded-full bg-cyan-500/15 blur-[100px]"
      />

      <div className="relative z-10">
        <BrandMark tone="dark" />
      </div>

      <div className="relative z-10 my-8 px-4">
        <div className="relative mx-auto max-w-sm">
          <m.div
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 shadow-2xl backdrop-blur"
          >
            <div className="rounded-xl bg-[#f8fafc] p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#070a13] text-[8px] font-black text-white">
                    A
                  </span>
                  <div>
                    <p className="text-[9px] font-semibold text-slate-900">
                      Atlas launch
                    </p>
                    <p className="text-[6px] tracking-wide text-slate-500 uppercase">
                      Sprint 14
                    </p>
                  </div>
                </div>
                <span className="flex -space-x-1">
                  <span className="h-4 w-4 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 ring-2 ring-white" />
                  <span className="h-4 w-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 ring-2 ring-white" />
                  <span className="h-4 w-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 ring-2 ring-white" />
                </span>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                {MINI_COLUMNS.map((column) => (
                  <div
                    key={column.title}
                    className="rounded-lg border border-slate-200 bg-slate-50/80 p-1.5"
                  >
                    <p className="flex items-center gap-1 text-[7px] font-semibold text-slate-600">
                      <span
                        className={`h-1 w-1 rounded-full ${column.dot}`}
                      />
                      {column.title}
                    </p>
                    <div className="mt-1.5 space-y-1">
                      {column.cards.map((card) => (
                        <div
                          key={card.title}
                          className="rounded-md border border-slate-200 bg-white p-1.5 shadow-sm"
                        >
                          <p className="text-[7px] font-semibold text-slate-800">
                            {card.title}
                          </p>
                          <span className="mt-1 inline-block rounded-full bg-indigo-50 px-1 py-0.5 text-[5px] font-semibold text-indigo-600">
                            {card.tag}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </m.div>

          <m.div
            aria-hidden="true"
            animate={{ y: [0, -7, 0] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.4,
            }}
            className="absolute -top-5 -right-4 flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0b1120]/95 px-2 py-1.5 shadow-xl backdrop-blur"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Check className="h-2.5 w-2.5" aria-hidden="true" />
            </span>
            <span className="text-[8px] font-semibold text-slate-200">
              Invite accepted
            </span>
          </m.div>

          <m.div
            aria-hidden="true"
            animate={{ y: [0, 7, 0] }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.9,
            }}
            className="absolute -bottom-4 -left-4 flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0b1120]/95 px-2 py-1.5 shadow-xl backdrop-blur"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300">
              <ShieldCheck className="h-2.5 w-2.5" aria-hidden="true" />
            </span>
            <span className="text-[8px] font-semibold text-slate-200">
              Role updated
            </span>
          </m.div>
        </div>
      </div>

      <div className="relative z-10">
        <p className="font-mono text-[9px] font-semibold tracking-[0.2em] text-indigo-300 uppercase">
          Workspace / 01
        </p>
        <h2 className="mt-3 text-[2rem] leading-[1.1] font-semibold tracking-[-0.02em] text-white xl:text-[2.35rem]">
          Plan the work.
          <br />
          <span className="text-indigo-300">Ship the blueprint.</span>
        </h2>

        <div className="mt-5 min-h-[42px]">
          <AnimatePresence mode="wait" initial={false}>
            <m.p
              key={lineIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-sm text-[12px] leading-relaxed text-slate-400"
            >
              {LINES[lineIndex]}
            </m.p>
          </AnimatePresence>
        </div>

        <p className="mt-8 flex items-center gap-2 font-mono text-[9px] tracking-[0.12em] text-slate-500 uppercase">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
          Role-aware by default
        </p>
      </div>
    </aside>
  );
}
