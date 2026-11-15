import { useAppSelector } from "@/app/redux";
import {
    StatusChip,
    PriorityChip,
    TagChips,
    UserAvatar,
} from "@/components/TaskChips";
import ModalEditTask from "@/components/ModalEditTask";
import { useProjectPermissions } from "@/lib/permissions";
import { priorityRank, statusRank, taskDateInfo } from "@/lib/taskStyles";
import {
    taskDataGridClassNames,
    taskDataGridSxStyles,
} from "@/lib/utils";
import { Task, useDeleteTaskMutation, useGetTasksQuery } from "@/state/api";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import React, { useMemo, useState } from "react";
import {
    AlertCircle,
    AlertTriangle,
    CalendarDays,
    Loader2,
    MessageSquare,
    Paperclip,
    Pencil,
    Plus,
    Target,
    Trash2,
} from "lucide-react";

type Props = {
    id: string;
    setIsModalNewTaskOpen: (isOpen: boolean) => void;
};

const EMPTY_VALUE = (
    <span className="text-brand-700/50 dark:text-brand-700 text-xs">—</span>
);

const TaskRowActions = ({ task }: { task: Task }) => {
    const [deleteTask, { isLoading }] = useDeleteTaskMutation();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const { canContribute, user } = useProjectPermissions(task.projectId);
    const canDelete = canContribute || task.authorUserId === user?.id;

    const handleDelete = async () => {
        if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`))
            return;

        try {
            await deleteTask(task.id).unwrap();
        } catch {
            window.alert("Failed to delete the task. Please try again.");
        }
    };

    if (!canContribute && !canDelete) return null;

    return (
        <div className="task-row-actions flex items-center gap-0.5">
            {canContribute && (
                <button
                    type="button"
                    onClick={() => setIsEditOpen(true)}
                    title="Edit task"
                    aria-label={`Edit task ${task.title}`}
                    className="text-brand-800 hover:bg-brand-400 hover:text-brand-900 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors"
                >
                    <Pencil className="h-3.5 w-3.5" />
                </button>
            )}
            {canDelete && (
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isLoading}
                    title="Delete task"
                    aria-label={`Delete task ${task.title}`}
                    className="text-brand-800 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            )}
            {isEditOpen && (
                <ModalEditTask
                    isOpen={isEditOpen}
                    task={task}
                    onClose={() => setIsEditOpen(false)}
                />
            )}
        </div>
    );
};

const columns: GridColDef<Task>[] = [
    {
        field: "title",
        headerName: "Task",
        flex: 1,
        minWidth: 260,
        renderCell: (params) => {
            const task = params.row;
            const attachmentCount = task.attachments?.length ?? 0;
            const commentCount = task.comments?.length ?? 0;

            return (
                <div className="flex min-w-0 items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                            <span
                                className="text-brand-900 truncate text-[13px] font-semibold tracking-[-0.01em]"
                                title={task.title}
                            >
                                {task.title}
                            </span>
                        </div>

                        {task.description?.trim() && (
                            <p
                                className="text-brand-800/75 dark:text-brand-800 mt-0.5 truncate text-[11px] leading-relaxed"
                                title={task.description}
                            >
                                {task.description}
                            </p>
                        )}

                        <div className="text-brand-700 mt-1 flex min-w-0 items-center gap-2.5 text-[10px] font-medium">
                            {task.author && (
                                <UserAvatar
                                    user={task.author}
                                    size="xs"
                                    title={`Created by ${task.author.username}`}
                                />
                            )}
                            <span className="shrink-0 font-mono">
                                #{task.id}
                            </span>
                            {attachmentCount > 0 && (
                                <span
                                    className="inline-flex shrink-0 items-center gap-0.5"
                                    title={`${attachmentCount} attachment${
                                        attachmentCount === 1 ? "" : "s"
                                    }`}
                                >
                                    <Paperclip className="h-3 w-3" />
                                    {attachmentCount}
                                </span>
                            )}
                            {commentCount > 0 && (
                                <span
                                    className="inline-flex shrink-0 items-center gap-0.5"
                                    title={`${commentCount} comment${
                                        commentCount === 1 ? "" : "s"
                                    }`}
                                >
                                    <MessageSquare className="h-3 w-3" />
                                    {commentCount}
                                </span>
                            )}
                            {typeof task.points === "number" && (
                                <span
                                    className="inline-flex shrink-0 items-center gap-0.5"
                                    title={`${task.points} points`}
                                >
                                    <Target className="h-3 w-3" />
                                    {task.points} pts
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            );
        },
    },
    {
        field: "status",
        headerName: "Status",
        width: 150,
        sortComparator: (a, b) =>
            (statusRank[a as string] ?? 99) - (statusRank[b as string] ?? 99),
        renderCell: (params) =>
            params.row.status ? (
                <StatusChip status={params.row.status} />
            ) : (
                EMPTY_VALUE
            ),
    },
    {
        field: "priority",
        headerName: "Priority",
        width: 120,
        sortComparator: (a, b) =>
            (priorityRank[a as string] ?? 99) -
            (priorityRank[b as string] ?? 99),
        renderCell: (params) =>
            params.row.priority ? (
                <PriorityChip priority={params.row.priority} />
            ) : (
                EMPTY_VALUE
            ),
    },
    {
        field: "assignee",
        headerName: "Assignee",
        width: 168,
        valueGetter: (_value, row) => row.assignee?.username ?? "",
        renderCell: (params) => {
            const assignee = params.row.assignee;

            return (
                <div className="flex min-w-0 items-center gap-2">
                    <UserAvatar
                        user={assignee}
                        size="sm"
                        title={
                            assignee
                                ? `Assigned to ${assignee.username}`
                                : "Unassigned"
                        }
                    />
                    <span
                        className={`truncate text-xs font-medium ${
                            assignee
                                ? "text-brand-900"
                                : "text-brand-700 dark:text-brand-800"
                        }`}
                        title={assignee?.username ?? "Unassigned"}
                    >
                        {assignee?.username ?? "Unassigned"}
                    </span>
                </div>
            );
        },
    },
    {
        field: "schedule",
        headerName: "Schedule",
        width: 172,
        valueGetter: (_value, row) => {
            const value = row.dueDate ?? row.startDate;

            if (!value) return 0;

            const date = new Date(value);

            return isNaN(date.getTime()) ? 0 : date.getTime();
        },
        renderCell: (params) => {
            const dates = taskDateInfo(params.row);

            if (!dates.label) {
                return (
                    <span className="text-brand-700/60 dark:text-brand-700 text-xs">
                        Not scheduled
                    </span>
                );
            }

            return (
                <span
                    className={`inline-flex min-w-0 items-center gap-1.5 text-xs ${
                        dates.overdue
                            ? "font-medium text-red-600 dark:text-red-400"
                            : "text-brand-800"
                    }`}
                    title={dates.overdue ? "Overdue" : dates.label}
                >
                    {dates.overdue ? (
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate">{dates.label}</span>
                </span>
            );
        },
    },
    {
        field: "tags",
        headerName: "Tags",
        width: 168,
        renderCell: (params) => {
            const tags = params.row.tags?.trim();

            return tags ? (
                <TagChips tags={tags} max={2} />
            ) : (
                EMPTY_VALUE
            );
        },
    },
    {
        field: "actions",
        headerName: "Actions",
        width: 96,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        resizable: false,
        align: "right",
        renderCell: (params) => <TaskRowActions task={params.row} />,
    },
];

const TableView = ({ id, setIsModalNewTaskOpen }: Props) => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

    const projectId = Number(id);
    const queryArgs = useMemo(() => ({ projectId }), [projectId]);
    const { canContribute } = useProjectPermissions(projectId);

    const {
        data: tasks,
        error,
        isLoading,
        refetch,
    } = useGetTasksQuery(queryArgs, { skip: isNaN(projectId) });

    if (isNaN(projectId))
        return (
            <div className="text-brand-900 p-6 font-medium">
                Invalid Project Identifier
            </div>
        );

    if (isLoading)
        return (
            <div className="px-4 pb-8 xl:px-6">
                <div className="border-brand-500/80 bg-brand-100 flex h-[540px] flex-col items-center justify-center gap-3 rounded-2xl border">
                    <Loader2 className="text-brand-700 h-5 w-5 animate-spin" />
                    <p className="text-brand-700 text-xs font-medium">
                        Loading tasks…
                    </p>
                </div>
            </div>
        );

    if (error || !tasks)
        return (
            <div className="px-4 pb-8 xl:px-6">
                <div className="border-brand-500/80 bg-brand-100 flex h-[540px] flex-col items-center justify-center gap-3 rounded-2xl border px-6 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        <AlertTriangle className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="text-brand-900 text-sm font-semibold">
                            Could not load tasks
                        </p>
                        <p className="text-brand-700 mt-1 text-xs">
                            An error occurred while fetching this project’s
                            tasks.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="border-brand-500 text-brand-800 hover:bg-brand-300 mt-1 cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );

    const addTaskButton = canContribute ? (
        <button
            type="button"
            onClick={() => setIsModalNewTaskOpen(true)}
            className="bg-brand-600 text-brand-900 hover:bg-brand-800 hover:text-brand-200 flex cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-xs font-bold shadow-sm transition-colors"
        >
            Add New Task
        </button>
    ) : null;

    return (
        <div className="px-4 pb-8 xl:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3 pt-5 pb-4">
                <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-brand-900 text-lg font-semibold">
                            Table
                        </h2>
                        <span className="border-brand-500/70 bg-brand-200 text-brand-700 rounded-full border px-2 py-0.5 text-[11px] font-semibold">
                            {tasks.length}{" "}
                            {tasks.length === 1 ? "task" : "tasks"}
                        </span>
                    </div>
                    <p className="text-brand-700 mt-1 text-xs">
                        Sort, page and manage every task in this project.
                    </p>
                </div>
                {addTaskButton}
            </div>

            <div className="h-[540px] w-full">
                <DataGrid<Task>
                    rows={tasks}
                    columns={columns}
                    className={taskDataGridClassNames}
                    sx={taskDataGridSxStyles(isDarkMode)}
                    rowHeight={80}
                    columnHeaderHeight={44}
                    hideFooter={tasks.length <= 10}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 10, page: 0 },
                        },
                    }}
                    pageSizeOptions={[10, 25, 50]}
                    disableRowSelectionOnClick
                    disableColumnResize
                    disableColumnMenu
                    getRowClassName={() => "group/row"}
                    slots={{
                        noRowsOverlay: () => (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
                                <span className="bg-brand-300 text-brand-700 flex h-11 w-11 items-center justify-center rounded-full">
                                    <Plus className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-brand-900 text-sm font-semibold">
                                        No tasks yet
                                    </p>
                                    <p className="text-brand-700 mt-1 max-w-xs text-xs leading-relaxed">
                                        Create your first task to see it appear
                                        here and on the board.
                                    </p>
                                </div>
                                {addTaskButton}
                            </div>
                        ),
                    }}
                />
            </div>
        </div>
    );
};

export default TableView;
