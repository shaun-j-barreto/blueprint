"use client";

import { useRef, useState } from "react";
import { FileImage, FileSpreadsheet, FileText, Paperclip, X } from "lucide-react";
import {
  ATTACHMENT_ACCEPT,
  MAX_ATTACHMENT_BYTES,
  formatFileSize,
  isAllowedAttachmentName,
  isImageFile,
  isSpreadsheetFile,
} from "@/lib/attachments";

type Props = {
  files: File[];
  onFilesChange: (files: File[]) => void;
  /** Maximum number of pending files this picker may hold. */
  maxAdditionalFiles: number;
  disabled?: boolean;
  /** Optional caption displayed above the pending file list. */
  filesLabel?: string;
};

const renderFileIcon = (fileName: string) => {
  if (isSpreadsheetFile(fileName)) {
    return <FileSpreadsheet className="text-brand-700 h-4 w-4 shrink-0" />;
  }
  if (isImageFile(fileName)) {
    return <FileImage className="text-brand-700 h-4 w-4 shrink-0" />;
  }
  return <FileText className="text-brand-700 h-4 w-4 shrink-0" />;
};

const AttachmentPicker = ({
  files,
  onFilesChange,
  maxAdditionalFiles,
  disabled = false,
  filesLabel,
}: Props) => {
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isFull = files.length >= Math.max(maxAdditionalFiles, 0);

  const addFiles = (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;

    const accepted: File[] = [];
    let nextError = "";

    for (const file of Array.from(selected)) {
      if (!isAllowedAttachmentName(file.name)) {
        nextError = `"${file.name}" is not a supported file type.`;
        continue;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        nextError = `"${file.name}" is larger than ${
          MAX_ATTACHMENT_BYTES / (1024 * 1024)
        } MB.`;
        continue;
      }

      const duplicate = [...files, ...accepted].some(
        (existing) =>
          existing.name === file.name &&
          existing.size === file.size &&
          existing.lastModified === file.lastModified,
      );
      if (duplicate) continue;

      accepted.push(file);
    }

    const remaining = Math.max(maxAdditionalFiles - files.length, 0);
    const nextFiles = accepted.slice(0, remaining);

    if (accepted.length > nextFiles.length && nextError === "") {
      nextError = `You can attach up to ${maxAdditionalFiles} ${
        maxAdditionalFiles === 1 ? "file" : "files"
      }.`;
    }

    if (nextFiles.length > 0) onFilesChange([...files, ...nextFiles]);
    setFileError(nextError);
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
    setFileError("");
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ATTACHMENT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          // Allow re-selecting the same file after removal.
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isFull}
        className="border-brand-600/60 text-brand-900/70 hover:border-brand-700 hover:text-brand-900 flex items-center gap-2 rounded border border-dashed px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Paperclip className="h-4 w-4" />
        Attach files
      </button>
      {maxAdditionalFiles > 0 && (
        <p className="text-brand-900/50 mt-1 text-xs">
          Images, PDF, Word, Excel or PowerPoint &middot; up to{" "}
          {maxAdditionalFiles} {maxAdditionalFiles === 1 ? "file" : "files"}{" "}
          &middot; {MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB each
        </p>
      )}

      {isFull && (
        <p className="text-brand-900/50 mt-1 text-xs">
          Attachment limit reached. Remove a file to add another.
        </p>
      )}

      {files.length > 0 && (
        <>
          {filesLabel && (
            <p className="text-brand-900/50 mt-2 text-xs">{filesLabel}</p>
          )}
          <ul className="mt-2 space-y-1.5">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="border-brand-500 bg-brand-100 flex items-center gap-2 rounded border px-3 py-2"
              >
                {renderFileIcon(file.name)}
                <span className="text-brand-900 min-w-0 flex-1 truncate text-sm">
                  {file.name}
                </span>
                <span className="text-brand-900/50 shrink-0 text-xs">
                  {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  aria-label={`Remove ${file.name}`}
                  disabled={disabled}
                  className="text-brand-800 hover:bg-red-100 hover:text-red-600 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
    </div>
  );
};

export default AttachmentPicker;
