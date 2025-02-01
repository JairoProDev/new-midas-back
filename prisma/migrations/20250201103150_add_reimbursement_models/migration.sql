-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('EMPLOYEE', 'ADMIN');

-- CreateEnum
CREATE TYPE "ReimbursementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('TRAVEL', 'MEALS', 'OFFICE_SUPPLIES', 'EQUIPMENT', 'OTHER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "company" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE';

-- CreateTable
CREATE TABLE "ReimbursementRequest" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "receiptUrl" TEXT NOT NULL,
    "status" "ReimbursementStatus" NOT NULL DEFAULT 'PENDING',
    "feedback" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "ReimbursementRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReimbursementRequest" ADD CONSTRAINT "ReimbursementRequest_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReimbursementRequest" ADD CONSTRAINT "ReimbursementRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
