import { useAppSelector } from "@/app/redux";
import { useGetTasksQuery } from "@/state/api";
import { Gantt, Willow, WillowDark } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";
import React, { useMemo, useState } from "react";
import { format } from "date-fns";

type Props = {
    id: string;
    setIsModalNewTaskOpen: (isOpen: boolean) => void;
};

const GANTT_SCALES = {
    day: [
        { unit: "month", step: 1, format: "%F %Y" },
        { unit: "day", step: 1, format: "%d" }
    ],
    week: [
        { unit: "month", step: 1, format: "%F %Y" },
        { unit: "week", step: 1, format: "Week %W" }
    ],
    month: [
        { unit: "year", step: 1, format: "%Y" },
        { unit: "month", step: 1, format: "%F" }
    ]
};

// Updated columns to map to 'start' and 'end'
const GANTT_COLUMNS = [
    { id: "text", header: "Task Title", width: 260 },
    {
        id: "start",
        header: "Start",
        width: 110,
        template: (task: any) => {
            const dateVal = task instanceof Date ? task : task?.start;
            if (!dateVal) return "";
            const d = new Date(dateVal);
            return isNaN(d.getTime()) ? "" : format(d, "dd/MM/yyyy");
        }
    },
    {
        id: "end",
        header: "Due",
        width: 110,
        template: (task: any) => {
            const dateVal = task instanceof Date ? task : task?.end;
            if (!dateVal) return "";
            const d = new Date(dateVal);
            return isNaN(d.getTime()) ? "" : format(d, "dd/MM/yyyy");
        }
    },
    { id: "status", header: "Status", width: 130 }
];

const EMPTY_LINKS: any[] = [];

type ViewModeType = "day" | "week" | "month";

const TimelineView = ({ id, setIsModalNewTaskOpen }: Props) => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    const ThemeWrapper = isDarkMode ? WillowDark : Willow;

    const projectId = Number(id);
    const queryArgs = useMemo(() => ({ projectId }), [projectId]);

    const {
        data: tasks,
        error,
        isLoading,
    } = useGetTasksQuery(queryArgs, { skip: isNaN(projectId) });

    const [viewMode, setViewMode] = useState<ViewModeType>("month");

    const ganttTasks = useMemo(() => {
        if (!tasks || tasks.length === 0) return [];

        return tasks.map((task) => {
            const safeStart = task.startDate ? new Date(task.startDate) : new Date();
            const safeEnd = task.dueDate ? new Date(task.dueDate) : new Date();

            const validStart = isNaN(safeStart.getTime()) ? new Date() : safeStart;
            validStart.setHours(0, 0, 0, 0);

            const validEnd = isNaN(safeEnd.getTime()) ? new Date(validStart.getTime() + 86400000) : safeEnd;
            validEnd.setHours(23, 59, 59, 999);

            return {
                id: String(task.id),
                text: task.title,
                start: validStart, // Fixed: using 'start'
                end: validEnd,     // Fixed: using 'end'
                status: task.status,
                type: "task",
                progress: 50,      // SVAR typically uses 0-100 percentage. Defaulting to 50 to match Timeline.
            };
        });
    }, [tasks]);

    const { timelineStart, timelineEnd } = useMemo(() => {
        if (!ganttTasks || ganttTasks.length === 0) {
            const now = new Date();
            return {
                timelineStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                timelineEnd: new Date(now.getFullYear(), now.getMonth() + 2, 0)
            };
        }

        // Updated min/max logic to use 'start' and 'end'
        let minDate = ganttTasks[0].start.getTime();
        let maxDate = ganttTasks[0].end.getTime();

        ganttTasks.forEach((t) => {
            if (t.start.getTime() < minDate) minDate = t.start.getTime();
            if (t.end.getTime() > maxDate) maxDate = t.end.getTime();
        });

        const start = new Date(minDate);
        start.setMonth(start.getMonth() - 1);

        const end = new Date(maxDate);
        end.setMonth(end.getMonth() + 2);

        return { timelineStart: start, timelineEnd: end };
    }, [ganttTasks]);

    if (isNaN(projectId)) return <div className="p-6 text-brand-900">Invalid Project Identifier</div>;
    if (isLoading) return <div className="p-6 text-brand-900">Loading Timeline...</div>;
    if (error) return <div className="p-6 text-red-500">An error occurred while fetching tasks</div>;

    return (
        <div className="px-4 xl:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4 py-5">
                <h1 className="text-base font-bold text-brand-900">
                    Project Tasks Timeline
                </h1>
                <div className="relative inline-block w-48">
                    <select
                        className="block w-full rounded border border-brand-600/40 bg-transparent px-4 py-2 text-sm text-brand-900 outline-none transition-colors focus:border-brand-600"
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as ViewModeType)}
                    >
                        <option value="day">Day</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                    </select>
                </div>
            </div>

            <div className="overflow-hidden rounded-md border border-brand-600/40 bg-transparent">
                {ganttTasks.length > 0 ? (
                    <div className="timeline h-[400px] w-full">
                        <ThemeWrapper>
                            <Gantt
                                tasks={ganttTasks}
                                links={EMPTY_LINKS}
                                scales={GANTT_SCALES[viewMode]}
                                columns={GANTT_COLUMNS}
                                start={timelineStart}
                                end={timelineEnd}
                            />
                        </ThemeWrapper>
                    </div>
                ) : (
                    <div className="flex h-[400px] items-center justify-center text-sm font-medium text-brand-900/60">
                        No tasks scheduled for this project.
                    </div>
                )}

                <div className="border-t border-brand-600/40 p-4">
                    <button
                        className="flex items-center justify-center rounded-md bg-brand-700 px-4 py-2.5 text-sm font-medium text-brand-100 transition-colors hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-800 focus:ring-offset-2 w-full sm:w-auto"
                        onClick={() => setIsModalNewTaskOpen(true)}
                    >
                        Add New Task
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimelineView;