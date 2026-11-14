import { format, isBefore, startOfDay } from "date-fns";
import type { Project, Task } from "@/state/api";
import { Priority, Status } from "@/state/api";

export type TaskAccent = {
  label: string;
  dot: string;
  chip: string;
};

/**
 * Accent palette shared by cards, board columns and table-style views.
 * Every chip carries explicit dark-mode colors so it stays legible against
 * the inverted brand tokens.
 */
export const statusMeta: Record<string, TaskAccent> = {
  [Status.ToDo]: {
    label: "To Do",
    dot: "bg-blue-500",
    chip: "border-blue-200/80 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
  },
  [Status.WorkInProgress]: {
    label: "Work In Progress",
    dot: "bg-sky-500",
    chip: "border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
  },
  [Status.UnderReview]: {
    label: "Under Review",
    dot: "bg-amber-500",
    chip: "border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  },
  [Status.Completed]: {
    label: "Completed",
    dot: "bg-emerald-500",
    chip: "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
};

export const priorityMeta: Record<string, TaskAccent> = {
  [Priority.Urgent]: {
    label: "Urgent",
    dot: "bg-red-500",
    chip: "border-red-200/80 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
  },
  [Priority.High]: {
    label: "High",
    dot: "bg-orange-500",
    chip: "border-orange-200/80 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300",
  },
  [Priority.Medium]: {
    label: "Medium",
    dot: "bg-amber-500",
    chip: "border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  },
  [Priority.Low]: {
    label: "Low",
    dot: "bg-sky-500",
    chip: "border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
  },
  [Priority.Backlog]: {
    label: "Backlog",
    dot: "bg-slate-400",
    chip: "border-slate-200/80 bg-slate-50 text-slate-600 dark:border-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300",
  },
};

/** Splits the comma-separated tags field into clean, de-duplicated chips. */
export const splitTags = (tags?: string | null): string[] => {
  const seen = new Set<string>();

  return (tags ?? "")
    .split(",")
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .filter((tag) => {
      if (tag === "") return false;

      const key = tag.toLowerCase();
      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
};

const formatTaskDate = (date: Date): string =>
  date.getFullYear() === new Date().getFullYear()
    ? format(date, "MMM d")
    : format(date, "MMM d, yyyy");

/** Formats a task/project date for cards, grid cells and timelines. */
export const formatTaskDateValue = (
  value?: string | Date | null,
): string => {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  return isNaN(date.getTime()) ? "" : formatTaskDate(date);
};

/** SVAR progress fill for each workflow status. */
export const statusProgress: Record<string, number> = {
  [Status.ToDo]: 0,
  [Status.WorkInProgress]: 50,
  [Status.UnderReview]: 75,
  [Status.Completed]: 100,
};

export const statusRank: Record<string, number> = {
  [Status.ToDo]: 0,
  [Status.WorkInProgress]: 1,
  [Status.UnderReview]: 2,
  [Status.Completed]: 3,
};

export const priorityRank: Record<string, number> = {
  [Priority.Urgent]: 0,
  [Priority.High]: 1,
  [Priority.Medium]: 2,
  [Priority.Low]: 3,
  [Priority.Backlog]: 4,
};

export type ProjectPhase = "Upcoming" | "Active" | "Completed";

export const projectPhaseMeta: Record<ProjectPhase, TaskAccent> = {
  Upcoming: {
    label: "Upcoming",
    dot: "bg-blue-500",
    chip: "border-blue-200/80 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
  },
  Active: {
    label: "Active",
    dot: "bg-sky-500",
    chip: "border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
  },
  Completed: {
    label: "Completed",
    dot: "bg-emerald-500",
    chip: "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
};

/** Derives a display phase for a project from its schedule. */
export const projectPhase = (
  project: Pick<Project, "startDate" | "endDate">,
  today = new Date(),
): ProjectPhase => {
  const start = project.startDate ? new Date(project.startDate) : null;
  const end = project.endDate ? new Date(project.endDate) : null;
  const day = startOfDay(today).getTime();

  if (end && !isNaN(end.getTime()) && startOfDay(end).getTime() < day) {
    return "Completed";
  }

  if (start && !isNaN(start.getTime()) && startOfDay(start).getTime() > day) {
    return "Upcoming";
  }

  return "Active";
};

export type TaskDateInfo = {
  /** Full range, e.g. "Sep 20 – Sep 24". */
  label: string;
  /** Due-focused label for tight spaces, e.g. "Due Sep 24". */
  shortLabel: string;
  overdue: boolean;
};

export const taskDateInfo = (
  task: Pick<Task, "startDate" | "dueDate" | "status">,
): TaskDateInfo => {
  const parsedStart = task.startDate ? new Date(task.startDate) : null;
  const parsedDue = task.dueDate ? new Date(task.dueDate) : null;
  const start =
    parsedStart && !isNaN(parsedStart.getTime()) ? parsedStart : null;
  const due = parsedDue && !isNaN(parsedDue.getTime()) ? parsedDue : null;

  if (!start && !due) {
    return { label: "", shortLabel: "", overdue: false };
  }

  const overdue = Boolean(
    due &&
      task.status !== Status.Completed &&
      isBefore(startOfDay(due), startOfDay(new Date())),
  );

  if (start && due) {
    const sameDay = startOfDay(start).getTime() === startOfDay(due).getTime();

    return {
      label: sameDay
        ? `Due ${formatTaskDate(due)}`
        : `${formatTaskDate(start)} – ${formatTaskDate(due)}`,
      shortLabel: `Due ${formatTaskDate(due)}`,
      overdue,
    };
  }

  if (due) {
    return {
      label: `Due ${formatTaskDate(due)}`,
      shortLabel: `Due ${formatTaskDate(due)}`,
      overdue,
    };
  }

  return {
    label: `Starts ${formatTaskDate(start as Date)}`,
    shortLabel: `Starts ${formatTaskDate(start as Date)}`,
    overdue: false,
  };
};
