-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileColumn" (
    "id" SERIAL NOT NULL,
    "fileId" INTEGER NOT NULL,
    "columnName" TEXT NOT NULL,
    "columnIndex" INTEGER NOT NULL,

    CONSTRAINT "FileColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileRow" (
    "id" SERIAL NOT NULL,
    "fileId" INTEGER NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "FileRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FileRow_fileId_idx" ON "FileRow"("fileId");

-- AddForeignKey
ALTER TABLE "FileColumn" ADD CONSTRAINT "FileColumn_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileRow" ADD CONSTRAINT "FileRow_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
