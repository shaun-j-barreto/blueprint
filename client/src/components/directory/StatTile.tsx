import type { ReactNode } from "react";
import { PANEL_CLASS } from "./styles";

type StatTone = "default" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<StatTone, { value: string; icon: string }> = {
  default: {
    value: "text-brand-900",
    icon: "border-brand-500/70 bg-brand-300 text-brand-800",
  },
  success: {
    value: "text-emerald-600 dark:text-emerald-400",
    icon: "border-emerald-200/80 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  warning: {
    value: "text-amber-600 dark:text-amber-400",
    icon: "border-amber-200/80 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400",
  },
  danger: {
    value: "text-red-600 dark:text-red-400",
    icon: "border-red-200/80 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
  },
};

type StatTileProps = {
  label: string;
  value: number | string;
  hint: string;
  icon: ReactNode;
  tone?: StatTone;
};

export const StatTile = ({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: StatTileProps) => {
  const toneClasses = TONE_CLASSES[tone];

  return (
    <div className={`${PANEL_CLASS} p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-brand-700 text-[10px] font-semibold tracking-[0.08em] uppercase">
            {label}
          </p>
          <p
            className={`mt-2 text-3xl font-semibold tracking-tight ${toneClasses.value}`}
          >
            {value}
          </p>
          <p className="text-brand-700 mt-1 text-[11px] font-medium">{hint}</p>
        </div>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${toneClasses.icon}`}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
    </div>
  );
};
