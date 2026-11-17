"use client";

import { LazyMotion, MotionConfig, domMax } from "motion/react";
import type { ReactNode } from "react";

/**
 * Marketing-only motion context.
 *
 * `domMax` is required for the hero board (drag + shared layout transitions).
 * `MotionConfig reducedMotion="user"` makes every transform animation respect
 * the operating-system preference without each component checking manually.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domMax} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
