import { format, formatISO } from "date-fns";

// Shared tokens for the create/edit task forms so both stay visually identical.
export const inputStyles =
    "w-full rounded border border-brand-600/40 p-2.5 text-sm text-brand-900 outline-none focus:border-brand-600 transition-colors placeholder:text-brand-900/40";

export const selectStyles =
    "block w-full rounded border border-gray-300 px-3 py-2 dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

export const dateInputStyles = `${inputStyles} [color-scheme:light] dark:[color-scheme:dark]`;

export const labelStyles = "mb-1 block text-xs font-medium text-brand-900/60";

export const toIsoDate = (value: string) => {
    if (!value) return undefined;

    const date = new Date(value);
    if (isNaN(date.getTime())) return undefined;

    return formatISO(date, { representation: "complete" });
};

export const toIsoDateOrNull = (value: string): string | null => {
    if (!value) return null;

    const date = new Date(value);
    if (isNaN(date.getTime())) return null;

    return formatISO(date, { representation: "complete" });
};

export const toDateInputValue = (value?: string | null): string => {
    if (!value) return "";

    const date = new Date(value);
    return isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd");
};