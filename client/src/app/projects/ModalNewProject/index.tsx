import Modal from "@/components/Modal";
import { useCreateProjectMutation } from "@/state/api";
import { useState } from "react";
import { formatISO } from "date-fns";

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

const ModalNewProject = ({ isOpen, onClose }: Props) => {
    const [createProject, { isLoading }] = useCreateProjectMutation();
    const [projectName, setProjectName] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const handleSubmit = async () => {
        if (!projectName || !startDate || !endDate) return;
        const formattedstartDate = formatISO(new Date(startDate), { representation: "complete" });
        const formattedEndDate = formatISO(new Date(endDate), { representation: "complete" });

        await createProject({
            name: projectName,
            description,
            startDate: formattedstartDate,
            endDate: formattedEndDate,
        });
    };

    const isFormValid = () => {
        return projectName && description && startDate && endDate;
    };

    // Removed shadow-md and refined border focus for a flatter, plain look
    const inputStyles =
        "w-full rounded border border-brand-600/40 p-2.5 text-sm text-brand-900 outline-none focus:border-brand-600 transition-colors placeholder:text-brand-900/40";

    return (
        <Modal isOpen={isOpen} onClose={onClose} name="Create New Project">
            <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                <input
                    type="text"
                    className={inputStyles}
                    placeholder="Project Name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                />

                <textarea
                    className={`${inputStyles} min-h-[100px] resize-y`}
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-medium text-brand-900/60 mb-1">Start Date</label>
                        <input
                            type="date"
                            className={inputStyles}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-brand-900/60 mb-1">End Date</label>
                        <input
                            type="date"
                            className={inputStyles}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className={`w-full rounded-md py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-800 focus:ring-offset-2 ${!isFormValid() || isLoading
                            ? "bg-brand-700/20 text-brand-900/40 cursor-not-allowed"
                            : "bg-brand-700 text-brand-100 hover:bg-brand-800"
                        }`}
                    disabled={!isFormValid() || isLoading}
                >
                    {isLoading ? "Creating..." : "Create Project"}
                </button>
            </form>
        </Modal>
    );
};

export default ModalNewProject;