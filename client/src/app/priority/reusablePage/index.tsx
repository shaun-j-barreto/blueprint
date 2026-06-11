"use client";

import Header from "@/components/Header";
import ModalNewTask from "@/components/ModalNewTask";
import TaskCard from "@/components/TaskCard";
import { Priority, Task, useGetTasksByUserQuery } from "@/state/api";
import { useState } from "react";

type Props = {
    priority: Priority;
};

const ReusablePage = ({ priority }: Props) => {
    const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);

    const userId = 1;
    const {
        data: tasks,
        isLoading,
        isError: isTasksError,
    } = useGetTasksByUserQuery(userId || 0, {
        skip: userId === null,
    });

    const filteredTasks = tasks?.filter(
        (task: Task) => task.priority === priority,
    );

    if (isTasksError || !tasks) return <div>Error fetching tasks</div>;

    return (
        <div className="m-5 p-4">
            <ModalNewTask
                isOpen={isModalNewTaskOpen}
                onClose={() => setIsModalNewTaskOpen(false)}
            />

            <Header
                name="Priority Page"
                buttonComponent={
                    <button
                        className="flex cursor-pointer items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-brand-900 shadow-sm transition-colors hover:bg-brand-800 hover:text-brand-200"
                        onClick={() => setIsModalNewTaskOpen(true)}
                    >
                        Add Task
                    </button>
                }
            />

            {isLoading ? (
                <div>Loading tasks...</div>
            ) : (
                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTasks?.length === 0 ? (
                        <div className="text-gray-500">No tasks found for this priority.</div>
                    ) : (
                        filteredTasks?.map((task: Task) => (
                            <TaskCard key={task.id} task={task} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default ReusablePage;