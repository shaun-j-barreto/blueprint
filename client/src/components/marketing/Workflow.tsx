"use client";

import { m, useScroll, useSpring } from "motion/react";
import {
  CalendarRange,
  Check,
  Columns3,
  Compass,
  List,
  Plus,
  Rocket,
  Route,
  Table2,
} from "lucide-react";
import { useRef } from "react";
import Reveal from "@/components/motion/Reveal";
import { SectionHeading } from "./blueprint";

const STEPS = [
  {
    number: "01",
    title: "Capture the work",
    description:
      "Drop tasks, files, and decisions into a project. Nothing lives in a thread you have to scroll back through.",
    icon: Compass,
    accent: "from-indigo-500 via-indigo-400 to-sky-400",
    label: "Quick capture",
  },
  {
    number: "02",
    title: "Plan the shape",
    description:
      "Set owners, dates, and priorities. Switch between board, list, table, and timeline without duplicating anything.",
    icon: Route,
    accent: "from-sky-500 via-sky-400 to-cyan-400",
    label: "One shared plan",
  },
  {
    number: "03",
    title: "Ship with context",
    description:
      "Move work to done, keep the team in sync, and leave a trail the next project can learn from.",
    icon: Rocket,
    accent: "from-emerald-500 via-emerald-400 to-teal-400",
    label: "Shipped, with history",
  },
];

const PRINCIPLES = [
  "One dataset behind every view",
  "No duplicate boards to maintain",
  "Context travels with the task",
];

const VIEW_ICONS = [Columns3, List, Table2, CalendarRange];

function CapturePreview() {
  return (
    <div className="border-brand-500/70 bg-brand-200/70 rounded-xl border p-3">
      <div className="border-brand-500/60 flex items-center gap-2 rounded-lg border bg-white px-2.5 py-2 shadow-sm">
        <Plus
          className="h-3.5 w-3.5 shrink-0 text-indigo-500"
          aria-hidden="true"
        />
        <span className="text-brand-800 truncate text-[11px] font-medium">
          Draft the launch brief
        </span>
        <span className="border-brand-500/70 text-brand-700 ml-auto rounded border px-1 font-mono text-[8px]">
          ⏎
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[9px] font-semibold text-indigo-700">
          Design
        </span>
        <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[9px] font-semibold text-rose-700">
          High
        </span>
        <span className="border-brand-500/70 text-brand-700 rounded-full border bg-white px-2 py-0.5 text-[9px] font-semibold">
          Maya
        </span>
      </div>
    </div>
  );
}

function PlanPreview() {
  return (
    <div className="border-brand-500/70 bg-brand-200/70 rounded-xl border p-3">
      <div className="border-brand-500/60 flex items-center justify-between gap-2 rounded-lg border bg-white px-2 py-1.5 shadow-sm">
        <div className="flex items-center gap-1">
          {VIEW_ICONS.map((Icon, index) => (
            <span
              key={index}
              className={`flex h-5 w-5 items-center justify-center rounded-md ${
                index === 3
                  ? "bg-sky-50 text-sky-600 ring-1 ring-sky-200"
                  : "text-brand-700"
              }`}
            >
              <Icon className="h-2.5 w-2.5" aria-hidden="true" />
            </span>
          ))}
        </div>
        <span className="text-brand-700 font-mono text-[8px] tracking-[0.1em] uppercase">
          Synced
        </span>
      </div>
      <div className="mt-2.5 space-y-1.5">
        {[
          { label: "Design", start: 2, width: 32, tone: "bg-indigo-500" },
          { label: "Build", start: 24, width: 44, tone: "bg-sky-500" },
          { label: "Review", start: 56, width: 26, tone: "bg-amber-500" },
        ].map((bar) => (
          <div key={bar.label} className="flex items-center gap-2">
            <span className="text-brand-700 w-9 text-right text-[8px] font-medium">
              {bar.label}
            </span>
            <div className="bg-brand-300 relative h-2 flex-1 rounded-full">
              <span
                className={`absolute inset-y-0 rounded-full ${bar.tone}`}
                style={{ left: `${bar.start}%`, width: `${bar.width}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShipPreview() {
  return (
    <div className="border-brand-500/70 bg-brand-200/70 rounded-xl border p-3">
      <div className="border-brand-500/60 flex items-center gap-2.5 rounded-lg border bg-white p-2.5 shadow-sm">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-3 w-3" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-brand-900 truncate text-[10px] font-semibold">
            Role permissions
          </p>
          <p className="text-brand-700 text-[8px]">Shipped to production</p>
        </div>
        <span className="ml-auto rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-700">
          Done
        </span>
      </div>
      <div className="mt-2.5">
        <div className="text-brand-700 flex items-center justify-between text-[8px] font-semibold">
          <span>Launch readiness</span>
          <span>100%</span>
        </div>
        <div className="bg-brand-300 mt-1 h-1.5 rounded-full">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
        </div>
      </div>
    </div>
  );
}

const PREVIEWS = [CapturePreview, PlanPreview, ShipPreview];

export default function Workflow() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 0.85", "end 0.45"],
  });
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 24,
    restDelta: 0.001,
  });

  return (
    <section
      id="workflow"
      className="relative scroll-mt-24 overflow-hidden bg-[linear-gradient(180deg,#0b1120_0%,#0a0f1c_58%,#070a13_100%)]"
    >
      <div
        aria-hidden="true"
        className="blueprint-grid-dark absolute inset-0 opacity-40"
      />
      <div
        aria-hidden="true"
        className="absolute -top-24 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="absolute right-[-8%] bottom-[8%] h-[340px] w-[340px] rounded-full bg-cyan-400/10 blur-[100px]"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
        <Reveal>
          <SectionHeading
            tone="dark"
            align="center"
            eyebrow="How it flows"
            title="From first sketch to shipped."
            description="Three moves, one workspace. BluePrint keeps the plan close to the work so the hand-offs stay small."
          />
        </Reveal>

        <div ref={trackRef} className="relative mt-16 lg:mt-20">
          <div
            aria-hidden="true"
            className="absolute top-[27px] right-[16.66%] left-[16.66%] hidden h-px bg-white/10 lg:block"
          >
            <m.div
              style={{ scaleX }}
              className="h-px origin-left bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3 lg:gap-6">
            {STEPS.map((step, index) => {
              const Preview = PREVIEWS[index];

              return (
                <Reveal key={step.number} delay={index * 0.08}>
                  <div className="flex h-full flex-col">
                    <div className="mb-6 flex justify-center">
                      <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-[#0b1120] font-mono text-xs font-semibold tracking-[0.08em] text-indigo-200 shadow-[0_0_0_6px_rgba(11,17,32,0.9)]">
                        {step.number}
                      </span>
                    </div>

                    <article className="group relative flex flex-1 flex-col overflow-hidden rounded-[26px] border border-white/70 bg-white p-6 shadow-[0_36px_70px_-32px_rgba(0,0,0,0.65)] transition-transform duration-300 hover:-translate-y-1">
                      <div
                        aria-hidden="true"
                        className="blueprint-paper pointer-events-none absolute inset-0 opacity-70"
                      />
                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${step.accent}`}
                      />

                      <div className="relative flex flex-1 flex-col">
                        <span className="border-brand-500/70 bg-brand-200 flex h-11 w-11 items-center justify-center rounded-2xl border text-indigo-600 transition-colors group-hover:border-indigo-200 group-hover:bg-indigo-50">
                          <step.icon className="h-5 w-5" aria-hidden="true" />
                        </span>

                        <h3 className="text-brand-900 mt-5 text-lg font-semibold tracking-tight">
                          {step.title}
                        </h3>
                        <p className="text-brand-700 mt-2 text-sm leading-relaxed">
                          {step.description}
                        </p>

                        <div className="mt-5 flex-1">
                          <p className="text-brand-700 mb-2 font-mono text-[8px] font-semibold tracking-[0.16em] uppercase">
                            {step.label}
                          </p>
                          <Preview />
                        </div>
                      </div>
                    </article>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        <Reveal delay={0.12}>
          <ul className="mt-14 grid gap-3 border-t border-white/10 pt-8 sm:grid-cols-3">
            {PRINCIPLES.map((principle) => (
              <li
                key={principle}
                className="flex items-center justify-center gap-2 text-center text-xs font-medium text-slate-300"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                {principle}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
