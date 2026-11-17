"use client";

import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import {
  CalendarRange,
  Check,
  Columns3,
  Gauge,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useRef } from "react";
import Reveal from "@/components/motion/Reveal";
import { SectionHeading } from "./blueprint";

const BENEFITS = [
  {
    icon: Gauge,
    title: "One glance, real answers",
    text: "Overdue, in review, and next up are surfaced before anyone has to ask.",
  },
  {
    icon: ShieldCheck,
    title: "Permissions built in",
    text: "Every panel respects workspace and project roles — no hidden side doors.",
  },
  {
    icon: Search,
    title: "Search that respects access",
    text: "People stay workspace-wide; projects and tasks stay scoped to the caller.",
  },
];

const SUMMARY_STATS = [
  {
    label: "Projects",
    value: "12",
    icon: LayoutDashboard,
    iconTone: "bg-indigo-50 text-indigo-600",
    valueTone: "text-slate-900",
  },
  {
    label: "Open",
    value: "38",
    icon: Columns3,
    iconTone: "bg-sky-50 text-sky-600",
    valueTone: "text-slate-900",
  },
  {
    label: "Overdue",
    value: "3",
    icon: CalendarRange,
    iconTone: "bg-rose-50 text-rose-600",
    valueTone: "text-rose-600",
  },
  {
    label: "Shipped",
    value: "21",
    icon: Check,
    iconTone: "bg-emerald-50 text-emerald-600",
    valueTone: "text-slate-900",
  },
];

const ATTENTION_ROWS = [
  {
    title: "Finalise launch brief",
    project: "Atlas",
    due: "Today",
    chip: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
  {
    title: "Review invite flow",
    project: "Atlas",
    due: "Tomorrow",
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  {
    title: "Ship role permissions",
    project: "Apollo",
    due: "Friday",
    chip: "border-sky-200 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
];

const WEEK = [
  { day: "M", height: 42 },
  { day: "T", height: 64 },
  { day: "W", height: 38 },
  { day: "T", height: 78 },
  { day: "F", height: 56 },
  { day: "S", height: 26 },
  { day: "S", height: 18 },
];

const SIDEBAR = [
  { icon: LayoutDashboard, active: true },
  { icon: Columns3, active: false },
  { icon: CalendarRange, active: false },
  { icon: Users, active: false },
  { icon: Settings, active: false },
];

function DashboardMock() {
  return (
    <div className="relative rounded-[26px] border border-white/10 bg-white/[0.05] p-2.5 shadow-[0_60px_140px_-50px_rgba(0,0,0,0.95)] backdrop-blur">
      <div className="overflow-hidden rounded-[18px] bg-[#f8fafc]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#070a13] text-[10px] font-black text-white">
              B
            </span>
            <div>
              <p className="text-[10px] leading-tight font-semibold text-slate-900">
                Atlas workspace
              </p>
              <p className="text-[8px] text-slate-500">Sprint overview</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden h-6 w-32 items-center gap-1.5 rounded-md bg-slate-100 px-2 text-[8px] text-slate-400 sm:flex">
              <Search className="h-2.5 w-2.5" aria-hidden="true" />
              Search…
            </span>
            <span className="flex -space-x-1">
              <span className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 ring-2 ring-white" />
              <span className="h-5 w-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 ring-2 ring-white" />
              <span className="h-5 w-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 ring-2 ring-white" />
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[42px_1fr] sm:grid-cols-[48px_1fr]">
          <div className="flex flex-col items-center gap-2 border-r border-slate-200 bg-white py-4">
            {SIDEBAR.map(({ icon: Icon, active }, index) => (
              <span
                key={index}
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  active
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "text-slate-400"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            ))}
          </div>

          <div className="p-3.5 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[7px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                  Monday · Sprint 4
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  Good morning, Maya
                </p>
              </div>
              <span className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2 py-1 text-[8px] font-semibold text-white shadow-sm shadow-indigo-600/30">
                <Plus className="h-2.5 w-2.5" aria-hidden="true" />
                New task
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SUMMARY_STATS.map(
                ({ label, value, icon: Icon, iconTone, valueTone }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-200 bg-white p-2.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[7px] font-semibold tracking-wide text-slate-400 uppercase">
                        {label}
                      </p>
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded ${iconTone}`}
                      >
                        <Icon className="h-2.5 w-2.5" aria-hidden="true" />
                      </span>
                    </div>
                    <p className={`mt-1 text-lg font-semibold ${valueTone}`}>
                      {value}
                    </p>
                  </div>
                ),
              )}
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-[1.35fr_1fr]">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[8px] font-semibold tracking-wide text-slate-500 uppercase">
                    Needs attention
                  </p>
                  <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[7px] font-semibold text-rose-600">
                    3 open
                  </span>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {ATTENTION_ROWS.map((row) => (
                    <li
                      key={row.title}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5"
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${row.dot}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[9px] font-semibold text-slate-800">
                          {row.title}
                        </p>
                        <p className="text-[7px] text-slate-500">
                          {row.project}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-1.5 py-0.5 text-[6px] font-semibold ${row.chip}`}
                      >
                        {row.due}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[8px] font-semibold tracking-wide text-slate-500 uppercase">
                    This week
                  </p>
                  <span className="text-[7px] font-medium text-emerald-600">
                    On track
                  </span>
                </div>
                <div className="mt-3 flex h-[86px] items-end justify-between gap-1.5">
                  {WEEK.map((bar, index) => (
                    <div
                      key={index}
                      className="flex w-full flex-col items-center gap-1"
                    >
                      <span
                        className={`w-full rounded-t-[3px] ${
                          index === 3 ? "bg-indigo-600" : "bg-indigo-200"
                        }`}
                        style={{ height: `${bar.height}px` }}
                      />
                      <span className="text-[6px] font-medium text-slate-400">
                        {bar.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-2.5 w-2.5" aria-hidden="true" />
              </span>
              <p className="truncate text-[8px] font-medium text-slate-600">
                Role permissions shipped
              </p>
              <span className="ml-auto shrink-0 text-[7px] text-slate-400">
                2h ago
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const parallax = useTransform(scrollYProgress, [0, 1], [26, -26]);

  return (
    <section
      id="product"
      className="relative scroll-mt-24 overflow-hidden bg-[#070a13]"
    >
      <div
        aria-hidden="true"
        className="blueprint-grid-dark absolute inset-0 opacity-45"
      />
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/3 h-[520px] w-[520px] rounded-full bg-indigo-600/25 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="absolute right-[-10%] bottom-[-20%] h-[480px] w-[480px] rounded-full bg-cyan-500/15 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />

      <div className="relative mx-auto grid w-full max-w-7xl gap-14 px-4 py-24 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-16 lg:py-32">
        <div>
          <Reveal>
            <SectionHeading
              tone="dark"
              eyebrow="The command centre"
              title={
                <>
                  Every project.
                  <br />
                  <span className="bg-gradient-to-r from-indigo-300 via-sky-300 to-cyan-200 bg-clip-text text-transparent">
                    One clear picture.
                  </span>
                </>
              }
              description="The dashboard answers the questions you would otherwise ask in chat: what is overdue, what is in review, and what needs attention today."
            />
          </Reveal>

          <div className="mt-9 space-y-3">
            {BENEFITS.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} delay={0.08 + index * 0.06}>
                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition-colors hover:border-indigo-400/30 hover:bg-white/[0.06]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/25 to-cyan-400/10 text-indigo-200">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      {text}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.26}>
            <div className="mt-9 grid grid-cols-3 gap-4 border-t border-white/10 pt-7">
              {[
                ["4", "project views"],
                ["4", "workspace roles"],
                ["1", "source of truth"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="text-3xl font-semibold tracking-tight text-white">
                    {value}
                  </p>
                  <p className="mt-1 font-mono text-[9px] tracking-[0.14em] text-slate-500 uppercase">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <m.div
          ref={ref}
          style={{ y: reduceMotion ? 0 : parallax }}
          className="relative"
        >
          <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-indigo-500/15 via-transparent to-cyan-400/10 blur-2xl" />

          <p className="relative mb-2 flex items-center justify-end gap-1.5 font-mono text-[9px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
            <span
              aria-hidden="true"
              className="h-1 w-1 rounded-full bg-indigo-400"
            />
            Illustrative workspace
          </p>

          <DashboardMock />

          <m.div
            aria-hidden="true"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-3 -left-4 hidden items-center gap-2 rounded-xl border border-white/10 bg-[#0b1120]/95 px-3 py-2 shadow-xl backdrop-blur sm:flex lg:-left-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-semibold text-slate-200">
              Updated just now
            </span>
          </m.div>

          <m.div
            aria-hidden="true"
            animate={{ y: [0, 8, 0] }}
            transition={{
              duration: 7.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.8,
            }}
            className="absolute -right-3 -bottom-5 hidden items-center gap-2 rounded-xl border border-rose-400/20 bg-[#0b1120]/95 px-3 py-2 shadow-xl backdrop-blur sm:flex lg:-right-5"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
              <Gauge className="h-3 w-3" aria-hidden="true" />
            </span>
            <span className="text-[10px] font-semibold text-slate-200">
              3 tasks need you
            </span>
          </m.div>
        </m.div>
      </div>
    </section>
  );
}
