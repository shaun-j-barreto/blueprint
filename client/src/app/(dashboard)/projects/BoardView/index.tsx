import {
    useGetTasksQuery,
    useUpdateTaskStatusMutation,
} from "@/state/api";
import {
    DndProvider,
    useDrag,
    useDrop,
    type DragSourceMonitor,
    type DropTargetMonitor,
} from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Task as TaskType } from "@/state/api";
import { Plus } from "lucide-react";
import TaskCard from "@/components/TaskCard";
import { useProjectPermissions } from "@/lib/permissions";
import { statusMeta } from "@/lib/taskStyles";

type BoardProps = {
    id: string;
    setIsModalNewTaskOpen: (isOpen: boolean) => void;
};

type TaskColumnProps = {
    status: string;
    tasks: TaskType[];
    moveTask: (taskId: number, toStatus: string) => void;
    setIsModalNewTaskOpen: (isOpen: boolean) => void;
    canContribute: boolean;
};

const taskStatus = ["To Do", "Work In Progress", "Under Review", "Completed"];

const BoardView = ({ id, setIsModalNewTaskOpen }: BoardProps) => {
    const projectId = Number(id);
    const { canContribute } = useProjectPermissions(projectId);

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
            <div className="grid grid-cols-1 items-start gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
                {taskStatus.map((status) => (
                    <TaskColumn
                        key={status}
                        status={status}
                        tasks={tasks || []}
                        moveTask={moveTask}
                        setIsModalNewTaskOpen={setIsModalNewTaskOpen}
                        canContribute={canContribute}
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
    canContribute,
}: TaskColumnProps) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: "task",
        drop: (item: { id: number }) => moveTask(item.id, status),
        collect: (monitor: DropTargetMonitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    const columnTasks = tasks.filter((task) => task.status === status);
    const meta = statusMeta[status];

    return (
        <div
            ref={(instance) => {
                drop(instance);
            }}
            className={`rounded-2xl border p-2.5 transition-colors duration-150 ${
                isOver
                    ? "border-brand-600 bg-brand-300/70 ring-brand-600/15 ring-2"
                    : "border-brand-500/60 bg-brand-200/60"
            }`}
        >
            <div className="mb-2 flex items-center justify-between gap-2 px-1 pt-0.5">
                <div className="flex min-w-0 items-center gap-2">
                    <span
                        className={`h-2 w-2 shrink-0 rounded-full ${meta?.dot ?? "bg-brand-600"}`}
                    />
                    <h3 className="text-brand-900 truncate text-sm font-semibold">
                        {status}
                    </h3>
                    <span className="bg-brand-400 text-brand-700 dark:bg-white/5 dark:text-brand-800 shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold">
                        {columnTasks.length}
                    </span>
                </div>
                {canContribute && (
                    <button
                        type="button"
                        onClick={() => setIsModalNewTaskOpen(true)}
                        title={`Add task to ${status}`}
                        aria-label={`Add task to ${status}`}
                        className="text-brand-700 hover:bg-brand-400 hover:text-brand-900 dark:text-brand-800 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                )}
            </div>

            <div className="min-h-[72px]">
                {columnTasks.map((task) => (
                    <Task
                        key={task.id}
                        task={task}
                        canContribute={canContribute}
                    />
                ))}

                {columnTasks.length === 0 && (
                    <div className="border-brand-500 text-brand-700 dark:text-brand-800 rounded-xl border border-dashed px-3 py-7 text-center text-xs">
                        Drop tasks here
                    </div>
                )}
            </div>
        </div>
    );
};

type TaskProps = {
    task: TaskType;
    canContribute: boolean;
};

const Task = ({ task, canContribute }: TaskProps) => {
    const [{ isDragging }, drag] = useDrag(
        () => ({
            type: "task",
            item: { id: task.id },
            canDrag: canContribute,
            collect: (monitor: DragSourceMonitor) => ({
                isDragging: !!monitor.isDragging(),
            }),
        }),
        [canContribute],
    );

    return (
        <div
            ref={(instance) => {
                drag(instance);
            }}
            className="mb-2.5 last:mb-0"
        >
            <TaskCard task={task} variant="board" isDragging={isDragging} />
        </div>
    );
};

export default BoardView;
