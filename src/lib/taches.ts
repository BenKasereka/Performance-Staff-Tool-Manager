import type { Priorite, Periodicite, Task, TaskStatut } from "@prisma/client";

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

export const CLASSES_STATUT: Record<StatutAffiche, string> = {
  A_FAIRE: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  EN_COURS: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  EN_ATTENTE: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  TERMINEE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  ANNULEE:
    "bg-slate-100 text-slate-500 line-through dark:bg-slate-900 dark:text-slate-400",
  EN_RETARD: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

export const CLASSES_PRIORITE: Record<Priorite, string> = {
  BASSE: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  MOYENNE: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  HAUTE: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
};
