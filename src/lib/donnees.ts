import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { TacheAffichee } from "@/components/liste-taches";

const INCLUDE_TACHE = {
  mission: { select: { id: true, nom: true } },
  assignes: { include: { user: { select: { id: true, nom: true } } } },
} satisfies Prisma.TaskInclude;

type TacheComplete = Prisma.TaskGetPayload<{ include: typeof INCLUDE_TACHE }>;

function versAffichage(tache: TacheComplete): TacheAffichee {
  return {
    id: tache.id,
    titre: tache.titre,
    description: tache.description,
    statut: tache.statut,
    dateDebut: tache.dateDebut,
    echeance: tache.echeance,
    priorite: tache.priorite,
    periodicite: tache.periodicite,
    origine: tache.origine,
    missionId: tache.missionId,
    missionNom: tache.mission?.nom ?? null,
    noteQualite: tache.noteQualite,
    recurrenceActive: tache.recurrenceActive,
    recurrenceFrequence: tache.recurrenceFrequence,
    recurrenceFinLe: tache.recurrenceFinLe,
    assignes: tache.assignes.map((a) => ({ id: a.user.id, nom: a.user.nom })),
  };
}

export async function chargerTaches(where: Prisma.TaskWhereInput) {
  const taches = await prisma.task.findMany({
    where,
    include: INCLUDE_TACHE,
    orderBy: [{ echeance: "asc" }, { priorite: "desc" }],
  });
  return taches.map(versAffichage);
}

/**
 * Tâches d'une journée, report compris.
 *
 * Une tâche est « du jour » si sa période prévue (début → échéance) chevauche
 * cette journée, pas seulement si elle échoit ce jour-là : une tâche prévue
 * sur plusieurs jours apparaît sur chacun d'eux, pour permettre de s'organiser
 * puis de s'auto-évaluer en fin de journée sur ce qui était prévu. En plus de
 * cela, une tâche ouverte dont l'échéance est passée se reporte sur la
 * journée en cours jusqu'à ce qu'elle soit terminée ou annulée. Le report ne
 * vaut que pour aujourd'hui : consulter une journée passée ou future montre
 * ce qui y était réellement prévu.
 */
export async function chargerTachesDuJour(
  jour: { debut: Date; fin: Date },
  filtres: Prisma.TaskWhereInput = {},
) {
  const maintenant = new Date();
  const estAujourdhui = jour.debut <= maintenant && maintenant <= jour.fin;

  const chevaucheLaJournee: Prisma.TaskWhereInput = {
    dateDebut: { lte: jour.fin },
    echeance: { gte: jour.debut },
  };

  const where: Prisma.TaskWhereInput = estAujourdhui
    ? {
        ...filtres,
        OR: [
          chevaucheLaJournee,
          {
            echeance: { lt: jour.debut },
            statut: { notIn: ["TERMINEE", "ANNULEE"] },
          },
        ],
      }
    : { ...filtres, ...chevaucheLaJournee };

  return chargerTaches(where);
}

export async function chargerMembres() {
  return prisma.user.findMany({
    where: { actif: true },
    select: { id: true, nom: true },
    orderBy: { nom: "asc" },
  });
}

export async function chargerMissionsOptions(userId?: string) {
  return prisma.mission.findMany({
    where: {
      statut: { in: ["EN_PREPARATION", "ACTIVE", "EN_ATTENTE_DECISION"] },
      ...(userId ? { membres: { some: { userId } } } : {}),
    },
    select: { id: true, nom: true },
    orderBy: { nom: "asc" },
  });
}
