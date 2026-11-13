"use client";

import Modal from "@/components/Modal";
import { Status, Priority, User, useCreateTaskMutation, useGetUsersQuery } from "@/state/api";
import { useMemo, useState } from "react";
import {
    dateInputStyles,
    inputStyles,
    labelStyles,
    selectStyles,
    toIsoDate,
} from "@/components/taskFormStyles";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    id?: string | null;
};

const ModalNewTask = ({ isOpen, onClose, id = null }: Props) => {
    const [createTask, { isLoading }] = useCreateTaskMutation();
    const {
        data: users = [],
        isLoading: isUsersLoading,
        isError: isUsersError,
    } = useGetUsersQuery();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<Status>(Status.ToDo);
    const [priority, setPriority] = useState<Priority>(Priority.Backlog);
    const [tags, setTags] = useState("");
    const [startDate, setStartDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [authorUserId, setAuthorUserId] = useState("");
    const [assignedUserId, setAssignedUserId] = useState("");
    const [projectId, setProjectId] = useState("");
    const [points, setPoints] = useState("");
    const [error, setError] = useState("");

    // An empty string id (invalid route param) must not count as a project.
    const hasProjectId = id !== null && id !== "";
    const authorIdNumber = Number(authorUserId);
    const projectIdNumber = hasProjectId ? Number(id) : Number(projectId);
    const assignedIdNumber = assignedUserId ? Number(assignedUserId) : null;

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

    const isValidId = (value: number) => Number.isInteger(value) && value > 0;

    const isFormValid =
        title.trim().length > 0 &&
        isValidId(authorIdNumber) &&
        isValidId(projectIdNumber) &&
        (assignedIdNumber === null || isValidId(assignedIdNumber));

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setStatus(Status.ToDo);
        setPriority(Priority.Backlog);
        setTags("");
        setStartDate("");
        setDueDate("");
        setAuthorUserId("");
        setAssignedUserId("");
        setProjectId("");
        setPoints("");
        setError("");
    };

    const handleClose = () => {
        setError("");
        onClose();
    };

    const handleSubmit = async () => {
        if (!isFormValid) return;

        setError("");

        try {
            await createTask({
                title: title.trim(),
                description,
                status,
                priority,
                tags,
                startDate: toIsoDate(startDate),
                dueDate: toIsoDate(dueDate),
                points: points ? Number(points) : undefined,
                authorUserId: authorIdNumber,
                assignedUserId: assignedIdNumber ?? undefined,
                projectId: projectIdNumber,
            }).unwrap();

            resetForm();
            onClose();
        } catch (err: any) {
            setError(
                err?.data?.message ?? "Failed to create the task. Please try again.",
            );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} name="Create New Task">
            <form
                className="mt-4 space-y-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                <div>
                    <label htmlFor="task-title" className={labelStyles}>
                        Title
                    </label>
                    <input
                        id="task-title"
                        type="text"
                        className={inputStyles}
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="task-description" className={labelStyles}>
                        Description
                    </label>
                    <textarea
                        id="task-description"
                        className={inputStyles}
                        placeholder="Description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2">
                    <div>
                        <label htmlFor="task-status" className={labelStyles}>
                            Status
                        </label>
                        <select
                            id="task-status"
                            className={selectStyles}
                            value={status}
                            onChange={(e) => setStatus(e.target.value as Status)}
                        >
                            <option value={Status.ToDo} className="text-brand-900 bg-brand-200">
                                To Do
                            </option>
                            <option
                                value={Status.WorkInProgress}
                                className="text-brand-900 bg-brand-200"
                            >
                                Work In Progress
                            </option>
                            <option
                                value={Status.UnderReview}
                                className="text-brand-900 bg-brand-200"
                            >
                                Under Review
                            </option>
                            <option
                                value={Status.Completed}
                                className="text-brand-900 bg-brand-200"
                            >
                                Completed
                            </option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="task-priority" className={labelStyles}>
                            Priority
                        </label>
                        <select
                            id="task-priority"
                            className={selectStyles}
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as Priority)}
                        >
                            <option
                                value={Priority.Urgent}
                                className="text-brand-900 bg-brand-200"
                            >
                                Urgent
                            </option>
                            <option
                                value={Priority.High}
                                className="text-brand-900 bg-brand-200"
                            >
                                High
                            </option>
                            <option
                                value={Priority.Medium}
                                className="text-brand-900 bg-brand-200"
                            >
                                Medium
                            </option>
                            <option
                                value={Priority.Low}
                                className="text-brand-900 bg-brand-200"
                            >
                                Low
                            </option>
                            <option
                                value={Priority.Backlog}
                                className="text-brand-900 bg-brand-200"
                            >
                                Backlog
                            </option>
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="task-tags" className={labelStyles}>
                        Tags
                    </label>
                    <input
                        id="task-tags"
                        type="text"
                        className={inputStyles}
                        placeholder="Comma separated (optional)"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2">
                    <div>
                        <label htmlFor="task-start-date" className={labelStyles}>
                            Start Date
                        </label>
                        <input
                            id="task-start-date"
                            type="date"
                            className={dateInputStyles}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="task-due-date" className={labelStyles}>
                            Due Date
                        </label>
                        <input
                            id="task-due-date"
                            type="date"
                            className={dateInputStyles}
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="task-author-id" className={labelStyles}>
                        Author
                    </label>
                    <select
                        id="task-author-id"
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
                        {sortedUsers.map((user) => (
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
                        <label htmlFor="task-assigned-id" className={labelStyles}>
                            Assignee
                        </label>
                        <select
                            id="task-assigned-id"
                            className={selectStyles}
                            value={assignedUserId}
                            onChange={(e) => setAssignedUserId(e.target.value)}
                            disabled={isUsersLoading}
                        >
                            <option value="" className="text-brand-900 bg-brand-200">
                                Unassigned
                            </option>
                            {sortedUsers.map((user) => (
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
                        <label htmlFor="task-points" className={labelStyles}>
                            Points
                        </label>
                        <input
                            id="task-points"
                            type="number"
                            min="0"
                            className={inputStyles}
                            placeholder="Optional"
                            value={points}
                            onChange={(e) => setPoints(e.target.value)}
                        />
                    </div>
                </div>
                {!hasProjectId && (
                    <div>
                        <label htmlFor="task-project-id" className={labelStyles}>
                            Project ID
                        </label>
                        <input
                            id="task-project-id"
                            type="number"
                            min="1"
                            className={inputStyles}
                            placeholder="Project ID"
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                        />
                    </div>
                )}

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
                    {isLoading ? "Creating..." : "Create Task"}
                </button>
            </form>
        </Modal>
    );
};

export default ModalNewTask;
