/*
  Warnings:

  - You are about to drop the column `interestType` on the `Loan` table. All the data in the column will be lost.
  - Added the required column `interestFrequency` to the `Loan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `interestValueType` to the `Loan` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InterestFrequency" AS ENUM ('MONTHLY', 'YEARLY', 'CUSTOM_DATE_RANGE');

-- CreateEnum
CREATE TYPE "InterestValueType" AS ENUM ('PERCENTAGE', 'RUPEES');

-- AlterTable
ALTER TABLE "Loan" DROP COLUMN "interestType",
ADD COLUMN     "interestFrequency" "InterestFrequency" NOT NULL,
ADD COLUMN     "interestValueType" "InterestValueType" NOT NULL,
ALTER COLUMN "interestRate" SET DATA TYPE DECIMAL(15,2);

-- DropEnum
DROP TYPE "InterestType";
