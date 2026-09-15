import type { MissionStatut, MissionType } from "@prisma/client";

export const LIBELLES_STATUT_MISSION: Record<MissionStatut, string> = {
  EN_PREPARATION: "En préparation",
  ACTIVE: "Active",
  EN_ATTENTE_DECISION: "En attente de décision",
  CLOTUREE: "Clôturée",
  ARCHIVEE: "Archivée",
};

export const CLASSES_STATUT_MISSION: Record<MissionStatut, string> = {
  EN_PREPARATION: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  EN_ATTENTE_DECISION: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  CLOTUREE: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  ARCHIVEE: "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400",
};

export const LIBELLES_TYPE_MISSION: Record<MissionType, string> = {
  PROJET: "Mission-projet",
  CYCLE_RECURRENT: "Cycle récurrent",
};

/** Délai, en jours avant l'échéance, de l'alerte de fin de mission (cf. §3.1). */
export const JOURS_ALERTE_FIN_MISSION = 3;

export function missionModifiable(statut: MissionStatut) {
  return statut === "EN_PREPARATION" || statut === "ACTIVE" || statut === "EN_ATTENTE_DECISION";
}

export function missionAccepteTaches(statut: MissionStatut) {
  return statut === "EN_PREPARATION" || statut === "ACTIVE" || statut === "EN_ATTENTE_DECISION";
}
