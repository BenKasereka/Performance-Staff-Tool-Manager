-- AlterTable
ALTER TABLE "User" ADD COLUMN     "doitChangerMotDePasse" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resetTokenExpire" TIMESTAMP(3),
ADD COLUMN     "resetTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_resetTokenHash_key" ON "User"("resetTokenHash");

