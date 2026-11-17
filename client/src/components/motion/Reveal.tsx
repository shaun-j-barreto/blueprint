"use client";

import { m, useInView, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { EASE } from "./ease";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Seconds. Use a small stagger when several Reveals share a row. */
  delay?: number;
  y?: number;
  once?: boolean;
};

/**
 * Fades and lifts its children the first time they enter the viewport.
 * Reduced-motion users get the final state immediately.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-12% 0px -12% 0px" });
  const reduceMotion = useReducedMotion();
  const visible = inView || Boolean(reduceMotion);

  return (
    <m.div
      ref={ref}
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.62, delay, ease: EASE }}
    >
      {children}
    </m.div>
  );
}
