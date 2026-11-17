"use client";

import { Loader2, X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
} from "react";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  isLoading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current && !isLoading) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!isLoading) onClose();
      }}
      onClick={handleBackdropClick}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-brand-500/80 bg-brand-100 p-0 text-brand-800 shadow-2xl"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-sm font-semibold text-brand-900">
              {title}
            </h2>
            <p
              id={descriptionId}
              className="mt-1.5 text-xs leading-relaxed text-brand-700"
            >
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-brand-700 transition-colors hover:bg-brand-300 hover:text-brand-900 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-brand-500 bg-brand-100 px-3 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-300 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
              tone === "danger"
                ? "bg-red-600 hover:bg-red-500 focus-visible:ring-red-500/40"
                : "bg-indigo-600 hover:bg-indigo-500 focus-visible:ring-indigo-500/40"
            }`}
          >
            {isLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
