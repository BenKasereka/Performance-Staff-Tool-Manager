-- AlterEnum
ALTER TYPE "TaskStatut" ADD VALUE 'ANNULEE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "service" TEXT,
ADD COLUMN     "superieurId" TEXT;

-- CreateIndex
CREATE INDEX "User_superieurId_idx" ON "User"("superieurId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_superieurId_fkey" FOREIGN KEY ("superieurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
