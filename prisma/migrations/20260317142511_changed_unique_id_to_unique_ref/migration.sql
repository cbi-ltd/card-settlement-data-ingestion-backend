/*
  Warnings:

  - You are about to drop the column `uniqueId` on the `TransactionRecord` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "TransactionRecord_uniqueId_idx";

-- AlterTable
ALTER TABLE "TransactionRecord" DROP COLUMN "uniqueId",
ADD COLUMN     "uniqueRef" TEXT;

-- CreateIndex
CREATE INDEX "TransactionRecord_uniqueRef_idx" ON "TransactionRecord"("uniqueRef");
