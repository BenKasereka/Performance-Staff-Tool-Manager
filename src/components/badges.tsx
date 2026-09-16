import type { MissionStatut, Priorite } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import {
  VARIANT_STATUT_MISSION,
  LIBELLES_STATUT_MISSION,
} from "@/lib/missions";
import {
  VARIANT_PRIORITE,
  VARIANT_STATUT,
  LIBELLES_PRIORITE,
  LIBELLES_STATUT,
  type StatutAffiche,
} from "@/lib/taches";

export function BadgeStatutTache({ statut }: { statut: StatutAffiche }) {
  return (
    <Badge
      variant={VARIANT_STATUT[statut]}
      className={statut === "ANNULEE" ? "line-through" : undefined}
    >
      {LIBELLES_STATUT[statut]}
    </Badge>
  );
}

export function BadgePriorite({ priorite }: { priorite: Priorite }) {
  return <Badge variant={VARIANT_PRIORITE[priorite]}>{LIBELLES_PRIORITE[priorite]}</Badge>;
}

export function BadgeStatutMission({ statut }: { statut: MissionStatut }) {
  return (
    <Badge variant={VARIANT_STATUT_MISSION[statut]}>
      {LIBELLES_STATUT_MISSION[statut]}
    </Badge>
  );
}

export function BadgeOrigine({ origine }: { origine: "MANAGER" | "MEMBRE" }) {
  return (
    <Badge variant={origine === "MANAGER" ? "outline" : "secondary"}>
      {origine === "MANAGER" ? "Assignée" : "Auto-déclarée"}
    </Badge>
  );
}
