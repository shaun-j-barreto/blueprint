import { Attachment, attachmentUrl } from "@/state/api";
import {
  formatFileSize,
  isImageAttachment,
  isSpreadsheetFile,
} from "@/lib/attachments";
import { FileImage, FileSpreadsheet, FileText, X } from "lucide-react";

type Props = {
  attachments?: Attachment[] | null;
  variant?: "card" | "board" | "compact";
  onRemove?: (attachment: Attachment) => void;
  /** Disables the remove buttons, e.g. while a save is in flight. */
  removeDisabled?: boolean;
};

const attachmentName = (attachment: Attachment): string =>
  attachment.fileName?.trim() || "Attachment";

const iconFor = (attachment: Attachment) => {
  if (isImageAttachment(attachment)) {
    return <FileImage className="text-brand-700 h-3.5 w-3.5 shrink-0" />;
  }
  if (isSpreadsheetFile(attachment.fileName ?? "")) {
    return <FileSpreadsheet className="text-brand-700 h-3.5 w-3.5 shrink-0" />;
  }
  return <FileText className="text-brand-700 h-3.5 w-3.5 shrink-0" />;
};

const RemoveButton = ({
  attachment,
  onRemove,
  disabled,
}: {
  attachment: Attachment;
  onRemove: (attachment: Attachment) => void;
  disabled: boolean;
}) => (
  <button
    type="button"
    onClick={() => onRemove(attachment)}
    disabled={disabled}
    aria-label={`Remove ${attachmentName(attachment)}`}
    className="text-brand-800 hover:bg-red-100 hover:text-red-600 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50"
  >
    <X className="h-3.5 w-3.5" />
  </button>
);

const AttachmentList = ({
  attachments,
  variant = "card",
  onRemove,
  removeDisabled = false,
}: Props) => {
  if (!attachments || attachments.length === 0) return null;

  if (variant === "compact") {
    return (
      <ul className="space-y-1.5">
        {attachments.map((attachment) => (
          <li
            key={attachment.id}
            className="border-brand-500 bg-brand-100 flex items-center gap-2 rounded border px-3 py-2"
          >
            {isImageAttachment(attachment) ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={attachmentUrl(attachment)}
                alt=""
                className="border-brand-500 h-8 w-8 shrink-0 rounded border object-cover"
                loading="lazy"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                {iconFor(attachment)}
              </span>
            )}
            <a
              href={attachmentUrl(attachment)}
              target="_blank"
              rel="noreferrer"
              title={attachmentName(attachment)}
              className="text-brand-900 min-w-0 flex-1 truncate text-sm hover:underline"
            >
              {attachmentName(attachment)}
            </a>
            {attachment.fileSize ? (
              <span className="text-brand-900/50 shrink-0 text-xs">
                {formatFileSize(attachment.fileSize)}
              </span>
            ) : null}
            {onRemove && (
              <RemoveButton
                attachment={attachment}
                onRemove={onRemove}
                disabled={removeDisabled}
              />
            )}
          </li>
        ))}
      </ul>
    );
  }

  // The first image becomes the preview; every other file is a chip.
  const cover = attachments.find(isImageAttachment);
  const rest = attachments.filter((attachment) => attachment.id !== cover?.id);
  const coverHeight = variant === "board" ? "h-36" : "h-44";

  return (
    <div>
      {cover && (
        <a
          href={attachmentUrl(cover)}
          target="_blank"
          rel="noreferrer"
          title={attachmentName(cover)}
          className={`border-brand-500 bg-brand-300 relative mb-4 block w-full overflow-hidden rounded-lg border ${coverHeight}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachmentUrl(cover)}
            alt={attachmentName(cover)}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </a>
      )}

      {rest.length > 0 && (
        <ul className="mb-4 flex flex-wrap gap-1.5">
          {rest.map((attachment) => (
            <li key={attachment.id} className="relative">
              <a
                href={attachmentUrl(attachment)}
                target="_blank"
                rel="noreferrer"
                title={attachmentName(attachment)}
                className="border-brand-500 bg-brand-300 text-brand-900 hover:border-brand-600 hover:bg-brand-400 flex max-w-[240px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors"
              >
                {iconFor(attachment)}
                <span className="truncate">{attachmentName(attachment)}</span>
                {attachment.fileSize ? (
                  <span className="text-brand-900/50 shrink-0">
                    {formatFileSize(attachment.fileSize)}
                  </span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AttachmentList;
