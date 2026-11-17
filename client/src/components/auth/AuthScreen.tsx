"use client";

import { m } from "motion/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { EASE } from "@/components/motion/ease";
import MotionProvider from "@/components/motion/MotionProvider";
import { BrandMark } from "@/components/marketing/blueprint";
import AuthAside from "./AuthAside";

export default function AuthScreen({
  children,
  width = "md",
}: {
  children: ReactNode;
  width?: "md" | "lg";
}) {
  return (
    <MotionProvider>
      <div className="brand-light grid min-h-screen bg-brand-200 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <AuthAside />

        <div className="relative flex min-h-screen flex-col overflow-hidden">
          <div
            aria-hidden="true"
            className="blueprint-grid blueprint-fade absolute inset-0 opacity-60"
          />
          <div
            aria-hidden="true"
            className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-indigo-300/15 blur-3xl"
          />

          <header className="relative flex items-center justify-between px-5 py-5 sm:px-8 lg:hidden">
            <Link
              href="/"
              aria-label="BluePrint home"
              className="rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
            >
              <BrandMark />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 transition-colors hover:text-brand-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back home
            </Link>
          </header>

          <div className="relative hidden justify-end px-8 pt-6 lg:flex">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 transition-colors hover:text-brand-900 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to home
            </Link>
          </div>

          <main className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
            <m.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE }}
              className={`w-full ${width === "lg" ? "max-w-lg" : "max-w-[430px]"}`}
            >
              {children}
            </m.div>
          </main>

          <footer className="relative px-6 pb-6 text-center text-[10px] text-brand-700">
            <p>
              BluePrint keeps projects, tasks, and your team in one shared
              workspace.
            </p>
          </footer>
        </div>
      </div>
    </MotionProvider>
  );
}
