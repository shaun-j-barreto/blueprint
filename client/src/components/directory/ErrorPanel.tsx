import { AlertTriangle } from "lucide-react";
import { PANEL_CLASS } from "./styles";

type ErrorPanelProps = {
  title: string;
  hint: string;
  onRetry: () => void;
};

export const ErrorPanel = ({ title, hint, onRetry }: ErrorPanelProps) => (
  <div
    className={`${PANEL_CLASS} mt-4 flex min-h-[320px] flex-col items-center justify-center gap-3 px-6 text-center`}
  >
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
      <AlertTriangle className="h-5 w-5" aria-hidden="true" />
    </span>

    <div>
      <p className="text-brand-900 text-sm font-semibold">{title}</p>
      <p className="text-brand-700 mt-1 max-w-md text-xs">{hint}</p>
    </div>

    <button
      type="button"
      onClick={onRetry}
      className="border-brand-500 text-brand-800 hover:bg-brand-300 mt-1 cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
    >
      Try again
    </button>
  </div>
);
