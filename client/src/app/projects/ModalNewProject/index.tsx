import Modal from "@/components/Modal";
import { getApiErrorMessage } from "@/lib/utils";
import { useCreateProjectMutation } from "@/state/api";
import { formatISO } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [error, setError] = useState("");
  const router = useRouter();

  const isFormValid =
    projectName.trim().length > 0 &&
    description.trim().length > 0 &&
    startDate !== "" &&
    endDate !== "";

  const resetForm = () => {
    setProjectName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setError("");
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!isFormValid || isLoading) return;

    setError("");

    try {
      const project = await createProject({
        name: projectName.trim(),
        description: description.trim(),
        startDate: formatISO(new Date(startDate), {
          representation: "complete",
        }),
        endDate: formatISO(new Date(endDate), {
          representation: "complete",
        }),
      }).unwrap();

      resetForm();
      onClose();
      router.push(`/projects/${project.id}`);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Failed to create the project. Please try again.",
        ),
      );
    }
  };

  // Removed shadow-md and refined border focus for a flatter, plain look
  const inputStyles =
    "w-full rounded border border-brand-600/40 p-2.5 text-sm text-brand-900 outline-none focus:border-brand-600 transition-colors placeholder:text-brand-900/40";
  const dateInputStyles = `${inputStyles} [color-scheme:light] dark:[color-scheme:dark]`;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} name="Create New Project">
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
          aria-label="Project name"
          autoComplete="off"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />

        <textarea
          className={`${inputStyles} min-h-[100px] resize-y`}
          placeholder="Description"
          aria-label="Project description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-brand-900/60 mb-1 block text-xs font-medium">
              Start Date
            </label>
            <input
              type="date"
              className={dateInputStyles}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-brand-900/60 mb-1 block text-xs font-medium">
              End Date
            </label>
            <input
              type="date"
              className={dateInputStyles}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          className={`focus:ring-brand-800 w-full rounded-md py-2.5 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none ${
            !isFormValid || isLoading
              ? "bg-brand-700/20 text-brand-900/40 cursor-not-allowed"
              : "bg-brand-700 text-brand-100 hover:bg-brand-800"
          }`}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? "Creating..." : "Create Project"}
        </button>
      </form>
    </Modal>
  );
};

export default ModalNewProject;
