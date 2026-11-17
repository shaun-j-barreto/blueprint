"use client";

import {
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  MousePointerClick,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { EASE } from "@/components/motion/ease";
import { Eyebrow } from "./blueprint";
import KanbanDemo from "./KanbanDemo";

const HEADLINE_ONE = ["Plan", "the", "work."];
const HEADLINE_TWO = ["Ship", "the", "blueprint."];

const headlineContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.12 },
  },
};

const headlineWord: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE },
  },
};

const TRUST = [
  { icon: CheckCircle2, label: "Free to start" },
  { icon: ShieldCheck, label: "Role-aware by default" },
  { icon: CheckCircle2, label: "No credit card" },
];

export default function Hero({ isSignedIn }: { isSignedIn: boolean }) {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateXTarget = useTransform(pointerY, [-0.5, 0.5], [3, -3]);
  const rotateYTarget = useTransform(pointerX, [-0.5, 0.5], [-4, 4]);
  const rotateX = useSpring(rotateXTarget, {
    stiffness: 120,
    damping: 18,
    mass: 0.6,
  });
  const rotateY = useSpring(rotateYTarget, {
    stiffness: 120,
    damping: 18,
    mass: 0.6,
  });

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType !== "mouse") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(
      (event.clientX - bounds.left) / Math.max(bounds.width, 1) - 0.5,
    );
    pointerY.set(
      (event.clientY - bounds.top) / Math.max(bounds.height, 1) - 0.5,
    );
  };

  const resetTilt = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pt-36 lg:pb-24">
      <div
        aria-hidden="true"
        className="blueprint-grid blueprint-fade absolute inset-0 opacity-80"
      />
      <div
        aria-hidden="true"
        className="absolute -top-24 right-[-10%] h-[460px] w-[460px] rounded-full bg-gradient-to-br from-indigo-400/25 via-sky-300/10 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-[-8%] h-[320px] w-[320px] rounded-full bg-gradient-to-tr from-cyan-300/15 to-transparent blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.02fr_1.08fr] lg:gap-14">
        <div className="min-w-0">
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <Eyebrow>Built for small product teams</Eyebrow>
          </m.div>

          <h1 className="text-brand-900 mt-5 text-[2.7rem] leading-[1.02] font-semibold tracking-[-0.035em] sm:text-6xl lg:text-[4rem]">
            <m.span
              variants={headlineContainer}
              initial="hidden"
              animate="visible"
              className="block"
            >
              {HEADLINE_ONE.map((word, index) => (
                <Fragment key={word}>
                  <m.span variants={headlineWord} className="inline-block">
                    {word}
                  </m.span>
                  {index < HEADLINE_ONE.length - 1 ? " " : null}
                </Fragment>
              ))}
            </m.span>
            <m.span
              variants={headlineContainer}
              initial="hidden"
              animate="visible"
              className="mt-1 block bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent"
            >
              {HEADLINE_TWO.map((word, index) => (
                <Fragment key={word}>
                  <m.span variants={headlineWord} className="inline-block">
                    {word}
                  </m.span>
                  {index < HEADLINE_TWO.length - 1 ? " " : null}
                </Fragment>
              ))}
            </m.span>
          </h1>

          <m.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6, ease: EASE }}
            className="text-brand-700 mt-6 max-w-xl text-[15px] leading-relaxed sm:text-base"
          >
            BluePrint keeps projects, tasks, and people in one shared workspace.
            Board, list, table, and timeline views stay in sync — so you always
            know what is moving, what is blocked, and what comes next.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6, ease: EASE }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              href={isSignedIn ? "/home" : "/signup"}
              className="shine group inline-flex h-12 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-xl shadow-indigo-600/25 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-2xl hover:shadow-indigo-600/30 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {isSignedIn ? "Open your dashboard" : "Create your workspace"}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/login"
              className="border-brand-500 text-brand-800 hover:border-brand-600 inline-flex h-12 items-center rounded-xl border bg-white/70 px-5 text-sm font-semibold backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
            >
              Sign in
            </Link>
          </m.div>

          <m.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-brand-700 mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium"
          >
            {TRUST.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon
                  className="h-3.5 w-3.5 text-emerald-500"
                  aria-hidden="true"
                />
                {label}
              </li>
            ))}
          </m.ul>
        </div>

        <div
          onPointerMove={handlePointerMove}
          onPointerLeave={resetTilt}
          className="relative min-w-0 lg:pl-2"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-brand-700 font-mono text-[9px] font-semibold tracking-[0.2em] uppercase">
              Live product / 01
            </span>
            <span className="text-brand-700 hidden items-center gap-1.5 font-mono text-[9px] font-semibold tracking-[0.18em] uppercase sm:flex">
              <MousePointerClick className="h-3 w-3" aria-hidden="true" />
              Drag · drop · add
            </span>
          </div>

          <m.div
            aria-hidden="true"
            animate={{ y: [0, -7, 0] }}
            transition={{
              duration: 6.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="border-brand-500/80 absolute -top-3 -left-3 z-10 hidden items-center gap-2 rounded-xl border bg-white/95 px-2.5 py-1.5 shadow-xl shadow-slate-900/10 backdrop-blur sm:flex lg:-left-6"
          >
            <span className="flex -space-x-1">
              <span className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 ring-2 ring-white" />
              <span className="h-5 w-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 ring-2 ring-white" />
              <span className="h-5 w-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 ring-2 ring-white" />
            </span>
            <span className="text-brand-800 text-[10px] font-semibold">
              3 teammates online
            </span>
          </m.div>

          <m.div
            aria-hidden="true"
            animate={{ y: [0, 8, 0] }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.6,
            }}
            className="absolute -right-2 -bottom-4 z-10 hidden items-center gap-2 rounded-xl border border-emerald-200 bg-white/95 px-2.5 py-1.5 shadow-xl shadow-slate-900/10 backdrop-blur sm:flex lg:-right-5"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-semibold text-emerald-700">
              Synced just now
            </span>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.28, duration: 0.85, ease: EASE }}
          >
            <m.div
              style={{ rotateX, rotateY, transformPerspective: 1200 }}
              className="relative"
            >
              <KanbanDemo />
            </m.div>
          </m.div>
        </div>
      </div>
    </section>
  );
}
