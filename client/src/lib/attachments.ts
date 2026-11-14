// Mirrors the server-side limits in server/src/lib/attachments.ts.
export const MAX_ATTACHMENT_FILES = 5;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB per file

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const SPREADSHEET_EXTENSIONS = ["xls", "xlsx", "csv"];

export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  ...IMAGE_EXTENSIONS,
  "pdf",
  "doc",
  "docx",
  ...SPREADSHEET_EXTENSIONS,
  "txt",
  "ppt",
  "pptx",
];

export const ATTACHMENT_ACCEPT = ALLOWED_ATTACHMENT_EXTENSIONS.map(
  (extension) => `.${extension}`,
).join(",");

export const fileExtension = (fileName: string): string => {
  const base = fileName.split(/[\\/]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  return dot === -1 ? "" : base.slice(dot + 1).toLowerCase();
};

export const isAllowedAttachmentName = (fileName: string): boolean =>
  (ALLOWED_ATTACHMENT_EXTENSIONS as readonly string[]).includes(
    fileExtension(fileName),
  );

export const isImageFile = (fileName: string): boolean =>
  IMAGE_EXTENSIONS.includes(fileExtension(fileName));

export const isSpreadsheetFile = (fileName: string): boolean =>
  SPREADSHEET_EXTENSIONS.includes(fileExtension(fileName));

/**
 * Legacy seeded attachments have no MIME type, so the extension of the URL
 * (what is actually rendered) is checked before the display name.
 */
export const isImageAttachment = (attachment: {
  mimeType?: string | null;
  fileURL?: string | null;
  fileName?: string | null;
}): boolean => {
  if (attachment.mimeType) return attachment.mimeType.startsWith("image/");
  return isImageFile(attachment.fileURL ?? attachment.fileName ?? "");
};

export const formatFileSize = (bytes?: number | null): string => {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
