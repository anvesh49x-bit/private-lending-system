-- AlterTable
ALTER TABLE "PaymentAllocation" ADD COLUMN     "interestAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "principalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0;
