"use client";

import Modal from "@/components/Modal";
import {
    Priority,
    Status,
    Task,
    User,
    useGetProjectsQuery,
    useGetUsersQuery,
    useUpdateTaskMutation,
} from "@/state/api";
import { useMemo, useState } from "react";
import {
    dateInputStyles,
    inputStyles,
    labelStyles,
    selectStyles,
    toDateInputValue,
    toIsoDateOrNull,
} from "@/components/taskFormStyles";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
};

const statusOptions = [
    Status.ToDo,
    Status.WorkInProgress,
    Status.UnderReview,
    Status.Completed,
];

const priorityOptions = [
    Priority.Urgent,
    Priority.High,
    Priority.Medium,
    Priority.Low,
    Priority.Backlog,
];

const ModalEditTask = ({ isOpen, onClose, task }: Props) => {
    const [updateTask, { isLoading }] = useUpdateTaskMutation();
    const {
        data: users = [],
        isLoading: isUsersLoading,
        isError: isUsersError,
    } = useGetUsersQuery();
    const { data: projects } = useGetProjectsQuery();

    const [title, setTitle] = useState(task.title ?? "");
    const [description, setDescription] = useState(task.description ?? "");
    const [status, setStatus] = useState<Status>(
        task.status ?? Status.ToDo,
    );
    const [priority, setPriority] = useState<Priority>(
        task.priority ?? Priority.Backlog,
    );
    const [tags, setTags] = useState(task.tags ?? "");
    const [startDate, setStartDate] = useState(toDateInputValue(task.startDate));
    const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));
    const [authorUserId, setAuthorUserId] = useState(
        task.authorUserId ? String(task.authorUserId) : "",
    );
    const [assignedUserId, setAssignedUserId] = useState(
        task.assignedUserId ? String(task.assignedUserId) : "",
    );
    const [points, setPoints] = useState(
        typeof task.points === "number" ? String(task.points) : "",
    );
    const [error, setError] = useState("");

    const sortedUsers = useMemo(
        () =>
            [...users]
                .filter(
                    (user): user is User & { userId: number } =>
                        typeof user.userId === "number",
                )
                .sort((a, b) => a.username.localeCompare(b.username)),
        [users],
    );

    // Keep the current author visible even if that user is no longer returned
    // by the users endpoint, so opening the form never changes the value.
    const authorOptions = useMemo(() => {
        if (
            task.authorUserId &&
            !sortedUsers.some((user) => user.userId === task.authorUserId)
        ) {
            return [
                {
                    userId: task.authorUserId,
                    username: task.author?.username ?? `User #${task.authorUserId}`,
                },
                ...sortedUsers,
            ];
        }
        return sortedUsers;
    }, [sortedUsers, task.authorUserId, task.author?.username]);

    const assigneeOptions = useMemo(() => {
        if (
            task.assignedUserId &&
            !sortedUsers.some((user) => user.userId === task.assignedUserId)
        ) {
            return [
                {
                    userId: task.assignedUserId,
                    username:
                        task.assignee?.username ?? `User #${task.assignedUserId}`,
                },
                ...sortedUsers,
            ];
        }
        return sortedUsers;
    }, [sortedUsers, task.assignedUserId, task.assignee?.username]);

    const project = projects?.find((item) => item.id === task.projectId);
    const projectLabel = project
        ? `${project.name} (#${task.projectId})`
        : `Project #${task.projectId}`;

    const authorIdNumber = Number(authorUserId);
    const assignedIdNumber = assignedUserId ? Number(assignedUserId) : null;
    const pointsNumber = points === "" ? null : Number(points);

    const isValidId = (value: number) => Number.isInteger(value) && value > 0;
    const isPointsValid =
        pointsNumber === null ||
        (Number.isInteger(pointsNumber) && pointsNumber >= 0);

    const isFormValid =
        title.trim().length > 0 &&
        isValidId(authorIdNumber) &&
        isPointsValid &&
        (assignedIdNumber === null || isValidId(assignedIdNumber));

    const handleSubmit = async () => {
        if (!isFormValid) return;

        setError("");

        try {
            await updateTask({
                taskId: task.id,
                title: title.trim(),
                description: description.trim() ? description : null,
                status,
                priority,
                tags: tags.trim() ? tags : null,
                startDate: toIsoDateOrNull(startDate),
                dueDate: toIsoDateOrNull(dueDate),
                points: pointsNumber,
                authorUserId: authorIdNumber,
                assignedUserId: assignedIdNumber,
            }).unwrap();

            onClose();
        } catch (err: any) {
            setError(
                err?.data?.message ?? "Failed to update the task. Please try again.",
            );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} name="Edit Task">
            <form
                className="mt-4 space-y-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                <div>
                    <label htmlFor="edit-task-title" className={labelStyles}>
                        Title
                    </label>
                    <input
                        id="edit-task-title"
                        type="text"
                        className={inputStyles}
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="edit-task-description" className={labelStyles}>
                        Description
                    </label>
                    <textarea
                        id="edit-task-description"
                        className={inputStyles}
                        placeholder="Description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2">
                    <div>
                        <label htmlFor="edit-task-status" className={labelStyles}>
                            Status
                        </label>
                        <select
                            id="edit-task-status"
                            className={selectStyles}
                            value={status}
                            onChange={(e) => setStatus(e.target.value as Status)}
                        >
                            {statusOptions.map((option) => (
                                <option
                                    key={option}
                                    value={option}
                                    className="text-brand-900 bg-brand-200"
                                >
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="edit-task-priority" className={labelStyles}>
                            Priority
                        </label>
                        <select
                            id="edit-task-priority"
                            className={selectStyles}
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as Priority)}
                        >
                            {priorityOptions.map((option) => (
                                <option
                                    key={option}
                                    value={option}
                                    className="text-brand-900 bg-brand-200"
                                >
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="edit-task-tags" className={labelStyles}>
                        Tags
                    </label>
                    <input
                        id="edit-task-tags"
                        type="text"
                        className={inputStyles}
                        placeholder="Comma separated (optional)"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2">
                    <div>
                        <label htmlFor="edit-task-start-date" className={labelStyles}>
                            Start Date
                        </label>
                        <input
                            id="edit-task-start-date"
                            type="date"
                            className={dateInputStyles}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-task-due-date" className={labelStyles}>
                            Due Date
                        </label>
                        <input
                            id="edit-task-due-date"
                            type="date"
                            className={dateInputStyles}
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="edit-task-author-id" className={labelStyles}>
                        Author
                    </label>
                    <select
                        id="edit-task-author-id"
                        className={selectStyles}
                        value={authorUserId}
                        onChange={(e) => setAuthorUserId(e.target.value)}
                        disabled={isUsersLoading}
                    >
                        <option value="" disabled className="text-brand-900 bg-brand-200">
                            {isUsersLoading
                                ? "Loading users…"
                                : isUsersError
                                    ? "Failed to load users"
                                    : "Select author…"}
                        </option>
                        {authorOptions.map((user) => (
                            <option
                                key={user.userId}
                                value={String(user.userId)}
                                className="text-brand-900 bg-brand-200"
                            >
                                {user.username} (#{user.userId})
                            </option>
                        ))}
                    </select>
                    {isUsersError && (
                        <p className="mt-1 text-xs text-red-600">
                            Could not load users. Please refresh and try again.
                        </p>
                    )}
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2">
                    <div>
                        <label htmlFor="edit-task-assigned-id" className={labelStyles}>
                            Assignee
                        </label>
                        <select
                            id="edit-task-assigned-id"
                            className={selectStyles}
                            value={assignedUserId}
                            onChange={(e) => setAssignedUserId(e.target.value)}
                            disabled={isUsersLoading}
                        >
                            <option value="" className="text-brand-900 bg-brand-200">
                                Unassigned
                            </option>
                            {assigneeOptions.map((user) => (
                                <option
                                    key={user.userId}
                                    value={String(user.userId)}
                                    className="text-brand-900 bg-brand-200"
                                >
                                    {user.username} (#{user.userId})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="edit-task-points" className={labelStyles}>
                            Points
                        </label>
                        <input
                            id="edit-task-points"
                            type="number"
                            min="0"
                            className={inputStyles}
                            placeholder="Optional"
                            value={points}
                            onChange={(e) => setPoints(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <span className={labelStyles}>Project</span>
                    <div
                        className={`${inputStyles} cursor-not-allowed select-none bg-brand-300/60`}
                        aria-readonly="true"
                    >
                        {projectLabel}
                    </div>
                </div>

                {error && (
                    <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    className={`focus:ring-brand-800 w-full rounded-md py-2.5 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none ${!isFormValid || isLoading
                            ? "bg-brand-700/20 text-brand-900/40 cursor-not-allowed"
                            : "bg-brand-700 text-brand-100 hover:bg-brand-800"
                        }`}
                    disabled={!isFormValid || isLoading}
                >
                    {isLoading ? "Saving..." : "Save Changes"}
                </button>
            </form>
        </Modal>
    );
};

export default ModalEditTask;