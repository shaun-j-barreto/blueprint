export type FilterOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

type FilterTabsProps<T extends string> = {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
};

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: FilterTabsProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="border-brand-500/70 bg-brand-200 inline-flex flex-wrap gap-1 rounded-xl border p-1"
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none ${
              active
                ? "border-brand-500/80 bg-brand-100 text-brand-900 border shadow-sm"
                : "text-brand-700 hover:text-brand-900 hover:bg-brand-300 border border-transparent"
            }`}
          >
            {option.label}
            {typeof option.count === "number" && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                  active
                    ? "bg-brand-300 text-brand-800"
                    : "bg-brand-300/70 text-brand-700"
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
