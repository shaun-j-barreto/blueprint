"use client";

import { useAppSelector } from "@/app/redux";
import Header from "@/components/Header";
import { useGetProjectsQuery } from "@/state/api";
import React, { useMemo, useState } from "react";

import { Gantt, Willow, WillowDark } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";

type ViewMode = "Day" | "Week" | "Month";

const Timeline = () => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    const { data: projects, isLoading, isError } = useGetProjectsQuery();

    const [viewMode, setViewMode] = useState<ViewMode>("Month");

    const ganttTasks = useMemo(() => {
        return (
            projects?.map((project) => ({
                id: `Project-${project.id}`,
                text: project.name,
                start: new Date(project.startDate as string),
                end: new Date(project.endDate as string),
                type: "project",
                progress: 50,
            })) || []
        );
    }, [projects]);

    // Corrected to use SVAR UI '%' formatting tokens
    const scales = useMemo(() => {
        switch (viewMode) {
            case "Day":
                return [
                    { unit: "month", step: 1, format: "%F %Y" }, // e.g. January 2026
                    { unit: "day", step: 1, format: "%j %M" }    // e.g. 1 Jan
                ];
            case "Week":
                return [
                    { unit: "month", step: 1, format: "%F %Y" }, // e.g. January 2026
                    { unit: "week", step: 1, format: "Week %W" } // e.g. Week 4
                ];
            case "Month":
                return [
                    { unit: "year", step: 1, format: "%Y" },     // e.g. 2026
                    { unit: "month", step: 1, format: "%F" }     // e.g. January
                ];
            default:
                return [
                    { unit: "year", step: 1, format: "%Y" },
                    { unit: "month", step: 1, format: "%F" }
                ];
        }
    }, [viewMode]);

    const columns = [
        { id: "text", header: "Task Name", width: 250 },
        { id: "start", header: "Start Date", width: 120 },
        { id: "end", header: "End Date", width: 120 }
    ];

    if (isLoading) return <div>Loading...</div>;
    if (isError || !projects) return <div>An error occurred while fetching projects</div>;

    const ThemeWrapper = isDarkMode ? WillowDark : Willow;

    return (
        <div className="max-w-full p-8">
            <header className="mb-4 flex items-center justify-between">
                <Header name="Projects Timeline" />
                <div className="relative inline-block w-64">
                    <select
                        className="block w-full rounded border border-brand-600 bg-transparent px-4 py-2 text-sm outline-none transition-colors focus:border-brand-600 text-brand-900"
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as ViewMode)}
                    >
                        <option value="Day" className="bg-brand-200">Day</option>
                        <option value="Week" className="bg-brand-200">Week</option>
                        <option value="Month" className="bg-brand-200">Month</option>
                    </select>
                </div>
            </header>

            <div className="overflow-hidden rounded-md border border-brand-600 bg-brand-200 ">
                <div className="timeline h-[600px] w-full">
                    <ThemeWrapper>
                        <Gantt
                            tasks={ganttTasks}
                            links={[]}
                            scales={scales}
                            columns={columns}
                        />
                    </ThemeWrapper>
                </div>
            </div>
        </div>
    );
};

export default Timeline;