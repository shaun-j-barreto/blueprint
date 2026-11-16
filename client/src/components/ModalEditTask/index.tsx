"use client";

import Modal from "@/components/Modal";
import AttachmentPicker from "@/components/AttachmentPicker";
import AttachmentList from "@/components/AttachmentList";
import {
    Attachment,
    Priority,
    Status,
    Task,
    useAddTaskAttachmentsMutation,
    useDeleteAttachmentMutation,
    useGetProjectMembersQuery,
    useGetProjectsQuery,
    useUpdateTaskMutation,
} from "@/state/api";
import { useMemo, useState } from "react";
import { MAX_ATTACHMENT_FILES } from "@/lib/attachments";
import { usePermissions } from "@/lib/permissions";
import { getApiErrorMessage } from "@/lib/utils";
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

type FormProps = {
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

const EditTaskForm = ({ onClose, task }: FormProps) => {
    const [updateTask, { isLoading }] = useUpdateTaskMutation();
    const [addTaskAttachments] = useAddTaskAttachmentsMutation();
    const [deleteAttachment] = useDeleteAttachmentMutation();
    const permissions = usePermissions();
    const {
        data: projectMembers,
        isLoading: isMembersLoading,
        isError: isMembersError,
    } = useGetProjectMembersQuery(task.projectId);
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
    const [attachments, setAttachments] = useState<Attachment[]>(
        () => task.attachments ?? [],
    );
    const [files, setFiles] = useState<File[]>([]);
    const [removedAttachmentIds, setRemovedAttachmentIds] = useState<number[]>([]);
    const [isSavingChanges, setIsSavingChanges] = useState(false);
    const [error, setError] = useState("");

    // Attachment edits are staged locally. The form is mounted fresh each time
    // the modal opens, so it always starts from the task as it currently exists.

    const sortedUsers = useMemo(
        () =>
            [...(projectMembers?.members ?? [])].sort((a, b) =>
                a.username.localeCompare(b.username),
            ),
        [projectMembers],
    );

    // Keep the current author visible even if that user is no longer returned
    // by the users endpoint, so opening the form never changes the value.
    const authorOptions = useMemo(() => {
        if (
            task.authorUserId &&
            !sortedUsers.some((user) => user.id === task.authorUserId)
        ) {
            return [
                {
                    id: task.authorUserId,
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
            !sortedUsers.some((user) => user.id === task.assignedUserId)
        ) {
            return [
                {
                    id: task.assignedUserId,
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

    const isBusy = isLoading || isSavingChanges;
    const attachmentSlots = Math.max(
        MAX_ATTACHMENT_FILES - attachments.length,
        0,
    );

    const handleRemoveAttachment = (attachment: Attachment) => {
        setAttachments((current) =>
            current.filter((item) => item.id !== attachment.id),
        );
        setRemovedAttachmentIds((current) =>
            current.includes(attachment.id)
                ? current
                : [...current, attachment.id],
        );
        setError("");
    };

    const handleSubmit = async () => {
        if (!isFormValid || isBusy) return;

        setError("");
        setIsSavingChanges(true);

        // 1. Save the task fields first. Everything below only runs once this
        // succeeds, so a bad form value never leaves half-applied attachments.
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
        } catch (err) {
            setError(
                getApiErrorMessage(
                    err,
                    "Failed to update the task. Please try again.",
                ),
            );
            setIsSavingChanges(false);
            return;
        }

        // 2. Apply staged removals. A 404 means the attachment is already gone,
        // so it counts as success and retries cannot get stuck.
        const failedRemovals: number[] = [];
        let removalError = "";

        for (const attachmentId of removedAttachmentIds) {
            try {
                await deleteAttachment(attachmentId).unwrap();
            } catch (err) {
                const status =
                    typeof err === "object" && err !== null && "status" in err
                        ? (err as { status?: unknown }).status
                        : undefined;
                if (status === 404) continue;
                failedRemovals.push(attachmentId);
                removalError = getApiErrorMessage(
                    err,
                    "Failed to remove an attachment.",
                );
            }
        }

        if (failedRemovals.length > 0) {
            setRemovedAttachmentIds(failedRemovals);
            setError(
                `Task details were saved, but some attachments could not be removed: ${removalError}`,
            );
            setIsSavingChanges(false);
            return;
        }

        setRemovedAttachmentIds([]);

        // 3. Upload new files last, once the freed-up slots actually exist on
        // the server (the endpoint enforces the 5-file cap in a transaction).
        if (files.length > 0) {
            try {
                await addTaskAttachments({ taskId: task.id, files }).unwrap();
                setFiles([]);
            } catch (err) {
                setError(
                    `Task details were saved, but uploading the new attachments failed: ${getApiErrorMessage(
                        err,
                        "Please try again.",
                    )}`,
                );
                setIsSavingChanges(false);
                return;
            }
        }

        setIsSavingChanges(false);
        onClose();
    };

    return (
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
                        disabled={
                            isMembersLoading || !permissions.canManageWorkspace
                        }
                    >
                        <option value="" disabled className="text-brand-900 bg-brand-200">
                            {isMembersLoading
                                ? "Loading project members…"
                                : isMembersError
                                    ? "Failed to load members"
                                    : "Select author…"}
                        </option>
                        {authorOptions.map((user) => (
                            <option
                                key={user.id}
                                value={String(user.id)}
                                className="text-brand-900 bg-brand-200"
                            >
                                {user.username} (#{user.id})
                            </option>
                        ))}
                    </select>
                    {!permissions.canManageWorkspace && (
                        <p className="text-brand-700 mt-1 text-[11px]">
                            Only owners and admins can change the author.
                        </p>
                    )}
                    {isMembersError && (
                        <p className="mt-1 text-xs text-red-600">
                            Could not load project members. Please refresh and try again.
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
                            disabled={isMembersLoading}
                        >
                            <option value="" className="text-brand-900 bg-brand-200">
                                {isMembersLoading
                                    ? "Loading project members…"
                                    : isMembersError
                                        ? "Failed to load members"
                                        : "Unassigned"}
                            </option>
                            {assigneeOptions.map((user) => (
                                <option
                                    key={user.id}
                                    value={String(user.id)}
                                    className="text-brand-900 bg-brand-200"
                                >
                                    {user.username} (#{user.id})
                                </option>
                            ))}
                        </select>
                        {!isMembersLoading &&
                            !isMembersError &&
                            sortedUsers.length === 0 && (
                                <p className="text-brand-700 mt-1 text-[11px]">
                                    No one is on this project yet. Add project
                                    members from Settings to assign work.
                                </p>
                            )}
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

                <div>
                    <span className={labelStyles}>Attachments</span>
                    {attachments.length > 0 ? (
                        <div className="mb-2">
                            <AttachmentList
                                attachments={attachments}
                                variant="compact"
                                onRemove={handleRemoveAttachment}
                                removeDisabled={isBusy}
                            />
                        </div>
                    ) : (
                        <p className="text-brand-900/50 mb-2 text-xs">
                            No attachments yet.
                        </p>
                    )}
                    <AttachmentPicker
                        files={files}
                        onFilesChange={setFiles}
                        maxAdditionalFiles={attachmentSlots}
                        disabled={isBusy}
                        filesLabel="New files — uploaded when you save"
                    />
                    <p className="text-brand-900/50 mt-1 text-xs">
                        {attachments.length + files.length} of{" "}
                        {MAX_ATTACHMENT_FILES} attachments
                    </p>
                </div>

                {error && (
                    <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    className={`focus:ring-brand-800 w-full rounded-md py-2.5 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none ${!isFormValid || isBusy
                            ? "bg-brand-700/20 text-brand-900/40 cursor-not-allowed"
                            : "bg-brand-700 text-brand-100 hover:bg-brand-800"
                        }`}
                    disabled={!isFormValid || isBusy}
                >
                    {isBusy ? "Saving..." : "Save Changes"}
                </button>
            </form>
    );
};

const ModalEditTask = ({ isOpen, onClose, task }: Props) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} name="Edit Task">
            {isOpen ? <EditTaskForm task={task} onClose={onClose} /> : null}
        </Modal>
    );
};

export default ModalEditTask;