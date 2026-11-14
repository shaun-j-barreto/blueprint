import { Layers3 } from "lucide-react";
import type { ReactNode } from "react";
import { PANEL_CLASS } from "./styles";

type EmptyStateProps = {
  title: string;
  hint: string;
  action?: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
};

export const EmptyState = ({
  title,
  hint,
  action,
  icon,
  compact = false,
}: EmptyStateProps) => (
  <div
    className={`${PANEL_CLASS} flex flex-col items-center justify-center gap-2 px-6 text-center ${
      compact ? "py-8" : "py-12"
    }`}
  >
    <span className="bg-brand-300 text-brand-700 flex h-9 w-9 items-center justify-center rounded-full">
      {icon ?? <Layers3 className="h-4 w-4" aria-hidden="true" />}
    </span>
    <p className="text-brand-900 text-xs font-semibold">{title}</p>
    <p className="text-brand-700 max-w-sm text-[11px] leading-relaxed">
      {hint}
    </p>
    {action && <div className="mt-1">{action}</div>}
  </div>
);
