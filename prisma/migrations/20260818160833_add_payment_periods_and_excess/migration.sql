-- CreateEnum
CREATE TYPE "ExcessStatus" AS ENUM ('AVAILABLE', 'APPLIED', 'REFUNDED');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED';

-- AlterTable
ALTER TABLE "PaymentAllocation" ADD COLUMN     "periodEnd" TIMESTAMP(3),
ADD COLUMN     "periodStart" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ExcessBalance" (
    "id" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "ExcessStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExcessBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExcessBalance_borrowerId_idx" ON "ExcessBalance"("borrowerId");

-- CreateIndex
CREATE INDEX "ExcessBalance_paymentId_idx" ON "ExcessBalance"("paymentId");

-- AddForeignKey
ALTER TABLE "ExcessBalance" ADD CONSTRAINT "ExcessBalance_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "Borrower"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExcessBalance" ADD CONSTRAINT "ExcessBalance_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
