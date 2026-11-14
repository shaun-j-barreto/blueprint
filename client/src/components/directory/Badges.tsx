import { FolderOpen } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DirectoryRole } from "@/lib/directory";

const ROLE_CLASSES: Record<DirectoryRole, string> = {
  "Product owner":
    "border-indigo-200/80 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300",
  "Project manager":
    "border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
  Member: "border-brand-500/70 bg-brand-200 text-brand-700",
};

export const RoleBadge = ({ role }: { role: DirectoryRole }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${ROLE_CLASSES[role]}`}
  >
    {role}
  </span>
);

export const TeamBadge = ({
  name,
  muted = false,
}: {
  name?: string;
  muted?: boolean;
}) => (
  <span
    className={`inline-flex max-w-[160px] items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
      muted || !name
        ? "border-brand-500 text-brand-700 border-dashed bg-transparent"
        : "border-brand-500/70 bg-brand-200 text-brand-700"
    }`}
  >
    <span className="truncate">{name ?? "No team"}</span>
  </span>
);

type CountPillProps = {
  children: ReactNode;
  tone?: "default" | "danger";
};

export const CountPill = ({ children, tone = "default" }: CountPillProps) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
      tone === "danger"
        ? "border-red-200/80 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
        : "border-brand-500/70 bg-brand-200 text-brand-700"
    }`}
  >
    {children}
  </span>
);

export const ProjectChip = ({
  id,
  name,
  className = "",
}: {
  id: number;
  name: string;
  className?: string;
}) => (
  <Link
    href={`/projects/${id}`}
    title={name}
    className={`border-brand-500/70 bg-brand-200 text-brand-800 hover:border-brand-600 hover:bg-brand-300 inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none ${className}`}
  >
    <FolderOpen className="h-3 w-3 shrink-0" aria-hidden="true" />
    <span className="truncate">{name}</span>
  </Link>
);
