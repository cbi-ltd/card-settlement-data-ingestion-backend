-- DropIndex
DROP INDEX "FileRow_uniqueRef_key";

-- CreateIndex
CREATE INDEX "FileRow_uniqueRef_idx" ON "FileRow"("uniqueRef");
