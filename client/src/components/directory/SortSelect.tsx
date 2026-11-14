import { ChevronDown } from "lucide-react";

export type SortOption<T extends string> = {
  value: T;
  label: string;
};

type SortSelectProps<T extends string> = {
  options: SortOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
};

export function SortSelect<T extends string>({
  options,
  value,
  onChange,
  label,
}: SortSelectProps<T>) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        aria-label={label}
        className="border-brand-500 bg-brand-100 text-brand-800 hover:bg-brand-300 cursor-pointer appearance-none rounded-lg border py-1.5 pr-7 pl-2.5 text-[11px] font-semibold transition-colors outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="text-brand-700 pointer-events-none absolute right-2 h-3 w-3"
        aria-hidden="true"
      />
    </label>
  );
}
