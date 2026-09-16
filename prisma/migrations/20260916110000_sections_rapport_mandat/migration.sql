-- AlterTable
ALTER TABLE "RapportMandat" ADD COLUMN     "sectionsIncluses" TEXT[] DEFAULT ARRAY[]::TEXT[];
