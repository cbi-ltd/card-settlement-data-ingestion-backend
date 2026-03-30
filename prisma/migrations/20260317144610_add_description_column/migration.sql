/*
  Warnings:

  - You are about to drop the column `fileRowId` on the `TransactionRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TransactionRecord" DROP COLUMN "fileRowId",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "netToCBI" DOUBLE PRECISION,
ADD COLUMN     "settlementDue" DOUBLE PRECISION;
