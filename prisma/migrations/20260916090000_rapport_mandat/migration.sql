-- CreateTable
CREATE TABLE "RapportMandat" (
    "id" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "periodeDebut" TIMESTAMP(3) NOT NULL,
    "periodeFin" TIMESTAMP(3) NOT NULL,
    "bilanContexte" TEXT,
    "bilanQualitatif" TEXT,
    "bilanPointsForts" TEXT,
    "bilanDefis" TEXT,
    "bilanRecommandations" TEXT,
    "bilanConclusion" TEXT,
    "informationsPratiques" TEXT,
    "genereLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RapportMandat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RapportMandatRubrique" (
    "id" TEXT NOT NULL,
    "rapportId" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT,

    CONSTRAINT "RapportMandatRubrique_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RapportMandat_managerId_idx" ON "RapportMandat"("managerId");

-- CreateIndex
CREATE INDEX "RapportMandatRubrique_rapportId_idx" ON "RapportMandatRubrique"("rapportId");

-- AddForeignKey
ALTER TABLE "RapportMandat" ADD CONSTRAINT "RapportMandat_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RapportMandatRubrique" ADD CONSTRAINT "RapportMandatRubrique_rapportId_fkey" FOREIGN KEY ("rapportId") REFERENCES "RapportMandat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
