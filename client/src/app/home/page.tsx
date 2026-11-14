"use client";

import ModalNewProject from "@/app/projects/ModalNewProject";
import ModalNewTask from "@/components/ModalNewTask";
import {
    PriorityChip,
    StatusChip,
    TaskChip,
    UserAvatar,
} from "@/components/TaskChips";
import {
    formatTaskDateValue,
    priorityMeta,
    priorityRank,
    projectPhase,
    projectPhaseMeta,
    statusMeta,
    taskDateInfo,
    type ProjectPhase,
} from "@/lib/taskStyles";
import {
    Priority,
    Status,
    useGetAllTasksQuery,
    useGetProjectsQuery,
    type Project,
    type Task,
} from "@/state/api";
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Briefcase,
    CalendarDays,
    CheckCircle2,
    FolderPlus,
    Layers3,
    Plus,
} from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";

const CURRENT_USER_ID = 1;

const STATUS_ORDER: Status[] = [
    Status.ToDo,
    Status.WorkInProgress,
    Status.UnderReview,
    Status.Completed,
];

const PRIORITY_ORDER: Priority[] = [
    Priority.Urgent,
    Priority.High,
    Priority.Medium,
    Priority.Low,
    Priority.Backlog,
];

const PHASE_ORDER: Record<ProjectPhase, number> = {
    Active: 0,
    Upcoming: 1,
    Completed: 2,
};

const PANEL_CLASS =
    "border-brand-500/80 bg-brand-100 overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

const PRIMARY_BUTTON_CLASS =
    "bg-brand-600 text-brand-900 hover:bg-brand-800 hover:text-brand-200 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold shadow-sm transition-colors";

const SECONDARY_BUTTON_CLASS =
    "border-brand-500 text-brand-800 hover:bg-brand-300 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold transition-colors";

type BreakdownRow = {
    key: string;
    label: string;
    count: number;
    colorClass: string;
};

type ProjectStat = {
    project: Project;
    phase: ProjectPhase;
    total: number;
    completed: number;
    progress: number;
};

const dueTimestamp = (task: Pick<Task, "dueDate">): number => {
    if (!task.dueDate) return Number.MAX_SAFE_INTEGER;

    const time = new Date(task.dueDate).getTime();

    return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
};

const projectInitials = (name: string): string =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "P";

const projectDateRange = (project: Project): string => {
    const start = formatTaskDateValue(project.startDate);
    const end = formatTaskDateValue(project.endDate);

    if (start && end) return `${start} – ${end}`;
    if (start) return `Starts ${start}`;
    if (end) return `Due ${end}`;

    return "No schedule";
};

const CountPill = ({
    children,
    tone = "default",
}: {
    children: React.ReactNode;
    tone?: "default" | "danger";
}) => (
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

const SectionHeader = ({
    title,
    subtitle,
    right,
}: {
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
}) => (
    <div className="border-brand-500/70 flex flex-wrap items-start justify-between gap-2 border-b px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-brand-900 text-sm font-semibold">{title}</h2>
                {right}
            </div>
            {subtitle && (
                <p className="text-brand-700 mt-0.5 text-[11px]">{subtitle}</p>
            )}
        </div>
    </div>
);

const StatCard = ({
    label,
    value,
    hint,
    icon,
    danger = false,
}: {
    label: string;
    value: number;
    hint: string;
    icon: React.ReactNode;
    danger?: boolean;
}) => (
    <div className={`${PANEL_CLASS} p-4 sm:p-5`}>
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-brand-700 text-[10px] font-semibold uppercase tracking-[0.08em]">
                    {label}
                </p>
                <p className="text-brand-900 mt-2 text-3xl font-semibold tracking-tight">
                    {value}
                </p>
                <p
                    className={`mt-1 text-[11px] font-medium ${
                        danger
                            ? "text-red-600 dark:text-red-400"
                            : "text-brand-700"
                    }`}
                >
                    {hint}
                </p>
            </div>
            <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                    danger
                        ? "border-red-200/80 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                        : "border-brand-500/70 bg-brand-300 text-brand-800"
                }`}
                aria-hidden="true"
            >
                {icon}
            </span>
        </div>
    </div>
);

const CompletionRing = ({ value }: { value: number }) => {
    const clamped = Math.min(100, Math.max(0, value));

    return (
        <div
            className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
            style={{
                background: `conic-gradient(#10b981 ${
                    clamped * 3.6
                }deg, var(--color-brand-500) 0deg)`,
            }}
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${clamped}% complete`}
        >
            <div className="bg-brand-100 flex h-[52px] w-[52px] items-center justify-center rounded-full">
                <CheckCircle2
                    className="h-5 w-5 text-emerald-500"
                    aria-hidden="true"
                />
            </div>
        </div>
    );
};

const CompletionCard = ({
    rate,
    completed,
    total,
}: {
    rate: number;
    completed: number;
    total: number;
}) => (
    <div className={`${PANEL_CLASS} p-4 sm:p-5`}>
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-brand-700 text-[10px] font-semibold uppercase tracking-[0.08em]">
                    Completion
                </p>
                <p className="text-brand-900 mt-2 text-3xl font-semibold tracking-tight">
                    {rate}%
                </p>
                <p className="text-brand-700 mt-1 text-[11px] font-medium">
                    {completed} of {total} tasks complete
                </p>
            </div>
            <CompletionRing value={rate} />
        </div>
    </div>
);

const EmptyPanel = ({ title, hint }: { title: string; hint: string }) => (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 px-6 py-8 text-center">
        <span className="bg-brand-300 text-brand-700 flex h-9 w-9 items-center justify-center rounded-full">
            <Layers3 className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="text-brand-900 text-xs font-semibold">{title}</p>
        <p className="text-brand-700 max-w-xs text-[11px] leading-relaxed">
            {hint}
        </p>
    </div>
);

const MyTaskRow = ({
    task,
    projectName,
}: {
    task: Task;
    projectName: string;
}) => {
    const dates = taskDateInfo(task);

    return (
        <Link
            href={`/projects/${task.projectId}`}
            className="group border-brand-500/60 hover:bg-brand-200/70 flex items-center gap-3 border-b px-4 py-3 transition-colors last:border-b-0 sm:px-5"
        >
            <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center justify-between gap-3">
                    <p
                        className="text-brand-900 truncate text-[13px] font-semibold"
                        title={task.title}
                    >
                        {task.title}
                    </p>
                    <span
                        className={`inline-flex shrink-0 items-center gap-1 text-[11px] font-medium ${
                            dates.overdue
                                ? "text-red-600 dark:text-red-400"
                                : "text-brand-700"
                        }`}
                    >
                        {dates.overdue ? (
                            <AlertCircle className="h-3 w-3" />
                        ) : (
                            <CalendarDays className="h-3 w-3" />
                        )}
                        {dates.shortLabel || "No date"}
                    </span>
                </div>

                <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-brand-700 max-w-[160px] truncate text-[11px] font-medium">
                        {projectName}
                    </span>
                    <span
                        className="text-brand-700/40"
                        aria-hidden="true"
                    >
                        •
                    </span>
                    <StatusChip status={task.status} />
                    <PriorityChip priority={task.priority} />
                    <UserAvatar
                        user={task.assignee}
                        size="xs"
                        title={
                            task.assignee
                                ? `Assigned to ${task.assignee.username}`
                                : "Unassigned"
                        }
                    />
                </div>
            </div>
            <ArrowRight className="text-brand-700 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
        </Link>
    );
};

const ProjectPulseRow = ({ stat }: { stat: ProjectStat }) => (
    <Link
        href={`/projects/${stat.project.id}`}
        className="group border-brand-500/60 hover:bg-brand-200/70 flex items-center gap-3 border-b px-4 py-3 transition-colors last:border-b-0 sm:px-5"
    >
        <span
            className="bg-brand-300 text-brand-800 border-brand-500/70 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold"
            aria-hidden="true"
        >
            {projectInitials(stat.project.name)}
        </span>
        <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center justify-between gap-2">
                <p
                    className="text-brand-900 truncate text-[13px] font-semibold"
                    title={stat.project.name}
                >
                    {stat.project.name}
                </p>
                <TaskChip meta={projectPhaseMeta[stat.phase]} />
            </div>
            <div className="text-brand-700 mt-1 flex items-center justify-between gap-2 text-[11px] font-medium">
                <span className="truncate">
                    {projectDateRange(stat.project)}
                </span>
                <span className="shrink-0">
                    {stat.total > 0
                        ? `${stat.completed}/${stat.total} tasks`
                        : "No tasks"}
                </span>
            </div>
            <div
                className="bg-brand-500/60 mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
                role="progressbar"
                aria-valuenow={stat.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${stat.project.name} task progress`}
            >
                <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${stat.progress}%` }}
                />
            </div>
        </div>
    </Link>
);

const StatusBreakdown = ({
    rows,
    total,
}: {
    rows: BreakdownRow[];
    total: number;
}) => {
    const visible = rows.filter((row) => row.count > 0);

    return (
        <div>
            <div className="bg-brand-500/60 flex h-2.5 w-full overflow-hidden rounded-full">
                {visible.map((row) => (
                    <span
                        key={row.key}
                        className={`h-full ${row.colorClass}`}
                        style={{
                            width: `${(row.count / Math.max(total, 1)) * 100}%`,
                        }}
                        title={`${row.label}: ${row.count}`}
                    />
                ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {rows.map((row) => (
                    <div
                        key={row.key}
                        className="flex items-center justify-between gap-2 text-[11px]"
                    >
                        <span className="text-brand-700 flex min-w-0 items-center gap-1.5 font-medium">
                            <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${row.colorClass}`}
                            />
                            <span className="truncate">{row.label}</span>
                        </span>
                        <span className="text-brand-900 shrink-0 font-semibold">
                            {row.count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PriorityBreakdown = ({
    rows,
    total,
}: {
    rows: BreakdownRow[];
    total: number;
}) => (
    <div className="border-brand-500/60 mt-4 border-t pt-4">
        <div className="flex items-center justify-between gap-2">
            <h3 className="text-brand-700 text-[10px] font-semibold uppercase tracking-[0.08em]">
                By priority
            </h3>
            <span className="text-brand-700 text-[10px] font-medium">
                {total} total
            </span>
        </div>

        <div className="mt-3 space-y-2">
            {rows.map((row) => {
                const width = total > 0 ? (row.count / total) * 100 : 0;

                return (
                    <div
                        key={row.key}
                        className="grid grid-cols-[58px_1fr_20px] items-center gap-2"
                    >
                        <span className="text-brand-700 flex items-center gap-1.5 text-[11px] font-medium">
                            <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${row.colorClass}`}
                            />
                            {row.label}
                        </span>
                        <span className="bg-brand-500/60 h-1.5 overflow-hidden rounded-full">
                            <span
                                className={`block h-full rounded-full ${row.colorClass}`}
                                style={{ width: `${width}%` }}
                            />
                        </span>
                        <span className="text-brand-900 text-right text-[10px] font-semibold">
                            {row.count}
                        </span>
                    </div>
                );
            })}
        </div>
    </div>
);

const DashboardSkeleton = () => (
    <div className="px-4 pb-8 xl:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3 pt-5 pb-4">
            <div className="animate-pulse space-y-2">
                <div className="bg-brand-200 h-8 w-48 rounded-lg" />
                <div className="bg-brand-200 h-3 w-64 rounded" />
            </div>
            <div className="bg-brand-200 h-9 w-36 animate-pulse rounded-lg" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                    key={index}
                    className="bg-brand-200/70 h-[116px] animate-pulse rounded-2xl"
                />
            ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="bg-brand-200/70 h-[360px] animate-pulse rounded-2xl xl:col-span-2" />
            <div className="bg-brand-200/70 h-[360px] animate-pulse rounded-2xl" />
        </div>
    </div>
);

const DashboardError = ({ onRetry }: { onRetry: () => void }) => (
    <div className="px-4 pb-8 xl:px-6">
        <div className="border-brand-500/80 bg-brand-100 mt-5 flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-2xl border px-6 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
                <p className="text-brand-900 text-sm font-semibold">
                    Could not load your dashboard
                </p>
                <p className="text-brand-700 mt-1 text-xs">
                    An error occurred while fetching projects or tasks.
                </p>
            </div>
            <button
                type="button"
                onClick={onRetry}
                className="border-brand-500 text-brand-800 hover:bg-brand-300 mt-1 cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
            >
                Try again
            </button>
        </div>
    </div>
);

const HomePage = () => {
    const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
    const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

    const {
        data: tasks,
        isLoading: isTasksLoading,
        isError: isTasksError,
        refetch: refetchTasks,
    } = useGetAllTasksQuery();

    const {
        data: projects,
        isLoading: isProjectsLoading,
        isError: isProjectsError,
        refetch: refetchProjects,
    } = useGetProjectsQuery();

    const dashboard = useMemo(() => {
        const allTasks = tasks ?? [];
        const allProjects = projects ?? [];

        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(
            (task) => task.status === Status.Completed,
        ).length;
        const openTasks = totalTasks - completedTasks;
        const inProgressCount = allTasks.filter(
            (task) => task.status === Status.WorkInProgress,
        ).length;
        const underReviewCount = allTasks.filter(
            (task) => task.status === Status.UnderReview,
        ).length;
        const overdueTasks = allTasks.filter((task) =>
            taskDateInfo(task).overdue,
        );
        const overdueCount = overdueTasks.length;
        const overdueProjectCount = new Set(
            overdueTasks.map((task) => task.projectId),
        ).size;
        const completionRate = totalTasks
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

        const projectNameById = new Map(
            allProjects.map((project) => [project.id, project.name]),
        );

        const taskCounts = new Map<
            number,
            { total: number; completed: number }
        >();

        allTasks.forEach((task) => {
            const current = taskCounts.get(task.projectId) ?? {
                total: 0,
                completed: 0,
            };

            current.total += 1;
            if (task.status === Status.Completed) current.completed += 1;
            taskCounts.set(task.projectId, current);
        });

        const projectStats: ProjectStat[] = allProjects.map((project) => {
            const counts = taskCounts.get(project.id) ?? {
                total: 0,
                completed: 0,
            };

            return {
                project,
                phase: projectPhase(project),
                total: counts.total,
                completed: counts.completed,
                progress: counts.total
                    ? Math.round((counts.completed / counts.total) * 100)
                    : 0,
            };
        });

        const visibleProjects = [...projectStats]
            .sort((a, b) => {
                const phaseDelta = PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase];
                if (phaseDelta !== 0) return phaseDelta;

                // Within a phase, surface boards that still have work left
                // instead of empty placeholder projects.
                const aOpen = a.total - a.completed;
                const bOpen = b.total - b.completed;
                if (aOpen !== bOpen) return bOpen - aOpen;
                if (a.total !== b.total) return b.total - a.total;

                const aEnd = a.project.endDate
                    ? new Date(a.project.endDate).getTime()
                    : 0;
                const bEnd = b.project.endDate
                    ? new Date(b.project.endDate).getTime()
                    : 0;

                return bEnd - aEnd;
            })
            .slice(0, 5);

        const activeProjectCount = projectStats.filter(
            (stat) => stat.phase === "Active",
        ).length;
        const completedProjectCount = projectStats.filter(
            (stat) => stat.phase === "Completed",
        ).length;

        const myTasksAll = allTasks.filter(
            (task) =>
                task.authorUserId === CURRENT_USER_ID ||
                task.assignedUserId === CURRENT_USER_ID,
        );

        const myTasks = [...myTasksAll]
            .sort((a, b) => {
                const aCompleted = a.status === Status.Completed ? 1 : 0;
                const bCompleted = b.status === Status.Completed ? 1 : 0;
                if (aCompleted !== bCompleted) return aCompleted - bCompleted;

                const aOverdue = taskDateInfo(a).overdue ? 0 : 1;
                const bOverdue = taskDateInfo(b).overdue ? 0 : 1;
                if (aOverdue !== bOverdue) return aOverdue - bOverdue;

                const priorityDelta =
                    (priorityRank[a.priority ?? ""] ?? 99) -
                    (priorityRank[b.priority ?? ""] ?? 99);
                if (priorityDelta !== 0) return priorityDelta;

                return dueTimestamp(a) - dueTimestamp(b);
            })
            .slice(0, 6);

        const datedOpenTasks = allTasks.filter(
            (task) =>
                task.status !== Status.Completed && Boolean(task.dueDate),
        );
        const overdueDated = datedOpenTasks
            .filter((task) => taskDateInfo(task).overdue)
            .sort((a, b) => dueTimestamp(b) - dueTimestamp(a));
        const upcomingDated = datedOpenTasks
            .filter((task) => !taskDateInfo(task).overdue)
            .sort((a, b) => dueTimestamp(a) - dueTimestamp(b));
        const deadlines = [...overdueDated, ...upcomingDated].slice(0, 6);

        const statusCounts = new Map<string, number>();
        allTasks.forEach((task) => {
            const key = task.status ?? "No status";
            statusCounts.set(key, (statusCounts.get(key) ?? 0) + 1);
        });

        const statusRows: BreakdownRow[] = STATUS_ORDER.map((status) => ({
            key: status,
            label: statusMeta[status].label,
            count: statusCounts.get(status) ?? 0,
            colorClass: statusMeta[status].dot,
        }));

        const noStatusCount = allTasks.filter((task) => !task.status).length;
        if (noStatusCount > 0) {
            statusRows.push({
                key: "no-status",
                label: "No status",
                count: noStatusCount,
                colorClass: "bg-brand-600",
            });
        }

        const priorityRows: BreakdownRow[] = PRIORITY_ORDER.map(
            (priority) => ({
                key: priority,
                label: priorityMeta[priority].label,
                count: allTasks.filter(
                    (task) => task.priority === priority,
                ).length,
                colorClass: priorityMeta[priority].dot,
            }),
        );

        return {
            allTasks,
            allProjects,
            totalTasks,
            completedTasks,
            openTasks,
            inProgressCount,
            underReviewCount,
            overdueCount,
            overdueProjectCount,
            completionRate,
            projectNameById,
            projectStats,
            visibleProjects,
            activeProjectCount,
            completedProjectCount,
            myTasks,
            myTaskTotal: myTasksAll.length,
            deadlines,
            statusRows,
            priorityRows,
        };
    }, [tasks, projects]);

    if (isTasksLoading || isProjectsLoading) return <DashboardSkeleton />;

    if (isTasksError || isProjectsError) {
        return (
            <DashboardError
                onRetry={() => {
                    void refetchTasks();
                    void refetchProjects();
                }}
            />
        );
    }

    return (
        <div className="px-4 pb-8 xl:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3 pt-5 pb-4">
                <div className="min-w-0">
                    <p className="text-brand-700 text-[10px] font-semibold uppercase tracking-[0.08em]">
                        Overview
                    </p>
                    <h1 className="text-brand-900 mt-1 text-2xl font-semibold tracking-tight">
                        Welcome back
                    </h1>
                    <p className="text-brand-700 mt-1 text-xs">
                        Here’s what’s moving across your projects.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <CountPill>
                        {dashboard.totalTasks} tasks ·{" "}
                        {dashboard.allProjects.length} projects
                    </CountPill>
                    <button
                        type="button"
                        onClick={() => setIsNewProjectOpen(true)}
                        className={SECONDARY_BUTTON_CLASS}
                    >
                        <FolderPlus className="h-3.5 w-3.5" />
                        New project
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsNewTaskOpen(true)}
                        className={PRIMARY_BUTTON_CLASS}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        New task
                    </button>
                </div>
            </div>

            <section
                aria-label="Dashboard summary"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
                <StatCard
                    label="Projects"
                    value={dashboard.allProjects.length}
                    hint={`${dashboard.activeProjectCount} active · ${dashboard.completedProjectCount} completed`}
                    icon={<Briefcase className="h-4 w-4" />}
                />
                <StatCard
                    label="Open tasks"
                    value={dashboard.openTasks}
                    hint={`${dashboard.inProgressCount} in progress · ${dashboard.underReviewCount} in review`}
                    icon={<Layers3 className="h-4 w-4" />}
                />
                <StatCard
                    label="Overdue"
                    value={dashboard.overdueCount}
                    hint={`${dashboard.overdueProjectCount} ${
                        dashboard.overdueProjectCount === 1
                            ? "project"
                            : "projects"
                    } affected`}
                    icon={<AlertTriangle className="h-4 w-4" />}
                    danger
                />
                <CompletionCard
                    rate={dashboard.completionRate}
                    completed={dashboard.completedTasks}
                    total={dashboard.totalTasks}
                />
            </section>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
                <section
                    aria-label="My tasks"
                    className={`${PANEL_CLASS} xl:col-span-2`}
                >
                    <SectionHeader
                        title="My tasks"
                        subtitle="Authored by or assigned to you."
                        right={
                            <CountPill>
                                {dashboard.myTasks.length} of{" "}
                                {dashboard.myTaskTotal}
                            </CountPill>
                        }
                    />
                    {dashboard.myTasks.length > 0 ? (
                        <div>
                            {dashboard.myTasks.map((task) => (
                                <MyTaskRow
                                    key={task.id}
                                    task={task}
                                    projectName={
                                        dashboard.projectNameById.get(
                                            task.projectId,
                                        ) ?? "Unknown project"
                                    }
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyPanel
                            title="No tasks assigned to you"
                            hint="Tasks you create or that are assigned to you will appear here."
                        />
                    )}
                </section>

                <section aria-label="Project pulse" className={PANEL_CLASS}>
                    <SectionHeader
                        title="Project pulse"
                        subtitle="Active first, then the most open work."
                        right={
                            <CountPill>
                                {dashboard.allProjects.length} total
                            </CountPill>
                        }
                    />
                    {dashboard.visibleProjects.length > 0 ? (
                        <div>
                            {dashboard.visibleProjects.map((stat) => (
                                <ProjectPulseRow
                                    key={stat.project.id}
                                    stat={stat}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyPanel
                            title="No projects yet"
                            hint="Create a project to see its schedule and task progress here."
                        />
                    )}
                </section>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
                <section
                    aria-label="Deadlines"
                    className={`${PANEL_CLASS} xl:col-span-2`}
                >
                    <SectionHeader
                        title="Deadlines"
                        subtitle="Open tasks, closest to today first."
                        right={
                            <CountPill
                                tone={
                                    dashboard.overdueCount > 0
                                        ? "danger"
                                        : "default"
                                }
                            >
                                {dashboard.overdueCount > 0
                                    ? `${dashboard.overdueCount} overdue`
                                    : "No overdue"}
                            </CountPill>
                        }
                    />

                    {dashboard.deadlines.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[540px] border-collapse text-left">
                                <thead>
                                    <tr className="border-brand-500/70 bg-brand-200/60 border-b">
                                        <th className="text-brand-700 px-4 py-2.5 pl-5 text-[10px] font-semibold uppercase tracking-[0.06em]">
                                            Task
                                        </th>
                                        <th className="text-brand-700 hidden px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] sm:table-cell">
                                            Assignee
                                        </th>
                                        <th className="text-brand-700 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em]">
                                            Status
                                        </th>
                                        <th className="text-brand-700 hidden px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] md:table-cell">
                                            Priority
                                        </th>
                                        <th className="text-brand-700 px-4 py-2.5 pr-5 text-right text-[10px] font-semibold uppercase tracking-[0.06em]">
                                            Due
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-brand-500/60 divide-y">
                                    {dashboard.deadlines.map((task) => {
                                        const dates = taskDateInfo(task);

                                        return (
                                            <tr
                                                key={task.id}
                                                className="hover:bg-brand-200/60 transition-colors"
                                            >
                                                <td className="px-4 py-3 pl-5">
                                                    <Link
                                                        href={`/projects/${task.projectId}`}
                                                        className="block min-w-0"
                                                    >
                                                        <p
                                                            className="text-brand-900 truncate text-[12px] font-semibold"
                                                            title={task.title}
                                                        >
                                                            {task.title}
                                                        </p>
                                                        <p className="text-brand-700 mt-0.5 truncate text-[10px] font-medium">
                                                            {dashboard.projectNameById.get(
                                                                task.projectId,
                                                            ) ?? "Unknown project"}{" "}
                                                            · #{task.id}
                                                        </p>
                                                    </Link>
                                                </td>
                                                <td className="hidden px-3 py-3 sm:table-cell">
                                                    <div className="flex items-center gap-1.5">
                                                        <UserAvatar
                                                            user={task.assignee}
                                                            size="xs"
                                                            title={
                                                                task.assignee
                                                                    ? `Assigned to ${task.assignee.username}`
                                                                    : "Unassigned"
                                                            }
                                                        />
                                                        <span className="text-brand-800 max-w-[120px] truncate text-[11px] font-medium">
                                                            {task.assignee
                                                                ?.username ??
                                                                "Unassigned"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <StatusChip
                                                        status={task.status}
                                                    />
                                                </td>
                                                <td className="hidden px-3 py-3 md:table-cell">
                                                    <PriorityChip
                                                        priority={task.priority}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 pr-5 text-right whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                                            dates.overdue
                                                                ? "text-red-600 dark:text-red-400"
                                                                : "text-brand-800"
                                                        }`}
                                                    >
                                                        {dates.overdue ? (
                                                            <AlertCircle className="h-3 w-3" />
                                                        ) : (
                                                            <CalendarDays className="h-3 w-3" />
                                                        )}
                                                        {formatTaskDateValue(
                                                            task.dueDate,
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyPanel
                            title="No deadlines"
                            hint="Open tasks with due dates will appear here."
                        />
                    )}
                </section>

                <section aria-label="Workload" className={PANEL_CLASS}>
                    <SectionHeader
                        title="Workload"
                        subtitle="Distribution across status and priority."
                        right={
                            <CountPill>
                                {dashboard.totalTasks} tasks
                            </CountPill>
                        }
                    />
                    <div className="p-4 sm:p-5">
                        <StatusBreakdown
                            rows={dashboard.statusRows}
                            total={dashboard.totalTasks}
                        />
                        <PriorityBreakdown
                            rows={dashboard.priorityRows}
                            total={dashboard.totalTasks}
                        />
                    </div>
                </section>
            </div>

            <ModalNewTask
                isOpen={isNewTaskOpen}
                onClose={() => setIsNewTaskOpen(false)}
            />
            <ModalNewProject
                isOpen={isNewProjectOpen}
                onClose={() => setIsNewProjectOpen(false)}
            />
        </div>
    );
};

export default HomePage;
