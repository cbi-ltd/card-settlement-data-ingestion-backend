-- CreateTable
CREATE TABLE "TransactionRecord" (
    "id" SERIAL NOT NULL,
    "fileRowId" INTEGER,
    "reference" TEXT,
    "merchantName" TEXT,
    "paymentMethod" TEXT,
    "paymentSource" TEXT,
    "amount" DOUBLE PRECISION,
    "charges" DOUBLE PRECISION,
    "vat" DOUBLE PRECISION,
    "stampDuty" DOUBLE PRECISION,
    "blusaltCharge" DOUBLE PRECISION,
    "aggregatorCharge" DOUBLE PRECISION,
    "amountSettled" DOUBLE PRECISION,
    "currency" TEXT,
    "status" TEXT,
    "transactionDate" TIMESTAMP(3),
    "uniqueId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionRecord_transactionDate_idx" ON "TransactionRecord"("transactionDate");

-- CreateIndex
CREATE INDEX "TransactionRecord_uniqueId_idx" ON "TransactionRecord"("uniqueId");
