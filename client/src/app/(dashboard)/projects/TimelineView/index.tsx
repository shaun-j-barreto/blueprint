import { useAppSelector } from "@/app/redux";
import { StatusChip } from "@/components/TaskChips";
import TimelineChart, {
    TIMELINE_SCALES,
    TimelineRangeControl,
    type TimelineViewMode,
} from "@/components/TimelineChart";
import { useProjectPermissions } from "@/lib/permissions";
import {
    formatTaskDateValue,
    statusMeta,
    statusProgress,
} from "@/lib/taskStyles";
import { useGetTasksQuery } from "@/state/api";
import type { IColumnConfig, ITask } from "@svar-ui/react-gantt";
import { AlertTriangle, Loader2 } from "lucide-react";
import React, { useMemo, useState } from "react";

type Props = {
    id: string;
    setIsModalNewTaskOpen: (isOpen: boolean) => void;
};

const GANTT_COLUMNS: IColumnConfig[] = [
    {
        id: "text",
        header: "Task",
        width: 250,
        cell: ({ row }) => (
            <span
                className="text-brand-900 block truncate text-[12px] font-semibold"
                title={row.text}
            >
                {row.text}
            </span>
        ),
    },
    {
        id: "start",
        header: "Start",
        width: 108,
        template: (_value, row) => formatTaskDateValue(row?.start),
    },
    {
        id: "end",
        header: "Due",
        width: 108,
        template: (_value, row) => formatTaskDateValue(row?.end),
    },
    {
        id: "status",
        header: "Status",
        width: 144,
        cell: ({ row }) =>
            row.status ? (
                <StatusChip status={row.status} />
            ) : (
                <span className="text-brand-700/50 text-xs">—</span>
            ),
    },
];

const TimelineView = ({ id, setIsModalNewTaskOpen }: Props) => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

    const projectId = Number(id);
    const queryArgs = useMemo(() => ({ projectId }), [projectId]);
    const { canContribute } = useProjectPermissions(projectId);

    const {
        data: tasks,
        error,
        isLoading,
    } = useGetTasksQuery(queryArgs, { skip: isNaN(projectId) });

    const [viewMode, setViewMode] = useState<TimelineViewMode>("month");

    const ganttTasks = useMemo<ITask[]>(() => {
        if (!tasks || tasks.length === 0) return [];

        const now = new Date();

        return tasks.map((task) => {
            const parsedStart = task.startDate ? new Date(task.startDate) : null;
            const parsedDue = task.dueDate ? new Date(task.dueDate) : null;

            const start =
                parsedStart && !isNaN(parsedStart.getTime())
                    ? parsedStart
                    : parsedDue && !isNaN(parsedDue.getTime())
                      ? parsedDue
                      : now;

            const due =
                parsedDue && !isNaN(parsedDue.getTime()) ? parsedDue : start;

            const startOfRange = new Date(start);
            startOfRange.setHours(0, 0, 0, 0);

            const endOfRange = new Date(due);
            endOfRange.setHours(23, 59, 59, 999);

            if (endOfRange.getTime() < startOfRange.getTime()) {
                endOfRange.setTime(startOfRange.getTime() + 86_400_000 - 1);
            }

            return {
                id: String(task.id),
                text: task.title,
                start: startOfRange,
                end: endOfRange,
                status: task.status,
                type: "task",
                progress: task.status ? (statusProgress[task.status] ?? 0) : 0,
            };
        });
    }, [tasks]);

    const { timelineStart, timelineEnd } = useMemo(() => {
        if (ganttTasks.length === 0) {
            const now = new Date();

            return {
                timelineStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                timelineEnd: new Date(now.getFullYear(), now.getMonth() + 2, 0),
            };
        }

        let minDate = ganttTasks[0].start!.getTime();
        let maxDate = ganttTasks[0].end!.getTime();

        ganttTasks.forEach((task) => {
            if (task.start && task.start.getTime() < minDate)
                minDate = task.start.getTime();
            if (task.end && task.end.getTime() > maxDate)
                maxDate = task.end.getTime();
        });

        const start = new Date(minDate);
        start.setMonth(start.getMonth() - 1);

        const end = new Date(maxDate);
        end.setMonth(end.getMonth() + 2);

        return { timelineStart: start, timelineEnd: end };
    }, [ganttTasks]);

    if (isNaN(projectId))
        return (
            <div className="text-brand-900 p-6 font-medium">
                Invalid Project Identifier
            </div>
        );

    if (isLoading)
        return (
            <div className="px-4 pb-8 xl:px-6">
                <div className="border-brand-500/80 bg-brand-100 flex h-[460px] flex-col items-center justify-center gap-3 rounded-2xl border">
                    <Loader2 className="text-brand-700 h-5 w-5 animate-spin" />
                    <p className="text-brand-700 text-xs font-medium">
                        Loading timeline…
                    </p>
                </div>
            </div>
        );

    if (error)
        return (
            <div className="px-4 pb-8 xl:px-6">
                <div className="border-brand-500/80 bg-brand-100 flex h-[460px] flex-col items-center justify-center gap-3 rounded-2xl border px-6 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        <AlertTriangle className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="text-brand-900 text-sm font-semibold">
                            Could not load timeline
                        </p>
                        <p className="text-brand-700 mt-1 text-xs">
                            An error occurred while fetching this project’s
                            tasks.
                        </p>
                    </div>
                </div>
            </div>
        );

    const taskCount = tasks?.length ?? 0;

    return (
        <div className="px-4 pb-8 xl:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3 pt-5 pb-4">
                <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-brand-900 text-lg font-semibold">
                            Project Timeline
                        </h2>
                        <span className="border-brand-500/70 bg-brand-200 text-brand-700 rounded-full border px-2 py-0.5 text-[11px] font-semibold">
                            {taskCount} {taskCount === 1 ? "task" : "tasks"}
                        </span>
                    </div>
                    <p className="text-brand-700 mt-1 text-xs">
                        Schedule, status and progress across the project.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <TimelineRangeControl
                        value={viewMode}
                        onChange={setViewMode}
                        label="Project timeline range"
                    />
                    {canContribute && (
                        <button
                            type="button"
                            onClick={() => setIsModalNewTaskOpen(true)}
                            className="bg-brand-600 text-brand-900 hover:bg-brand-800 hover:text-brand-200 flex cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-xs font-bold shadow-sm transition-colors"
                        >
                            Add New Task
                        </button>
                    )}
                </div>
            </div>

            <div className="border-brand-500/80 bg-brand-100 overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <TimelineChart
                    tasks={ganttTasks}
                    columns={GANTT_COLUMNS}
                    scales={TIMELINE_SCALES[viewMode]}
                    isDarkMode={isDarkMode}
                    start={timelineStart}
                    end={timelineEnd}
                    height={460}
                    emptyMessage="No tasks scheduled yet."
                    emptyHint="Add a task to start building this project timeline."
                    onAddTask={
                        canContribute
                            ? () => setIsModalNewTaskOpen(true)
                            : undefined
                    }
                />

                <div className="border-brand-500/70 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        {Object.entries(statusMeta).map(([status, meta]) => (
                            <span
                                key={status}
                                className="text-brand-700 inline-flex items-center gap-1.5 text-[11px] font-medium"
                            >
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                                />
                                {meta.label}
                            </span>
                        ))}
                    </div>
                    <p className="text-brand-700 text-[11px] font-medium">
                        {formatTaskDateValue(timelineStart)} –{" "}
                        {formatTaskDateValue(timelineEnd)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TimelineView;
