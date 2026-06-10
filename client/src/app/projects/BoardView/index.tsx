import {
    Priority,
    useGetTasksQuery,
    useUpdateTaskStatusMutation,
} from "@/state/api";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Task as TaskType } from "@/state/api";
import { EllipsisVertical, MessageSquareMore, Plus } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

type BoardProps = {
    id: string;
    setIsModalNewTaskOpen: (isOpen: boolean) => void;
};

type TaskColumnProps = {
    status: string;
    tasks: TaskType[];
    moveTask: (taskId: number, toStatus: string) => void;
    setIsModalNewTaskOpen: (isOpen: boolean) => void;
};

const taskStatus = ["To Do", "Work In Progress", "Under Review", "Completed"];

const BoardView = ({ id, setIsModalNewTaskOpen }: BoardProps) => {
    const projectId = Number(id);

    const {
        data: tasks,
        isLoading,
        error,
    } = useGetTasksQuery(
        { projectId },
        { skip: isNaN(projectId) }, // Prevents query execution if id is invalid
    );

    const [updateTaskstatus] = useUpdateTaskStatusMutation();

    const moveTask = (taskId: number, toStatus: string) => {
        updateTaskstatus({ taskId, status: toStatus });
    };

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
        <DndProvider backend={HTML5Backend}>
            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
                {taskStatus.map((status) => (
                    <TaskColumn
                        key={status}
                        status={status}
                        tasks={tasks || []}
                        moveTask={moveTask}
                        setIsModalNewTaskOpen={setIsModalNewTaskOpen}
                    />
                ))}
            </div>
        </DndProvider>
    );
};

const TaskColumn = ({
    status,
    tasks,
    moveTask,
    setIsModalNewTaskOpen,
}: TaskColumnProps) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: "task",
        drop: (item: { id: number }) => moveTask(item.id, status),
        collect: (monitor: any) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    const tasksCount = tasks.filter((task) => task.status === status).length;

    const statusColor: Record<string, string> = {
        "To Do": "#2563EB",
        "Work In Progress": "#0EA5E9",
        "Under Review": "#D97706",
        "Completed": "#16A34A"
    };

    return (
        <div
            ref={(instance) => {
                drop(instance);
            }}
            className={`rounded-lg py-2 sm:py-4 xl:px-2 ${isOver ? "bg-brand-200" : ""}`}
        >
            {/* Parent layout container element with unified styling */}
            <div className="bg-brand-100 mb-3 flex w-full overflow-hidden rounded-lg border border-brand-500 shadow-sm">
                {/* 1. Sibling Element: Colored Accent Strip indicator line */}
                <div
                    className="w-2 flex-shrink-0"
                    style={{ backgroundColor: statusColor[status] }}
                />

                {/* 2. Sibling Element: Main text metrics area */}
                <div className="flex w-full items-center justify-between px-5 py-4">
                    <h3 className="text-brand-900 flex items-center gap-2 text-lg font-semibold">
                        {status}
                        <span className="bg-brand-500 text-brand-900 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
                            {tasksCount}
                        </span>
                    </h3>
                    <div className="flex items-center gap-1">
                        <button className="text-brand-900 flex h-6 w-5 cursor-pointer items-center justify-center">
                            <EllipsisVertical size={26} />
                        </button>
                        <button
                            className="bg-brand-600 text-brand-900 flex h-6 w-6 cursor-pointer items-center justify-center rounded"
                            onClick={() => setIsModalNewTaskOpen(true)}
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
            </div>
            {tasks
                .filter((task) => task.status === status)
                .map((task) => (
                    <Task key={task.id} task={task} />
                ))}
        </div>
    );
};

type TaskProps = {
    task: TaskType;
};

const Task = ({ task }: TaskProps) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "task",
        item: { id: task.id },
        collect: (monitor: any) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const taskTagsSplit = task.tags ? task.tags.split(",") : [];

    const formattedStartDate = task.startDate
        ? format(new Date(task.startDate), "P")
        : "";
    const formattedDueDate = task.dueDate
        ? format(new Date(task.dueDate), "P")
        : "";

    const numberOfComments = (task.comments && task.comments.length) || 0;

    return (
        <div
            ref={(instance) => {
                drag(instance);
            }}
            className={`bg-brand-200 border-brand-500/80 mb-4 rounded-md border shadow ${isDragging ? "opacity-50" : "opacity-100"}`}
        >
            {task.attachments && task.attachments.length > 0 && (
                <Image
                    src={`/${task.attachments[0].fileUrl}`}
                    alt="Task Image"
                    width={400}
                    height={400}
                    className="h-auto w-full rounded-t-md"
                />
            )}
            <div className="p-4 md:p-6">
                <div className="flex items-start justify-between">
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                        {task.priority && <PriorityTag priority={task.priority} />}
                        <div className="flex gap-2">
                            {taskTagsSplit.map((tag) => (
                                <div
                                    key={tag}
                                    className="bg-brand-600 text-brand-900 rounded-full px-2 py-1 text-xs"
                                >
                                    {tag}
                                </div>
                            ))}
                        </div>
                    </div>
                    <button className="text-brand-900 flex h-6 w-4 shrink-0 cursor-pointer items-center justify-center">
                        <EllipsisVertical size={26} />
                    </button>
                </div>
                <div className="my-3 flex justify-between">
                    <h4 className="text-md font bold text-brand-900">{task.title}</h4>
                    {typeof task.points === "number" && (
                        <div className="text-brand-900 text-xs font-semibold">
                            {task.points} pts
                        </div>
                    )}
                </div>
                <div className="text-brand-800 text-xs">
                    {formattedStartDate && <span>{formattedStartDate} - </span>}
                    {formattedDueDate && <span>{formattedDueDate}</span>}
                </div>
                <p className="text-brand-900 text-sm">{task.description}</p>
                <div className="border-brand-600 mt-4 border-t">
                    {/* Users */}
                    <div className="mt-3 flex items-center justify-between">
                        <div className="flex -space-x-[6px] overflow-hidden">
                            {task.assignee && (
                                <Image
                                    key={task.assignee.userId}
                                    src={`/${task.assignee.profilePictureUrl!}`}
                                    alt="Assignee Avatar"
                                    width={30}
                                    height={30}
                                    className="borders-2 border-brand-600 oject-cover h-8 w-8 rounded-full"
                                />
                            )}
                            {task.author && (
                                <Image
                                    key={task.author.userId}
                                    src={`/${task.author.profilePictureUrl!}`}
                                    alt="author avatar"
                                    width={30}
                                    height={30}
                                    className="borders-2 border-brand-600 oject-cover h-8 w-8 rounded-full"
                                />
                            )}
                        </div>
                        <div className=" flex items-center text-brand-800">
                            <MessageSquareMore size={20} />
                            <span className="ml-1 text-sm text-brand-800">
                                {numberOfComments}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PriorityTag = ({ priority }: { priority: TaskType["priority"] }) => (
    <div
        className={`rounded-full px-2 py-1 text-xs font-semibold ${priority === "Urgent" ? "bg-red-200 text-red-700" : priority === "High" ? "bg-orange-200 text-orange-700" : priority === "Medium" ? "bg-green-200 text-green-700" : priority === "Low" ? "bg-blue-200 text-blue-700" : "bg-gray-200 text-gray-700"}`}
    >
        {priority}
    </div>
);

export default BoardView;
