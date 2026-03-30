/*
  Warnings:

  - A unique constraint covering the columns `[uniqueRef]` on the table `FileRow` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "FileRow" ADD COLUMN     "uniqueRef" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FileRow_uniqueRef_key" ON "FileRow"("uniqueRef");
