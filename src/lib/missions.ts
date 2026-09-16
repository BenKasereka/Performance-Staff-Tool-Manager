import type { MissionStatut, MissionType } from "@prisma/client";
import type { BadgeVariant } from "@/components/ui/badge";

export const LIBELLES_STATUT_MISSION: Record<MissionStatut, string> = {
  EN_PREPARATION: "En préparation",
  ACTIVE: "Active",
  EN_ATTENTE_DECISION: "En attente de décision",
  CLOTUREE: "Clôturée",
  ARCHIVEE: "Archivée",
};

export const VARIANT_STATUT_MISSION: Record<MissionStatut, BadgeVariant> = {
  EN_PREPARATION: "neutral",
  ACTIVE: "success",
  EN_ATTENTE_DECISION: "destructive",
  CLOTUREE: "info",
  ARCHIVEE: "neutral",
};

export const LIBELLES_TYPE_MISSION: Record<MissionType, string> = {
  PROJET: "Activité-projet",
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
