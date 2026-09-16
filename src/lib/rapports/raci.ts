import { prisma } from "@/lib/prisma";
import { formaterDate, joursRestants } from "@/lib/dates";
import {
  estEnRetard,
  joursDeReport,
  LIBELLES_PERIODICITE,
  LIBELLES_PRIORITE,
  LIBELLES_STATUT,
  statutAffiche,
} from "@/lib/taches";

export type LigneRaci = {
  id: string;
  activite: string;
  description: string | null;
  mission: string;
  /** R — exécute le travail. */
  responsable: string;
  /** A — rend des comptes sur le résultat, déduit de l'organigramme. */
  approbateur: string;
  /** C — a contribué ou doit être consulté. */
  consultes: string;
  /** I — tenu informé. */
  informes: string;
  priorite: string;
  rangPriorite: number;
  periodicite: string;
  echeance: string;
  echeanceBrute: Date;
  statut: string;
  joursRestants: number;
  enRetard: boolean;
  joursDeReport: number;
  /** Urgence de reprise pour le remplaçant. */
  criticite: "Immédiate" | "Haute" | "Normale";
  dernierCommentaire: string | null;
};

export type RapportRaci = {
  perimetre: string;
  mission: { nom: string; dateFin: Date } | null;
  lignes: LigneRaci[];
  repartition: { responsable: string; total: number; enRetard: number }[];
  chiffres: {
    total: number;
    enRetard: number;
    immediates: number;
    sousSeptJours: number;
    sansApprobateur: number;
  };
  genereLe: Date;
};

const PRIORITE_RANG = { HAUTE: 0, MOYENNE: 1, BASSE: 2 } as const;

/**
 * RACI des activités encore ouvertes, pour une passation.
 *
 * Les rôles sont déduits des données réelles, jamais inventés : R est la
 * personne assignée, A son N+1 dans l'organigramme, C les personnes qui ont
 * créé la tâche ou commenté dessus, I les managers et les autres membres de la
 * mission.
 */
export async function construireRaci(
  missionId?: string,
): Promise<RapportRaci> {
  const taches = await prisma.task.findMany({
    where: {
      // Ouvertes uniquement : ce qui reste à faire à l'arrivée du remplaçant.
      statut: { notIn: ["TERMINEE", "ANNULEE"] },
      ...(missionId ? { missionId } : {}),
    },
    include: {
      mission: { select: { nom: true, membres: { select: { user: { select: { nom: true } } } } } },
      createur: { select: { id: true, nom: true } },
      assignes: {
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              poste: true,
              superieur: { select: { nom: true, poste: true } },
            },
          },
        },
      },
      commentaires: {
        include: { auteur: { select: { id: true, nom: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ priorite: "desc" }, { echeance: "asc" }],
  });

  const managers = await prisma.user.findMany({
    where: { role: "MANAGER", actif: true },
    select: { id: true, nom: true },
  });

  const lignes: LigneRaci[] = taches.map((tache) => {
    const responsables = tache.assignes.map((a) =>
      a.user.poste ? `${a.user.nom} (${a.user.poste})` : a.user.nom,
    );

    const approbateurs = [
      ...new Set(
        tache.assignes
          .map((a) => a.user.superieur)
          .filter((s) => s !== null)
          .map((s) => (s.poste ? `${s.nom} (${s.poste})` : s.nom)),
      ),
    ];

    const idsResponsables = new Set(tache.assignes.map((a) => a.userId));
    const consultes = [
      ...new Set(
        [
          ...(idsResponsables.has(tache.createur.id) ? [] : [tache.createur.nom]),
          ...tache.commentaires
            .filter((c) => !idsResponsables.has(c.auteurId))
            .map((c) => c.auteur.nom),
        ].filter(Boolean),
      ),
    ];

    const informes = [
      ...new Set([
        ...managers.map((m) => m.nom),
        ...(tache.mission?.membres.map((m) => m.user.nom) ?? []),
      ]),
    ].filter((nom) => !responsables.some((r) => r.startsWith(nom)));

    const retard = estEnRetard(tache);
    const restants = joursRestants(tache.echeance);

    return {
      id: tache.id,
      activite: tache.titre,
      description: tache.description,
      mission: tache.mission?.nom ?? "Activité courante",
      responsable: responsables.join(", ") || "Non assignée",
      approbateur: approbateurs.join(", ") || "Non défini",
      consultes: consultes.join(", ") || "—",
      informes: informes.join(", ") || "—",
      priorite: LIBELLES_PRIORITE[tache.priorite],
      rangPriorite: PRIORITE_RANG[tache.priorite],
      periodicite: LIBELLES_PERIODICITE[tache.periodicite],
      echeance: formaterDate(tache.echeance),
      echeanceBrute: tache.echeance,
      statut: LIBELLES_STATUT[statutAffiche(tache)],
      joursRestants: restants,
      enRetard: retard,
      joursDeReport: joursDeReport(tache),
      criticite:
        retard || tache.priorite === "HAUTE"
          ? retard
            ? "Immédiate"
            : "Haute"
          : restants <= 7
            ? "Haute"
            : "Normale",
      dernierCommentaire: tache.commentaires[0]
        ? `${tache.commentaires[0].auteur.nom} : ${tache.commentaires[0].contenu.slice(0, 160)}`
        : null,
    };
  });

  // Les activités en retard d'abord, puis les priorités hautes, puis par échéance :
  // c'est l'ordre dans lequel un remplaçant doit les reprendre.
  lignes.sort((a, b) => {
    if (a.enRetard !== b.enRetard) return a.enRetard ? -1 : 1;
    if (a.rangPriorite !== b.rangPriorite) return a.rangPriorite - b.rangPriorite;
    return a.echeanceBrute.getTime() - b.echeanceBrute.getTime();
  });

  const parResponsable = new Map<string, { total: number; enRetard: number }>();
  for (const ligne of lignes) {
    const agg = parResponsable.get(ligne.responsable) ?? { total: 0, enRetard: 0 };
    agg.total++;
    if (ligne.enRetard) agg.enRetard++;
    parResponsable.set(ligne.responsable, agg);
  }

  const mission = missionId
    ? await prisma.mission.findUnique({
        where: { id: missionId },
        select: { nom: true, dateFinActuelle: true },
      })
    : null;

  return {
    perimetre: mission ? `Activité « ${mission.nom} »` : "Toutes activités en cours",
    mission: mission ? { nom: mission.nom, dateFin: mission.dateFinActuelle } : null,
    lignes,
    repartition: [...parResponsable.entries()]
      .map(([responsable, agg]) => ({ responsable, ...agg }))
      .sort((a, b) => b.total - a.total),
    chiffres: {
      total: lignes.length,
      enRetard: lignes.filter((l) => l.enRetard).length,
      immediates: lignes.filter((l) => l.criticite === "Immédiate").length,
      sousSeptJours: lignes.filter(
        (l) => !l.enRetard && l.joursRestants <= 7,
      ).length,
      sansApprobateur: lignes.filter((l) => l.approbateur === "Non défini").length,
    },
    genereLe: new Date(),
  };
}
