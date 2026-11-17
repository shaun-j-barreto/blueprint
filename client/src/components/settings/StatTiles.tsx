import type { LucideIcon } from "lucide-react";

type Tone = "indigo" | "emerald" | "amber" | "slate";

const TONES: Record<Tone, string> = {
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-600",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-600",
  amber: "border-amber-200 bg-amber-50 text-amber-600",
  slate: "border-brand-500/70 bg-brand-200 text-brand-700",
};

export type Stat = {
  label: string;
  value: number | string;
  hint: string;
  icon: LucideIcon;
  tone: Tone;
};

export default function StatTiles({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {stats.map(({ label, value, hint, icon: Icon, tone }) => (
        <div
          key={label}
          className="rounded-xl border border-brand-500/80 bg-brand-100 p-3 transition-colors hover:border-brand-600"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[9px] font-semibold tracking-[0.1em] text-brand-700 uppercase">
              {label}
            </p>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-lg border ${TONES[tone]}`}
            >
              <Icon className="h-3 w-3" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-2 text-xl font-semibold tracking-tight text-brand-900 tabular-nums">
            {value}
          </p>
          <p className="mt-0.5 text-[10px] text-brand-700">{hint}</p>
        </div>
      ))}
    </div>
  );
}
