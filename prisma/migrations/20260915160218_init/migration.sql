-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MANAGER', 'MEMBER');

-- CreateEnum
CREATE TYPE "MissionStatut" AS ENUM ('EN_PREPARATION', 'ACTIVE', 'EN_ATTENTE_DECISION', 'CLOTUREE', 'ARCHIVEE');

-- CreateEnum
CREATE TYPE "MissionType" AS ENUM ('PROJET', 'CYCLE_RECURRENT');

-- CreateEnum
CREATE TYPE "Periodicite" AS ENUM ('JOURNALIERE', 'HEBDOMADAIRE', 'MENSUELLE', 'PONCTUELLE');

-- CreateEnum
CREATE TYPE "Priorite" AS ENUM ('BASSE', 'MOYENNE', 'HAUTE');

-- CreateEnum
CREATE TYPE "TaskStatut" AS ENUM ('A_FAIRE', 'EN_COURS', 'EN_ATTENTE', 'TERMINEE');

-- CreateEnum
CREATE TYPE "TaskOrigine" AS ENUM ('MANAGER', 'MEMBRE');

-- CreateEnum
CREATE TYPE "RecurrenceFrequence" AS ENUM ('QUOTIDIENNE', 'HEBDOMADAIRE', 'MENSUELLE');

-- CreateEnum
CREATE TYPE "PeriodeType" AS ENUM ('JOUR', 'SEMAINE', 'MOIS', 'MISSION');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TACHE_ASSIGNEE', 'TACHE_EN_RETARD', 'ECHEANCE_PROCHE', 'RECAP_QUOTIDIEN', 'RECAP_HEBDO', 'MISSION_FIN_PROCHE', 'MISSION_EN_ATTENTE_DECISION', 'MISSION_CLOTUREE', 'MISSION_PROLONGEE', 'COMMENTAIRE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "poste" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "type" "MissionType" NOT NULL DEFAULT 'PROJET',
    "statut" "MissionStatut" NOT NULL DEFAULT 'EN_PREPARATION',
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFinInitiale" TIMESTAMP(3) NOT NULL,
    "dateFinActuelle" TIMESTAMP(3) NOT NULL,
    "dateCloture" TIMESTAMP(3),
    "bilanQualitatifManager" TEXT,
    "alerteJ3EnvoyeeLe" TIMESTAMP(3),
    "dernierRappelDecisionLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionMembre" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ajouteLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionMembre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionProlongation" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "dateDemande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ancienneEcheance" TIMESTAMP(3) NOT NULL,
    "nouvelleEcheance" TIMESTAMP(3) NOT NULL,
    "motif" TEXT,
    "auteurId" TEXT,

    CONSTRAINT "MissionProlongation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "missionId" TEXT,
    "periodicite" "Periodicite" NOT NULL DEFAULT 'PONCTUELLE',
    "echeance" TIMESTAMP(3) NOT NULL,
    "priorite" "Priorite" NOT NULL DEFAULT 'MOYENNE',
    "statut" "TaskStatut" NOT NULL DEFAULT 'A_FAIRE',
    "origine" "TaskOrigine" NOT NULL DEFAULT 'MANAGER',
    "createurId" TEXT NOT NULL,
    "dateFin" TIMESTAMP(3),
    "noteQualite" INTEGER,
    "commentaireQualite" TEXT,
    "evaluateurId" TEXT,
    "dateEvaluation" TIMESTAMP(3),
    "recurrenceActive" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceFrequence" "RecurrenceFrequence",
    "recurrenceFinLe" TIMESTAMP(3),
    "tacheModeleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignee" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "taille" INTEGER,
    "mimeType" TEXT,
    "uploadePar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodeType" "PeriodeType" NOT NULL,
    "periodeDebut" TIMESTAMP(3) NOT NULL,
    "periodeFin" TIMESTAMP(3) NOT NULL,
    "missionId" TEXT,
    "tauxCompletion" DOUBLE PRECISION NOT NULL,
    "ponctualite" DOUBLE PRECISION NOT NULL,
    "noteQualiteMoyenne" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "scoreGlobal" DOUBLE PRECISION NOT NULL,
    "nbTachesTotal" INTEGER NOT NULL DEFAULT 0,
    "nbTachesTerminees" INTEGER NOT NULL DEFAULT 0,
    "nbTachesEnRetard" INTEGER NOT NULL DEFAULT 0,
    "calculeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "lien" TEXT,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "emailEnvoye" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiWeightConfig" (
    "id" TEXT NOT NULL,
    "critere" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "poids" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KpiWeightConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Mission_statut_idx" ON "Mission"("statut");

-- CreateIndex
CREATE INDEX "Mission_dateFinActuelle_idx" ON "Mission"("dateFinActuelle");

-- CreateIndex
CREATE INDEX "MissionMembre_userId_idx" ON "MissionMembre"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionMembre_missionId_userId_key" ON "MissionMembre"("missionId", "userId");

-- CreateIndex
CREATE INDEX "MissionProlongation_missionId_idx" ON "MissionProlongation"("missionId");

-- CreateIndex
CREATE INDEX "Task_missionId_idx" ON "Task"("missionId");

-- CreateIndex
CREATE INDEX "Task_statut_idx" ON "Task"("statut");

-- CreateIndex
CREATE INDEX "Task_echeance_idx" ON "Task"("echeance");

-- CreateIndex
CREATE INDEX "TaskAssignee_userId_idx" ON "TaskAssignee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignee_taskId_userId_key" ON "TaskAssignee"("taskId", "userId");

-- CreateIndex
CREATE INDEX "Comment_taskId_idx" ON "Comment"("taskId");

-- CreateIndex
CREATE INDEX "Attachment_taskId_idx" ON "Attachment"("taskId");

-- CreateIndex
CREATE INDEX "PerformanceScore_userId_periodeType_idx" ON "PerformanceScore"("userId", "periodeType");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceScore_userId_periodeType_periodeDebut_periodeFin_key" ON "PerformanceScore"("userId", "periodeType", "periodeDebut", "periodeFin", "missionId");

-- CreateIndex
CREATE INDEX "Notification_userId_lu_idx" ON "Notification"("userId", "lu");

-- CreateIndex
CREATE UNIQUE INDEX "KpiWeightConfig_critere_key" ON "KpiWeightConfig"("critere");

-- AddForeignKey
ALTER TABLE "MissionMembre" ADD CONSTRAINT "MissionMembre_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionMembre" ADD CONSTRAINT "MissionMembre_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionProlongation" ADD CONSTRAINT "MissionProlongation_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionProlongation" ADD CONSTRAINT "MissionProlongation_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createurId_fkey" FOREIGN KEY ("createurId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_evaluateurId_fkey" FOREIGN KEY ("evaluateurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_tacheModeleId_fkey" FOREIGN KEY ("tacheModeleId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadePar_fkey" FOREIGN KEY ("uploadePar") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceScore" ADD CONSTRAINT "PerformanceScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceScore" ADD CONSTRAINT "PerformanceScore_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
