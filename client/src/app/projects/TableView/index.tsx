import { useAppSelector } from "@/app/redux";
import Header from "@/components/Header";
import { dataGridClassNames, dataGridSxStyles } from "@/lib/utils";
import { useGetTasksQuery } from "@/state/api";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import React, { useMemo } from "react";
import { format } from "date-fns";

type Props = {
    id: string;
    setIsModalNewTaskOpen: (isOpen: boolean) => void;
};

const columns: GridColDef[] = [
    {
        field: "title",
        headerName: "Title",
        width: 150,
    },
    {
        field: "description",
        headerName: "Description",
        width: 250,
    },
    {
        field: "status",
        headerName: "Status",
        width: 150,
        renderCell: (params) => {
            const colorMap: Record<string, string> = {
                "To Do": "bg-[#2563EB] text-white",
                "Work In Progress": "bg-[#0EA5E9] text-white",
                "Under Review": "bg-[#D97706] text-white",
                "Completed": "bg-[#16A34A] text-white",
            };

            const colorClass = colorMap[params.value as string] || "bg-gray-100 text-gray-800";

            return (
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${colorClass}`}>
                    {params.value}
                </span>
            );
        },
    },
    {
        field: "priority",
        headerName: "Priority",
        width: 90,
    },
    {
        field: "tags",
        headerName: "Tags",
        width: 130,
    },
    {
        field: "startDate",
        headerName: "Start Date",
        width: 110,
        renderCell: (params) => params.value ? format(new Date(params.value), "dd/MM/yyyy") : "Not set",
    },
    {
        field: "dueDate",
        headerName: "Due Date",
        width: 110,
        renderCell: (params) => params.value ? format(new Date(params.value), "dd/MM/yyyy") : "Not set",
    },
    {
        field: "author",
        headerName: "Author",
        width: 120,
        renderCell: (params) => params.row?.author?.username || "Unknown",
    },
    {
        field: "assignee",
        headerName: "Assignee",
        width: 120,
        renderCell: (params) => params.row?.assignee?.username || "Unassigned",
    },
];

const TableView = ({ id, setIsModalNewTaskOpen }: Props) => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

    const projectId = Number(id);
    const queryArgs = useMemo(() => ({ projectId }), [projectId]);

    const {
        data: tasks,
        error,
        isLoading,
    } = useGetTasksQuery(queryArgs, { skip: isNaN(projectId) });

    if (isNaN(projectId)) return <div className="p-6 font-medium text-brand-900">Invalid Project Identifier</div>;
    if (isLoading) return <div className="p-6 font-medium text-brand-900">Loading Table...</div>;
    if (error || !tasks) return <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">An error occurred while fetching tasks</div>;

    return (
        <div className="h-[540px] w-full px-4 pb-8 xl:px-6">
            <div className="pt-5 pb-4">
                <Header
                    name="Data Table"
                    buttonComponent={
                        <button
                            className="flex items-center justify-center rounded-lg bg-brand-600 text-brand-900 hover:bg-brand-800 hover:text-brand-200 px-4 py-2 text-xs font-bold shadow-sm cursor-pointer transition-colors"
                            onClick={() => setIsModalNewTaskOpen(true)}
                        >
                            Add New Task
                        </button>
                    }
                    isSmallText
                />
            </div>
            <DataGrid
                rows={tasks || []}
                columns={columns}
                className={dataGridClassNames}
                sx={dataGridSxStyles(isDarkMode)}
                disableRowSelectionOnClick
            />
        </div>
    );
};

export default TableView;