import { Attachment, attachmentUrl } from "@/state/api";
import {
  fileExtension,
  formatFileSize,
  isImageAttachment,
  isSpreadsheetFile,
} from "@/lib/attachments";
import { FileImage, FileSpreadsheet, FileText, X } from "lucide-react";

type Props = {
  attachments?: Attachment[] | null;
  variant?: "compact" | "preview";
  /** Preview tile size. `md` is used by grid cards, `sm` by board cards. */
  size?: "sm" | "md";
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
    className="text-brand-800 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50"
  >
    <X className="h-3.5 w-3.5" />
  </button>
);

const AttachmentList = ({
  attachments,
  variant = "compact",
  size = "md",
  onRemove,
  removeDisabled = false,
}: Props) => {
  if (!attachments || attachments.length === 0) return null;

  if (variant === "preview") {
    const firstImage = attachments.find(isImageAttachment);
    const primary = firstImage ?? attachments[0];

    if (!primary) return null;

    const extraCount = attachments.length - 1;
    const name = attachmentName(primary);
    const tileSize = size === "sm" ? "h-14 w-14" : "h-16 w-16";

    return (
      <a
        href={attachmentUrl(primary)}
        target="_blank"
        rel="noreferrer"
        title={name}
        className={`border-brand-500 bg-brand-300 hover:border-brand-600 relative block shrink-0 overflow-hidden rounded-xl border transition-colors ${tileSize}`}
      >
        {firstImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={attachmentUrl(primary)}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <span className="text-brand-700 dark:text-brand-800 flex h-full w-full flex-col items-center justify-center gap-1 px-1">
            {isSpreadsheetFile(name) ? (
              <FileSpreadsheet className="h-5 w-5" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
            <span className="w-full truncate text-center text-[9px] font-semibold tracking-wide uppercase">
              {fileExtension(name) || "file"}
            </span>
          </span>
        )}

        {extraCount > 0 && (
          <span className="absolute top-1 right-1 rounded-full bg-slate-900/80 px-1.5 py-0.5 text-[9px] leading-none font-semibold text-white shadow-sm">
            +{extraCount}
          </span>
        )}
      </a>
    );
  }

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
};

export default AttachmentList;
