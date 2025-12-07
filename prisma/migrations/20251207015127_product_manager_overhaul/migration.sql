/*
  Warnings:

  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('NONE', 'PERCENT', 'FIXED');

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_userId_fkey";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "discountValue" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "sessions";
