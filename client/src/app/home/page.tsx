"use client";

import Header from "@/components/Header";
import { useGetProjectsQuery, useGetTasksByUserQuery } from "@/state/api";
import {
    CheckCircle,
    Clock,
    Briefcase,
    AlertTriangle,
    ArrowUpCircle,
    MinusCircle,
    ArrowDownCircle,
    Archive,
    Loader2
} from "lucide-react";
import React from "react";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";

// Updated to distinct, high-contrast semantic colors
const STATUS_COLORS = {
    "To Do": "#94a3b8",
    "Work In Progress": "#818cf8",
    "Under Review": "#E3963E",
    "Completed": "#34d399",
};

const HomePage = () => {
    const userId = 1;

    const { data: tasks, isLoading: isTasksLoading } = useGetTasksByUserQuery(userId);
    const { data: projects, isLoading: isProjectsLoading } = useGetProjectsQuery();

    if (isTasksLoading || isProjectsLoading) {
        return (
            <div className="flex h-screen items-center justify-center text-brand-900">
                <Loader2 className="mr-2 h-10 w-10 animate-spin" />
                <span className="text-lg font-medium">Loading Dashboard...</span>
            </div>
        );
    }

    if (!tasks || !projects) {
        return <div className="p-8 font-bold text-red-500">Failed to load dashboard data.</div>;
    }

    // Core Metrics
    const activeProjectsCount = projects.length;
    const completedTasksCount = tasks.filter(t => t.status === "Completed").length;

    // Priority Metrics
    const urgentTasksCount = tasks.filter(t => t.priority === "Urgent").length;
    const highTasksCount = tasks.filter(t => t.priority === "High").length;
    const mediumTasksCount = tasks.filter(t => t.priority === "Medium").length;
    const lowTasksCount = tasks.filter(t => t.priority === "Low").length;
    const backlogTasksCount = tasks.filter(t => t.priority === "Backlog").length;

    // Chart Data Processing: Filtered to remove missing statuses
    const taskStatusCount = tasks
        .filter(task => task.status)
        .reduce((acc, task) => {
            const status = task.status as string;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

    const pieChartData = Object.entries(taskStatusCount).map(([name, value]) => ({
        name,
        value,
    }));

    const taskPriorityCount = tasks.reduce((acc, task) => {
        const priority = task.priority || "Unassigned";
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const barChartData = Object.entries(taskPriorityCount).map(([name, count]) => ({
        name,
        count,
    }));

    // Upcoming Deadlines Processing
    const upcomingTasks = [...tasks]
        .filter(t => t.status !== "Completed" && t.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
        .slice(0, 5);

    return (
        <div className="w-full px-8 py-8">
            <Header name="My Dashboard" />

            {/* 8-Card KPI Grid */}
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">

                {/* Row 1: Core Metrics & Backlog */}
                <div className="flex items-center rounded-xl border border-brand-500 bg-brand-200 p-8 shadow-sm">
                    <div className="rounded-full bg-blue-100 p-4 text-blue-700">
                        <Briefcase className="h-8 w-8" />
                    </div>
                    <div className="ml-5">
                        <p className="text-base font-semibold text-brand-700">Active Projects</p>
                        <p className="text-3xl font-bold text-brand-900">{activeProjectsCount}</p>
                    </div>
                </div>

                <div className="flex items-center rounded-xl border border-brand-500 bg-brand-200 p-8 shadow-sm">
                    <div className="rounded-full bg-indigo-100 p-4 text-indigo-700">
                        <Clock className="h-8 w-8" />
                    </div>
                    <div className="ml-5">
                        <p className="text-base font-semibold text-brand-700">Total Tasks</p>
                        <p className="text-3xl font-bold text-brand-900">{tasks.length}</p>
                    </div>
                </div>

                <div className="flex items-center rounded-xl border border-brand-500 bg-brand-200 p-8 shadow-sm">
                    <div className="rounded-full bg-emerald-100 p-4 text-emerald-700">
                        <CheckCircle className="h-8 w-8" />
                    </div>
                    <div className="ml-5">
                        <p className="text-base font-semibold text-brand-700">Completed</p>
                        <p className="text-3xl font-bold text-brand-900">{completedTasksCount}</p>
                    </div>
                </div>

                <div className="flex items-center rounded-xl border border-brand-500 bg-brand-200 p-8 shadow-sm">
                    <div className="rounded-full bg-slate-200 p-4 text-slate-700">
                        <Archive className="h-8 w-8" />
                    </div>
                    <div className="ml-5">
                        <p className="text-base font-semibold text-brand-700">Backlog</p>
                        <p className="text-3xl font-bold text-brand-900">{backlogTasksCount}</p>
                    </div>
                </div>

                {/* Row 2: Active Priorities */}
                <div className="flex items-center rounded-xl border border-brand-500 bg-brand-200 p-8 shadow-sm">
                    <div className="rounded-full bg-red-100 p-4 text-red-700">
                        <AlertTriangle className="h-8 w-8" />
                    </div>
                    <div className="ml-5">
                        <p className="text-base font-semibold text-brand-700">Urgent</p>
                        <p className="text-3xl font-bold text-brand-900">{urgentTasksCount}</p>
                    </div>
                </div>

                <div className="flex items-center rounded-xl border border-brand-500 bg-brand-200 p-8 shadow-sm">
                    <div className="rounded-full bg-orange-100 p-4 text-orange-700">
                        <ArrowUpCircle className="h-8 w-8" />
                    </div>
                    <div className="ml-5">
                        <p className="text-base font-semibold text-brand-700">High Priority</p>
                        <p className="text-3xl font-bold text-brand-900">{highTasksCount}</p>
                    </div>
                </div>

                <div className="flex items-center rounded-xl border border-brand-500 bg-brand-200 p-8 shadow-sm">
                    <div className="rounded-full bg-amber-100 p-4 text-amber-700">
                        <MinusCircle className="h-8 w-8" />
                    </div>
                    <div className="ml-5">
                        <p className="text-base font-semibold text-brand-700">Medium Priority</p>
                        <p className="text-3xl font-bold text-brand-900">{mediumTasksCount}</p>
                    </div>
                </div>

                <div className="flex items-center rounded-xl border border-brand-500 bg-brand-200 p-8 shadow-sm">
                    <div className="rounded-full bg-cyan-100 p-4 text-cyan-700">
                        <ArrowDownCircle className="h-8 w-8" />
                    </div>
                    <div className="ml-5">
                        <p className="text-base font-semibold text-brand-700">Low Priority</p>
                        <p className="text-3xl font-bold text-brand-900">{lowTasksCount}</p>
                    </div>
                </div>

            </div>

            {/* Charts Section */}
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">

                {/* Status Pie Chart */}
                <div className="rounded-xl border border-brand-500 bg-brand-200 p-8 shadow-sm">
                    <h3 className="mb-6 text-xl font-bold text-brand-900">Task Status Distribution</h3>
                    <div className="h-96 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={90}
                                    outerRadius={130}
                                    paddingAngle={4}
                                    cornerRadius={6}
                                    stroke="none"
                                    dataKey="value"
                                >
                                    {pieChartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={STATUS_COLORS[entry.name] || "#94a3b8"}
                                            stroke="none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    isAnimationActive={false}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border-none bg-brand-900 px-4 py-3 text-sm text-brand-200 shadow-md outline-none">
                                                    <span className="font-medium">{payload[0].name}</span>: {payload[0].value}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Legend verticalAlign="bottom" height={40} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Priority Bar Chart */}
                <div className="rounded-xl border border-brand-500 bg-brand-200 p-8 shadow-sm">
                    <h3 className="mb-6 text-xl font-bold text-brand-900">Tasks by Priority</h3>
                    <div className="h-96 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#334155' }} />
                                <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#334155' }} />
                                <Tooltip
                                    cursor={{ fill: '#e2e8f0' }}
                                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: 'none', color: '#1e1e1e' }}
                                />
                                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Upcoming Deadlines List */}
            <div className="mt-8">
                <div className="overflow-hidden rounded-xl border border-brand-500 bg-brand-200 shadow-sm">
                    <div className="border-b border-brand-500 p-6 sm:p-8">
                        <h3 className="text-xl font-bold text-brand-900">Upcoming Deadlines</h3>
                    </div>

                    {upcomingTasks.length === 0 ? (
                        <div className="p-8">
                            <p className="text-base text-brand-700">No upcoming deadlines.</p>
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead className="border-b border-brand-500 bg-brand-300/50 text-sm text-brand-800">
                                    <tr>
                                        <th className="p-4 pl-8 font-semibold">Task</th>
                                        <th className="p-4 font-semibold">Assignee</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold">Priority</th>
                                        <th className="p-4 pr-8 text-right font-semibold">Due Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-500">
                                    {upcomingTasks.map((task) => (
                                        <tr key={task.id} className="transition-colors hover:bg-brand-300/30">
                                            {/* Task Column */}
                                            <td className="p-4 pl-8">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-bold text-brand-900">{task.title}</span>
                                                    <span className="mt-1 text-sm text-brand-700">
                                                        {task.project?.name || `Project #${task.projectId}`}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Assignee Column */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-brand-900 border border-brand-600">
                                                        {task.assignee?.username?.substring(0, 2).toUpperCase() || "?"}
                                                    </div>
                                                    <span className="text-sm font-medium text-brand-900">
                                                        {task.assignee?.username || "Unassigned"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status Column */}
                                            <td className="p-4">
                                                <span className="inline-flex rounded-full border border-brand-400 bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800">
                                                    {task.status || "Unknown"}
                                                </span>
                                            </td>

                                            {/* Priority Column */}
                                            <td className="p-4">
                                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${task.priority === 'Urgent' ? 'border-red-300 bg-red-100 text-red-800' :
                                                    task.priority === 'High' ? 'border-orange-300 bg-orange-100 text-orange-800' :
                                                        task.priority === 'Medium' ? 'border-amber-300 bg-amber-100 text-amber-800' :
                                                            task.priority === 'Low' ? 'border-cyan-300 bg-cyan-100 text-cyan-800' :
                                                                'border-slate-300 bg-slate-100 text-slate-800'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            </td>

                                            {/* Due Date Column */}
                                            <td className="p-4 pr-8 text-right">
                                                <span className="inline-flex items-center rounded-full border border-brand-500 bg-brand-500 px-3 py-1 text-sm font-semibold text-brand-900">
                                                    {new Date(task.dueDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default HomePage;