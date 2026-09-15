import type { MissionStatut, Priorite } from "@prisma/client";

import { cn } from "@/lib/utils";
import {
  CLASSES_STATUT_MISSION,
  LIBELLES_STATUT_MISSION,
} from "@/lib/missions";
import {
  CLASSES_PRIORITE,
  CLASSES_STATUT,
  LIBELLES_PRIORITE,
  LIBELLES_STATUT,
  type StatutAffiche,
} from "@/lib/taches";

const BASE =
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function BadgeStatutTache({ statut }: { statut: StatutAffiche }) {
  return (
    <span className={cn(BASE, CLASSES_STATUT[statut])}>
      {LIBELLES_STATUT[statut]}
    </span>
  );
}

export function BadgePriorite({ priorite }: { priorite: Priorite }) {
  return (
    <span className={cn(BASE, CLASSES_PRIORITE[priorite])}>
      {LIBELLES_PRIORITE[priorite]}
    </span>
  );
}

export function BadgeStatutMission({ statut }: { statut: MissionStatut }) {
  return (
    <span className={cn(BASE, CLASSES_STATUT_MISSION[statut])}>
      {LIBELLES_STATUT_MISSION[statut]}
    </span>
  );
}

export function BadgeOrigine({ origine }: { origine: "MANAGER" | "MEMBRE" }) {
  return (
    <span
      className={cn(
        BASE,
        "border",
        origine === "MANAGER"
          ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200"
          : "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-200",
      )}
    >
      {origine === "MANAGER" ? "Assignée" : "Auto-déclarée"}
    </span>
  );
}
