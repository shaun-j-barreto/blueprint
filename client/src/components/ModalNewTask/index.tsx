import Modal from "@/components/Modal";
import { Status, Priority, useCreateTaskMutation } from "@/state/api";
import { useState } from "react";
import { formatISO } from "date-fns";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    id?: string | null;
};

const ModalNewTask = ({ isOpen, onClose, id = null }: Props) => {
    const [createTask, { isLoading }] = useCreateTaskMutation();
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

    const handleSubmit = async () => {
        if (!title || !authorUserId || !(id !== null || projectId)) return;
        const formattedstartDate = formatISO(new Date(startDate), {
            representation: "complete",
        });
        const formatteddueDate = formatISO(new Date(dueDate), {
            representation: "complete",
        });

        await createTask({
            title,
            description,
            status,
            priority,
            tags,
            startDate: formattedstartDate,
            dueDate: formatteddueDate,
            authorUserId: parseInt(authorUserId),
            assignedUserId: parseInt(assignedUserId),
            projectId: id !== null ? Number(id) : Number(projectId),
        });
    };

    const isFormValid = () => {
        return title && authorUserId && !(id !== null || projectId);
    };

    const selectStyles =
        "mb-4 block w-full rounded border border-gray-300 px-3 py-2 dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";
    // Removed shadow-md and refined border focus for a flatter, plain look
    const inputStyles =
        "w-full rounded border border-brand-600/40 p-2.5 text-sm text-brand-900 outline-none focus:border-brand-600 transition-colors placeholder:text-brand-900/40";

    return (
        <Modal isOpen={isOpen} onClose={onClose} name="Create New Task">
            <form
                className="mt-4 space-y-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                <input
                    type="text"
                    className={inputStyles}
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                    className={inputStyles}
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2">
                    <select
                        className={selectStyles}
                        value={status}
                        onChange={(e) => setStatus(e.target.value as Status)}
                    >
                        <option value="" className="text-brand-900 bg-brand-200">
                            Select Status
                        </option>
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
                    <select
                        className={selectStyles}
                        value={priority}
                        onChange={(e) =>
                            setPriority(Priority[e.target.value as keyof typeof Priority])
                        }
                    >
                        <option value="" className="text-brand-900 bg-brand-200">
                            Select Priority
                        </option>
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
                <input
                    type="text"
                    className={inputStyles}
                    placeholder="Tags (comma separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                />

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2">
                    <input
                        type="date"
                        className={inputStyles}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <input
                        type="date"
                        className={inputStyles}
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                </div>
                <input
                    type="text"
                    className={inputStyles}
                    placeholder="Author User ID"
                    value={authorUserId}
                    onChange={(e) => setAuthorUserId(e.target.value)}
                />
                <input
                    type="text"
                    className={inputStyles}
                    placeholder="Assigned User ID"
                    value={assignedUserId}
                    onChange={(e) => setAssignedUserId(e.target.value)}
                />
                {id === null && (
                    <input
                        type="text"
                        className={inputStyles}
                        placeholder="ProjectId"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                    />
                )}

                <button
                    type="submit"
                    className={`focus:ring-brand-800 w-full rounded-md py-2.5 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none ${!isFormValid() || isLoading
                            ? "bg-brand-700/20 text-brand-900/40 cursor-not-allowed"
                            : "bg-brand-700 text-brand-100 hover:bg-brand-800"
                        }`}
                    disabled={!isFormValid() || isLoading}
                >
                    {isLoading ? "Creating..." : "Create Task"}
                </button>
            </form>
        </Modal>
    );
};

export default ModalNewTask;
