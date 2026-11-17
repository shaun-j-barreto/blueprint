"use client";

import {
  AnimatePresence,
  m,
  useMotionValueEvent,
  useScroll,
  useSpring,
} from "motion/react";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "./blueprint";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#product", label: "Product" },
  { href: "#workflow", label: "Workflow" },
  { href: "#get-started", label: "Get started" },
];

const linkClass =
  "group relative inline-flex h-9 items-center text-[13px] font-medium text-brand-700 transition-colors hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 rounded-md px-1";

const primaryCta =
  "shine inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40";

export default function Nav({
  isSignedIn,
  isPending,
}: {
  isSignedIn: boolean;
  isPending: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    restDelta: 0.001,
  });

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 12);
  });

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // If the viewport grows past the mobile breakpoint while the menu is open,
  // close it so the page never stays scroll-locked behind a hidden menu.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (desktop.matches) setOpen(false);
    };

    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <m.div
        style={{ scaleX: progress }}
        className="h-0.5 origin-left bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-300"
      />

      <div
        className={`transition-all duration-300 ${
          scrolled
            ? "border-brand-500/70 bg-brand-100/95 border-b shadow-[0_12px_36px_-18px_rgba(7,10,19,0.28)] backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div
          className={`mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-300 sm:px-6 ${
            scrolled ? "h-14" : "h-16"
          }`}
        >
          <Link
            href="/"
            aria-label="BluePrint home"
            className="rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
          >
            <BrandMark />
          </Link>

          <nav
            aria-label="Landing"
            className="hidden items-center gap-6 md:flex"
          >
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} className={linkClass}>
                {link.label}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-1.5 h-px origin-left scale-x-0 bg-indigo-500 transition-transform duration-300 group-hover:scale-x-100"
                />
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {isPending ? (
              <span
                aria-hidden="true"
                className="bg-brand-500/60 h-9 w-24 animate-pulse rounded-lg"
              />
            ) : isSignedIn ? (
              <Link href="/home" className={primaryCta}>
                Open dashboard
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-brand-800 hover:bg-brand-300 hover:text-brand-900 inline-flex h-9 items-center rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
                >
                  Log in
                </Link>
                <Link href="/signup" className={primaryCta}>
                  Start free
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
            className="border-brand-500/80 bg-brand-100 text-brand-800 hover:bg-brand-300 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none md:hidden"
          >
            {open ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <m.div
            id="landing-mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="border-brand-500/70 bg-brand-100/95 absolute inset-x-0 top-full border-b shadow-2xl backdrop-blur-xl md:hidden"
          >
            <nav
              aria-label="Mobile landing"
              className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-4"
            >
              {LINKS.map((link, index) => (
                <m.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * index, duration: 0.22 }}
                  className="text-brand-800 hover:bg-brand-300 hover:text-brand-900 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors"
                >
                  {link.label}
                  <ArrowRight
                    className="text-brand-700 h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                </m.a>
              ))}

              <div className="border-brand-500/70 mt-2 grid grid-cols-2 gap-2 border-t pt-3">
                {isPending ? (
                  <span className="bg-brand-500/60 col-span-2 h-10 animate-pulse rounded-xl" />
                ) : isSignedIn ? (
                  <Link
                    href="/home"
                    onClick={() => setOpen(false)}
                    className="col-span-2 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-xs font-semibold text-white"
                  >
                    Open dashboard
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="border-brand-500 text-brand-800 inline-flex h-10 items-center justify-center rounded-xl border text-xs font-semibold"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setOpen(false)}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-xs font-semibold text-white"
                    >
                      Start free
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
