-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "mimeType" TEXT,
ALTER COLUMN "fileURL" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AttachmentFile" (
    "attachmentId" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "AttachmentFile_pkey" PRIMARY KEY ("attachmentId")
);

-- AddForeignKey
ALTER TABLE "AttachmentFile" ADD CONSTRAINT "AttachmentFile_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
