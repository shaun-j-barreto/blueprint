import { Search, X } from "lucide-react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  className?: string;
};

export const SearchInput = ({
  value,
  onChange,
  label,
  placeholder,
  className = "",
}: SearchInputProps) => (
  <div className={`relative ${className}`}>
    <Search
      className="text-brand-700 pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2"
      aria-hidden="true"
    />

    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      placeholder={placeholder}
      className="border-brand-500 bg-brand-100 text-brand-900 placeholder:text-brand-700/70 w-full rounded-lg border py-2 pr-9 pl-8 text-xs transition-colors outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 [&::-webkit-search-cancel-button]:hidden"
    />

    {value && (
      <button
        type="button"
        onClick={() => onChange("")}
        aria-label="Clear search"
        className="text-brand-700 hover:bg-brand-300 hover:text-brand-900 absolute top-1/2 right-1.5 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    )}
  </div>
);
