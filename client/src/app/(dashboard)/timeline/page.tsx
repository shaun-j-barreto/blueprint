"use client";

import { useAppSelector } from "@/app/redux";
import { TaskChip } from "@/components/TaskChips";
import TimelineChart, {
    TIMELINE_SCALES,
    TimelineRangeControl,
    type TimelineViewMode,
} from "@/components/TimelineChart";
import {
    formatTaskDateValue,
    projectPhase,
    projectPhaseMeta,
} from "@/lib/taskStyles";
import { useGetProjectsQuery } from "@/state/api";
import type { IColumnConfig, ITask } from "@svar-ui/react-gantt";
import { AlertTriangle, Loader2 } from "lucide-react";
import React, { useMemo, useState } from "react";

const PHASE_PROGRESS: Record<string, number> = {
    Upcoming: 0,
    Active: 50,
    Completed: 100,
};

const COLUMNS: IColumnConfig[] = [
    {
        id: "text",
        header: "Project",
        width: 280,
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
        width: 140,
        cell: ({ row }) => {
            const phase = row.status as keyof typeof projectPhaseMeta;

            return projectPhaseMeta[phase] ? (
                <TaskChip meta={projectPhaseMeta[phase]} />
            ) : (
                <span className="text-brand-700/50 text-xs">—</span>
            );
        },
    },
];

const Timeline = () => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    const { data: projects, isLoading, isError } = useGetProjectsQuery();

    const [viewMode, setViewMode] = useState<TimelineViewMode>("month");

    const ganttTasks = useMemo<ITask[]>(() => {
        if (!projects) return [];

        return projects.map((project) => {
            const phase = projectPhase(project);
            const parsedStart = project.startDate
                ? new Date(project.startDate)
                : null;
            const parsedEnd = project.endDate ? new Date(project.endDate) : null;

            const start =
                parsedStart && !isNaN(parsedStart.getTime())
                    ? parsedStart
                    : parsedEnd && !isNaN(parsedEnd.getTime())
                      ? parsedEnd
                      : new Date();

            const end =
                parsedEnd && !isNaN(parsedEnd.getTime()) ? parsedEnd : start;

            const startOfRange = new Date(start);
            startOfRange.setHours(0, 0, 0, 0);

            const endOfRange = new Date(end);
            endOfRange.setHours(23, 59, 59, 999);

            if (endOfRange.getTime() < startOfRange.getTime()) {
                endOfRange.setTime(startOfRange.getTime() + 86_400_000 - 1);
            }

            return {
                id: `Project-${project.id}`,
                text: project.name,
                start: startOfRange,
                end: endOfRange,
                status: phase,
                type: "project",
                progress: PHASE_PROGRESS[phase] ?? 0,
            };
        });
    }, [projects]);

    if (isLoading)
        return (
            <div className="max-w-full p-8">
                <div className="border-brand-500/80 bg-brand-100 flex h-[560px] flex-col items-center justify-center gap-3 rounded-2xl border">
                    <Loader2 className="text-brand-700 h-5 w-5 animate-spin" />
                    <p className="text-brand-700 text-xs font-medium">
                        Loading projects…
                    </p>
                </div>
            </div>
        );

    if (isError || !projects)
        return (
            <div className="max-w-full p-8">
                <div className="border-brand-500/80 bg-brand-100 flex h-[560px] flex-col items-center justify-center gap-3 rounded-2xl border px-6 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        <AlertTriangle className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="text-brand-900 text-sm font-semibold">
                            Could not load projects
                        </p>
                        <p className="text-brand-700 mt-1 text-xs">
                            An error occurred while fetching the project list.
                        </p>
                    </div>
                </div>
            </div>
        );

    return (
        <div className="max-w-full px-4 pb-8 pt-5 xl:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3 pb-4">
                <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-brand-900 text-lg font-semibold">
                            Projects Timeline
                        </h1>
                        <span className="border-brand-500/70 bg-brand-200 text-brand-700 rounded-full border px-2 py-0.5 text-[11px] font-semibold">
                            {projects.length}{" "}
                            {projects.length === 1 ? "project" : "projects"}
                        </span>
                    </div>
                    <p className="text-brand-700 mt-1 text-xs">
                        Delivery windows for every project in one schedule.
                    </p>
                </div>

                <TimelineRangeControl
                    value={viewMode}
                    onChange={setViewMode}
                    label="Projects timeline range"
                />
            </div>

            <div className="border-brand-500/80 bg-brand-100 overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <TimelineChart
                    tasks={ganttTasks}
                    columns={COLUMNS}
                    scales={TIMELINE_SCALES[viewMode]}
                    isDarkMode={isDarkMode}
                    height={560}
                    emptyMessage="No projects to display."
                    emptyHint="Projects appear here once their schedules are set."
                />

                <div className="border-brand-500/70 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t px-4 py-3">
                    {Object.entries(projectPhaseMeta).map(([phase, meta]) => (
                        <span
                            key={phase}
                            className="text-brand-700 inline-flex items-center gap-1.5 text-[11px] font-medium"
                        >
                            <span
                                className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                            />
                            {meta.label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Timeline;
