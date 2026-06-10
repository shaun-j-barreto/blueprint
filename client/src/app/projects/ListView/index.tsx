import Header from "@/components/Header";
import TaskCard from "@/components/TaskCard";
import { Task, useGetTasksQuery } from "@/state/api";
import React from "react";

type ListProps = {
    id: string;
    setIsModalNewTaskOpen: (isOpen: boolean) => void;
};

const ListView = ({ id, setIsModalNewTaskOpen }: ListProps) => {
    const projectId = Number(id);

    const {
        data: tasks,
        isLoading,
        error,
    } = useGetTasksQuery(
        { projectId },
        { skip: isNaN(projectId) }, // Prevents query execution if id is invalid
    );

    if (isNaN(projectId))
        return <div className="p-4">Invalid Project Identifier</div>;
    if (isLoading) return <div className="p-4">Loading Tasks...</div>;
    if (error)
        return (
            <div className="p-4 text-red-500">
                An error has occurred while retrieving tasks
            </div>
        );

    return (
        <div className="px-4 pb-8 xl:px-6">
            <div className="pt-5">
                <Header
                    name="List"
                    buttonComponent={
                        <button
                            className="flex items-center justify-center rounded-lg  px-4 py-2 text-xs font-bold  shadow-sm bg-brand-600 text-brand-900 hover:bg-brand-800 hover:text-brand-200 cursor-pointer transition-colors"
                        >
                            Add New Task
                        </button>
                    }
                    isSmallText
                />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {tasks?.map((task: Task) => (
                    <TaskCard key={task.id} task={task} />
                ))}
            </div>
        </div>
    );
};

export default ListView;
