import type { Priorite, Periodicite, Task, TaskStatut } from "@prisma/client";
import type { BadgeVariant } from "@/components/ui/badge";

/** Statut affiché : « en retard » est déduit, jamais stocké (cf. README). */
export type StatutAffiche = TaskStatut | "EN_RETARD";

/** Statuts qui ferment une tâche : elle cesse d'être reportée et de compter comme en retard. */
export const STATUTS_CLOS: TaskStatut[] = ["TERMINEE", "ANNULEE"];

export function estClose(tache: Pick<Task, "statut">) {
  return STATUTS_CLOS.includes(tache.statut);
}

export function statutAffiche(
  tache: Pick<Task, "statut" | "echeance">,
  reference = new Date(),
): StatutAffiche {
  if (!estClose(tache) && tache.echeance < reference) {
    return "EN_RETARD";
  }
  return tache.statut;
}

export function estEnRetard(
  tache: Pick<Task, "statut" | "echeance">,
  reference = new Date(),
) {
  return statutAffiche(tache, reference) === "EN_RETARD";
}

/**
 * Nombre de jours de report d'une tâche ouverte dont l'échéance est passée.
 *
 * Le report est un affichage : l'échéance d'origine n'est jamais réécrite, sinon
 * plus aucune tâche ne serait jamais en retard et le critère de ponctualité
 * afficherait 100 % en permanence.
 */
export function joursDeReport(
  tache: Pick<Task, "statut" | "echeance">,
  reference = new Date(),
) {
  if (estClose(tache)) return 0;
  const debutEcheance = new Date(tache.echeance).setHours(0, 0, 0, 0);
  const debutReference = new Date(reference).setHours(0, 0, 0, 0);
  const jours = Math.round((debutReference - debutEcheance) / 86_400_000);
  return Math.max(0, jours);
}

/** Une tâche terminée après son échéance compte comme livrée en retard. */
export function livreeEnRetard(tache: Pick<Task, "statut" | "echeance" | "dateFin">) {
  if (tache.statut !== "TERMINEE" || !tache.dateFin) return false;
  return tache.dateFin > tache.echeance;
}

export const LIBELLES_STATUT: Record<StatutAffiche, string> = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  EN_ATTENTE: "En attente",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
  EN_RETARD: "En retard",
};

export const LIBELLES_PRIORITE: Record<Priorite, string> = {
  BASSE: "Basse",
  MOYENNE: "Moyenne",
  HAUTE: "Haute",
};

export const LIBELLES_PERIODICITE: Record<Periodicite, string> = {
  JOURNALIERE: "Journalière",
  HEBDOMADAIRE: "Hebdomadaire",
  MENSUELLE: "Mensuelle",
  PONCTUELLE: "Ponctuelle",
};

/** Variante de badge (voir ui/badge.tsx) associée à chaque statut affiché. */
export const VARIANT_STATUT: Record<StatutAffiche, BadgeVariant> = {
  A_FAIRE: "neutral",
  EN_COURS: "info",
  EN_ATTENTE: "warning",
  TERMINEE: "success",
  ANNULEE: "neutral",
  EN_RETARD: "destructive",
};

/** Classes pour les usages hors badge (cellules de calendrier). */
export const CLASSES_STATUT: Record<StatutAffiche, string> = {
  A_FAIRE: "bg-muted text-muted-foreground",
  EN_COURS: "bg-primary/10 text-primary dark:bg-primary/20",
  EN_ATTENTE: "bg-warning/10 text-warning dark:bg-warning/20",
  TERMINEE: "bg-success/10 text-success dark:bg-success/20",
  ANNULEE: "bg-muted text-muted-foreground line-through",
  EN_RETARD: "bg-destructive/10 text-destructive dark:bg-destructive/20",
};

export const VARIANT_PRIORITE: Record<Priorite, BadgeVariant> = {
  BASSE: "neutral",
  MOYENNE: "info",
  HAUTE: "warning",
};
