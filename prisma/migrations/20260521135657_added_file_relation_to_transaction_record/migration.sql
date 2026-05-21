-- AlterTable
ALTER TABLE "TransactionRecord" ADD COLUMN     "fileId" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "TransactionRecord_fileId_idx" ON "TransactionRecord"("fileId");

-- AddForeignKey
ALTER TABLE "TransactionRecord" ADD CONSTRAINT "TransactionRecord_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
