-- Ajoute la date de début d'une tâche, en plus de son échéance existante.
-- Colonne ajoutée nullable puis repeuplée avant de la rendre obligatoire,
-- pour ne pas échouer sur les lignes déjà en base (backfill : même jour que
-- l'échéance, cohérent avec une tâche jusque-là ponctuelle sur une journée).
ALTER TABLE "Task" ADD COLUMN "dateDebut" TIMESTAMP(3);

UPDATE "Task" SET "dateDebut" = "echeance";

ALTER TABLE "Task" ALTER COLUMN "dateDebut" SET NOT NULL;
