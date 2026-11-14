import multer from "multer";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB per file
export const MAX_ATTACHMENT_COUNT = 5; // files per task

// Browser-reported MIME types are unreliable for Office documents, so files
// are validated and typed by extension instead.
export const ALLOWED_ATTACHMENT_TYPES: Readonly<Record<string, string>> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  txt: "text/plain",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export const ALLOWED_ATTACHMENT_EXTENSIONS = Object.keys(
  ALLOWED_ATTACHMENT_TYPES,
);

/** Error type whose message is safe to return to the client. */
export class AttachmentError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AttachmentError";
    this.status = status;
  }
}

export const attachmentExtension = (fileName: string): string => {
  // Strip any client-supplied path before looking at the extension.
  const base = fileName.split(/[\\/]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  return dot === -1 ? "" : base.slice(dot + 1).toLowerCase();
};

export const isAllowedAttachment = (fileName: string): boolean =>
  Object.hasOwn(ALLOWED_ATTACHMENT_TYPES, attachmentExtension(fileName));

export const mimeTypeForAttachment = (fileName: string): string =>
  ALLOWED_ATTACHMENT_TYPES[attachmentExtension(fileName)] ??
  "application/octet-stream";

/** Display name that is safe for headers and the UI (no paths/control chars). */
export const safeAttachmentName = (originalName: string): string => {
  const base = originalName.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f"]/g, "")
    .trim();
  const limited = cleaned.length > 150 ? cleaned.slice(-150) : cleaned;
  return limited.length > 0 ? limited : "attachment";
};

export const isInlineMimeType = (mimeType?: string | null): boolean =>
  Boolean(mimeType?.startsWith("image/")) || mimeType === "application/pdf";

/**
 * Prisma's `Bytes` type is backed by a plain ArrayBuffer, while multer hands
 * back a Node Buffer. Copy into a fresh Uint8Array so the value matches the
 * generated client's type exactly.
 */
export const toAttachmentBytes = (buffer: Buffer): Uint8Array<ArrayBuffer> => {
  const bytes = new Uint8Array(buffer.byteLength);
  bytes.set(buffer);
  return bytes;
};

/**
 * Shared create payload so the new-task and add-to-existing-task endpoints
 * validate, sanitize and store files identically.
 */
export const attachmentCreatePayload = (
  file: Express.Multer.File,
  uploadedById: number,
) => ({
  fileName: safeAttachmentName(file.originalname),
  mimeType: mimeTypeForAttachment(file.originalname),
  fileSize: file.size,
  uploadedBy: { connect: { userId: uploadedById } },
  file: { create: { data: toAttachmentBytes(file.buffer) } },
});

export const uploadAttachments = multer({
  storage: multer.memoryStorage(),
  // Browsers send filenames as UTF-8; without this multer decodes them as
  // latin1 and non-ASCII names are mangled.
  defParamCharset: "utf8",
  limits: {
    fileSize: MAX_ATTACHMENT_BYTES,
    files: MAX_ATTACHMENT_COUNT,
  },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedAttachment(file.originalname)) {
      callback(
        new AttachmentError(
          `Unsupported file type. Allowed extensions: ${ALLOWED_ATTACHMENT_EXTENSIONS.map(
            (extension) => `.${extension}`,
          ).join(", ")}`,
        ),
      );
      return;
    }
    callback(null, true);
  },
});
