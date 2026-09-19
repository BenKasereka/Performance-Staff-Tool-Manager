import { differenceInCalendarDays } from "date-fns";

import { prisma } from "@/lib/prisma";
import { calculerScores, type DetailScore } from "@/lib/kpi";
import { estEnRetard, livreeEnRetard, LIBELLES_STATUT, statutAffiche } from "@/lib/taches";
import { formaterDate, intervalle, type Granularite } from "@/lib/dates";
import { collecterDescendance, construireOrganigramme } from "@/lib/organigramme";
import { LIBELLES_STATUT_MISSION, LIBELLES_TYPE_MISSION } from "@/lib/missions";
import { resoudreOrdreSections, type CleSectionMandat } from "@/lib/rapports/sections-mandat";

export type LigneTacheRapport = {
  titre: string;
  assignes: string;
  mission: string;
  echeance: string;
  statut: string;
  dateFin: string;
  enRetard: boolean;
  noteQualite: number | null;
  priorite: string;
  origine: string;
};

export type RapportIndividuel = {
  membre: { nom: string; poste: string | null; service: string | null; superieur: string | null };
  periode: { libelle: string; debut: Date; fin: Date };
  score: DetailScore | null;
  evolution: { periode: string; score: number | null }[];
  taches: LigneTacheRapport[];
  genereLe: Date;
};

function versLigne(tache: {
  titre: string;
  statut: "A_FAIRE" | "EN_COURS" | "EN_ATTENTE" | "TERMINEE" | "ANNULEE";
  echeance: Date;
  dateFin: Date | null;
  noteQualite: number | null;
  priorite: string;
  origine: string;
  mission: { nom: string } | null;
  assignes: { user: { nom: string } }[];
}): LigneTacheRapport {
  return {
    titre: tache.titre,
    assignes: tache.assignes.map((a) => a.user.nom).join(", "),
    mission: tache.mission?.nom ?? "Activité courante",
    echeance: formaterDate(tache.echeance),
    statut: LIBELLES_STATUT[statutAffiche(tache)],
    dateFin: tache.dateFin ? formaterDate(tache.dateFin) : "",
    enRetard: estEnRetard(tache) || livreeEnRetard(tache),
    noteQualite: tache.noteQualite,
    priorite: tache.priorite,
    origine: tache.origine === "MANAGER" ? "Assignée" : "Auto-déclarée",
  };
}

const INCLUDE = {
  mission: { select: { nom: true } },
  assignes: { include: { user: { select: { nom: true } } } },
} as const;

export async function construireRapportIndividuel(options: {
  userId: string;
  debut: Date;
  fin: Date;
  libellePeriode: string;
  missionId?: string;
}): Promise<RapportIndividuel | null> {
  const membre = await prisma.user.findUnique({
    where: { id: options.userId },
    select: {
      nom: true,
      poste: true,
      service: true,
      superieur: { select: { nom: true } },
    },
  });
  if (!membre) return null;

  // Calcul sur toute l'équipe : le critère de volume se normalise sur la
  // moyenne des collègues.
  const scores = await calculerScores({
    debut: options.debut,
    fin: options.fin,
    missionId: options.missionId,
  });
  const score = scores.find((s) => s.userId === options.userId) ?? null;

  const taches = await prisma.task.findMany({
    where: {
      assignes: { some: { userId: options.userId } },
      echeance: { gte: options.debut, lte: options.fin },
      ...(options.missionId ? { missionId: options.missionId } : {}),
    },
    include: INCLUDE,
    orderBy: { echeance: "asc" },
  });

  return {
    membre: {
      nom: membre.nom,
      poste: membre.poste,
      service: membre.service,
      superieur: membre.superieur?.nom ?? null,
    },
    periode: { libelle: options.libellePeriode, debut: options.debut, fin: options.fin },
    score,
    evolution: await evolutionMembre(options.userId, options.debut, options.fin),
    taches: taches.map(versLigne),
    genereLe: new Date(),
  };
}

async function evolutionMembre(userId: string, debut: Date, fin: Date) {
  const points: { periode: string; score: number | null }[] = [];
  const jours = differenceInCalendarDays(fin, debut);
  // Sur une longue période on découpe par mois, sinon par semaine.
  const pas: Granularite = jours > 80 ? "mois" : "semaine";

  let curseur = new Date(debut);
  let garde = 0;

  while (curseur <= fin && garde < 24) {
    const tranche = intervalle(pas, curseur);
    const scores = await calculerScores({
      debut: tranche.debut,
      fin: tranche.fin > fin ? fin : tranche.fin,
    });
    const sien = scores.find((s) => s.userId === userId);

    points.push({
      periode: formaterDate(tranche.debut),
      score: !sien || sien.nbTachesTotal === 0 ? null : sien.scoreGlobal,
    });

    curseur = new Date(tranche.fin.getTime() + 1);
    garde++;
  }

  return points;
}

export type RapportMission = {
  mission: {
    nom: string;
    description: string | null;
    dateDebut: Date;
    dateFinInitiale: Date;
    dateFinActuelle: Date;
    dateCloture: Date | null;
    dureeJours: number;
    bilanContexte: string | null;
    bilanQualitatif: string | null;
    bilanPointsForts: string | null;
    bilanDefis: string | null;
    bilanRecommandations: string | null;
    bilanConclusion: string | null;
  };
  membres: string[];
  /** Organisation de l'équipe engagée, telle que décrite par l'organigramme. */
  equipe: {
    nom: string;
    poste: string | null;
    service: string | null;
    superieur: string | null;
    nbTaches: number;
  }[];
  /** Activités encore ouvertes à la clôture : ce qui reste à reprendre. */
  enSuspens: {
    titre: string;
    responsable: string;
    echeance: string;
    priorite: string;
    statut: string;
    enRetard: boolean;
  }[];
  chiffres: {
    total: number;
    terminees: number;
    manquees: number;
    enRetard: number;
    tauxCompletion: number;
    ponctualiteMoyenne: number;
    qualiteMoyenne: number | null;
  };
  avancement: { periode: string; completion: number }[];
  parMembre: DetailScore[];
  prolongations: {
    date: string;
    ancienne: string;
    nouvelle: string;
    joursAjoutes: number;
    motif: string | null;
    auteur: string | null;
  }[];
  taches: LigneTacheRapport[];
  genereLe: Date;
};

export async function construireRapportMission(
  missionId: string,
): Promise<RapportMission | null> {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: {
      membres: {
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              poste: true,
              service: true,
              superieur: { select: { nom: true } },
            },
          },
        },
      },
      prolongations: {
        include: { auteur: { select: { nom: true } } },
        orderBy: { dateDemande: "asc" },
      },
    },
  });
  if (!mission) return null;

  const taches = await prisma.task.findMany({
    where: { missionId },
    include: INCLUDE,
    orderBy: { echeance: "asc" },
  });

  const retenues = taches.filter((t) => t.statut !== "ANNULEE");
  const terminees = retenues.filter((t) => t.statut === "TERMINEE");
  const enRetard = retenues.filter((t) => estEnRetard(t));
  const aLheure = terminees.filter((t) => !livreeEnRetard(t));
  const notees = terminees.filter((t) => t.noteQualite);

  const parMembre = await calculerScores({
    debut: mission.dateDebut,
    fin: mission.dateFinActuelle,
    missionId,
  });

  return {
    mission: {
      nom: mission.nom,
      description: mission.description,
      dateDebut: mission.dateDebut,
      dateFinInitiale: mission.dateFinInitiale,
      dateFinActuelle: mission.dateFinActuelle,
      dateCloture: mission.dateCloture,
      dureeJours: differenceInCalendarDays(
        mission.dateCloture ?? mission.dateFinActuelle,
        mission.dateDebut,
      ),
      bilanContexte: mission.bilanContexte,
      bilanQualitatif: mission.bilanQualitatifManager,
      bilanPointsForts: mission.bilanPointsForts,
      bilanDefis: mission.bilanDefis,
      bilanRecommandations: mission.bilanRecommandations,
      bilanConclusion: mission.bilanConclusion,
    },
    membres: mission.membres.map((m) => m.user.nom),
    equipe: mission.membres.map((m) => ({
      nom: m.user.nom,
      poste: m.user.poste,
      service: m.user.service,
      superieur: m.user.superieur?.nom ?? null,
      nbTaches: taches.filter((t) =>
        t.assignes.some((a) => a.user.nom === m.user.nom),
      ).length,
    })),
    enSuspens: retenues
      .filter((t) => t.statut !== "TERMINEE")
      .sort((a, b) => a.echeance.getTime() - b.echeance.getTime())
      .map((t) => ({
        titre: t.titre,
        responsable: t.assignes.map((a) => a.user.nom).join(", ") || "Non assignée",
        echeance: formaterDate(t.echeance),
        priorite: t.priorite,
        statut: LIBELLES_STATUT[statutAffiche(t)],
        enRetard: estEnRetard(t),
      })),
    chiffres: {
      total: retenues.length,
      terminees: terminees.length,
      manquees: retenues.length - terminees.length,
      enRetard: enRetard.length,
      tauxCompletion:
        retenues.length > 0
          ? Math.round((terminees.length / retenues.length) * 100)
          : 0,
      ponctualiteMoyenne:
        terminees.length > 0
          ? Math.round((aLheure.length / terminees.length) * 100)
          : 0,
      qualiteMoyenne:
        notees.length > 0
          ? Math.round(
              (notees.reduce((s, t) => s + (t.noteQualite ?? 0), 0) /
                notees.length) *
                10,
            ) / 10
          : null,
    },
    avancement: await avancementMission(missionId, mission.dateDebut, mission.dateFinActuelle),
    parMembre: [...parMembre].sort((a, b) => b.scoreGlobal - a.scoreGlobal),
    prolongations: mission.prolongations.map((p) => ({
      date: formaterDate(p.dateDemande),
      ancienne: formaterDate(p.ancienneEcheance),
      nouvelle: formaterDate(p.nouvelleEcheance),
      joursAjoutes: differenceInCalendarDays(p.nouvelleEcheance, p.ancienneEcheance),
      motif: p.motif,
      auteur: p.auteur?.nom ?? null,
    })),
    taches: taches.map(versLigne),
    genereLe: new Date(),
  };
}

/** Courbe d'avancement cumulée : part des tâches terminées au fil de la mission. */
async function avancementMission(missionId: string, debut: Date, fin: Date) {
  const taches = await prisma.task.findMany({
    where: { missionId, statut: { not: "ANNULEE" } },
    select: { echeance: true, statut: true, dateFin: true },
  });
  if (taches.length === 0) return [];

  const jours = differenceInCalendarDays(fin, debut);
  const pas: Granularite = jours > 80 ? "mois" : "semaine";

  const points: { periode: string; completion: number }[] = [];
  let curseur = new Date(debut);
  let garde = 0;

  while (curseur <= fin && garde < 24) {
    const tranche = intervalle(pas, curseur);
    const limite = tranche.fin > fin ? fin : tranche.fin;

    const echues = taches.filter((t) => t.echeance <= limite);
    const faites = echues.filter(
      (t) => t.statut === "TERMINEE" && t.dateFin && t.dateFin <= limite,
    );

    points.push({
      periode: formaterDate(tranche.debut),
      completion:
        echues.length > 0 ? Math.round((faites.length / echues.length) * 100) : 0,
    });

    curseur = new Date(tranche.fin.getTime() + 1);
    garde++;
  }

  return points;
}

/**
 * Rapport de fin de mission d'un manager : couvre tout son mandat, sur une
 * période, en agrégeant toutes les activités et tâches de son équipe (sa
 * descendance hiérarchique complète) — pas une seule activité isolée.
 */

export type RapportMandat = {
  manager: { nom: string; poste: string | null };
  periode: { debut: Date; fin: Date };
  bilan: {
    contexte: string | null;
    qualitatif: string | null;
    pointsForts: string | null;
    defis: string | null;
    recommandations: string | null;
    conclusion: string | null;
    informationsPratiques: string | null;
  };
  rubriques: { titre: string; contenu: string | null }[];
  equipe: {
    nom: string;
    poste: string | null;
    service: string | null;
    superieur: string | null;
    nbTaches: number;
  }[];
  activites: { nom: string; type: string; statut: string }[];
  enSuspens: {
    titre: string;
    activite: string;
    responsable: string;
    echeance: string;
    priorite: string;
    statut: string;
    enRetard: boolean;
  }[];
  chiffres: {
    total: number;
    terminees: number;
    manquees: number;
    enRetard: number;
    tauxCompletion: number;
    ponctualiteMoyenne: number;
    qualiteMoyenne: number | null;
  };
  avancement: { periode: string; completion: number }[];
  parMembre: DetailScore[];
  prolongations: {
    date: string;
    ancienne: string;
    nouvelle: string;
    joursAjoutes: number;
    motif: string | null;
    auteur: string | null;
    activite: string;
  }[];
  /** Meilleures tâches de la période — livrées à temps et notées 4/5 ou plus. */
  realisations: LigneTacheRapport[];
  taches: LigneTacheRapport[];
  /** Ordre et sélection des sections narratives, choisis par le manager. */
  sectionsIncluses: CleSectionMandat[];
  genereLe: Date;
};

export async function construireRapportMandat(
  managerId: string,
  periodeDebut: Date,
  periodeFin: Date,
): Promise<RapportMandat | null> {
  const manager = await prisma.user.findUnique({
    where: { id: managerId },
    select: { nom: true, poste: true },
  });
  if (!manager) return null;

  const [{ noeuds }, rapport] = await Promise.all([
    construireOrganigramme(),
    prisma.rapportMandat.findFirst({
      where: { managerId, periodeDebut, periodeFin },
      include: { rubriques: { orderBy: { ordre: "asc" } } },
    }),
  ]);

  const managerNoeud = noeuds.find((n) => n.id === managerId);
  const equipeIds = managerNoeud ? collecterDescendance(managerNoeud) : [];

  const taches =
    equipeIds.length === 0
      ? []
      : await prisma.task.findMany({
          where: {
            echeance: { gte: periodeDebut, lte: periodeFin },
            assignes: { some: { userId: { in: equipeIds } } },
          },
          include: INCLUDE,
          orderBy: { echeance: "asc" },
        });

  const retenues = taches.filter((t) => t.statut !== "ANNULEE");
  const terminees = retenues.filter((t) => t.statut === "TERMINEE");
  const enRetard = retenues.filter((t) => estEnRetard(t));
  const aLheure = terminees.filter((t) => !livreeEnRetard(t));
  const notees = terminees.filter((t) => t.noteQualite);

  const realisations = [...terminees]
    .filter((t) => (t.noteQualite ?? 0) >= 4 && !livreeEnRetard(t))
    .sort((a, b) => (b.noteQualite ?? 0) - (a.noteQualite ?? 0))
    .slice(0, 8)
    .map(versLigne);

  const parMembre = await calculerScores({
    debut: periodeDebut,
    fin: periodeFin,
    userIds: equipeIds,
  });

  const missionIds = [
    ...new Set(taches.map((t) => t.missionId).filter((id): id is string => !!id)),
  ];
  const missions =
    missionIds.length === 0
      ? []
      : await prisma.mission.findMany({
          where: { id: { in: missionIds } },
          include: {
            prolongations: {
              include: { auteur: { select: { nom: true } } },
              orderBy: { dateDemande: "asc" },
            },
          },
        });

  const equipePersonnes =
    equipeIds.length === 0
      ? []
      : await prisma.user.findMany({
          where: { id: { in: equipeIds } },
          select: {
            nom: true,
            poste: true,
            service: true,
            superieur: { select: { nom: true } },
          },
          orderBy: { nom: "asc" },
        });

  return {
    manager: { nom: manager.nom, poste: manager.poste },
    periode: { debut: periodeDebut, fin: periodeFin },
    bilan: {
      contexte: rapport?.bilanContexte ?? null,
      qualitatif: rapport?.bilanQualitatif ?? null,
      pointsForts: rapport?.bilanPointsForts ?? null,
      defis: rapport?.bilanDefis ?? null,
      recommandations: rapport?.bilanRecommandations ?? null,
      conclusion: rapport?.bilanConclusion ?? null,
      informationsPratiques: rapport?.informationsPratiques ?? null,
    },
    rubriques: (rapport?.rubriques ?? []).map((r) => ({
      titre: r.titre,
      contenu: r.contenu,
    })),
    equipe: equipePersonnes.map((p) => ({
      nom: p.nom,
      poste: p.poste,
      service: p.service,
      superieur: p.superieur?.nom ?? null,
      nbTaches: taches.filter((t) => t.assignes.some((a) => a.user.nom === p.nom))
        .length,
    })),
    activites: missions.map((m) => ({
      nom: m.nom,
      type: LIBELLES_TYPE_MISSION[m.type],
      statut: LIBELLES_STATUT_MISSION[m.statut],
    })),
    enSuspens: retenues
      .filter((t) => t.statut !== "TERMINEE")
      .sort((a, b) => a.echeance.getTime() - b.echeance.getTime())
      .map((t) => ({
        titre: t.titre,
        activite: t.mission?.nom ?? "Activité courante",
        responsable: t.assignes.map((a) => a.user.nom).join(", ") || "Non assignée",
        echeance: formaterDate(t.echeance),
        priorite: t.priorite,
        statut: LIBELLES_STATUT[statutAffiche(t)],
        enRetard: estEnRetard(t),
      })),
    chiffres: {
      total: retenues.length,
      terminees: terminees.length,
      manquees: retenues.length - terminees.length,
      enRetard: enRetard.length,
      tauxCompletion:
        retenues.length > 0
          ? Math.round((terminees.length / retenues.length) * 100)
          : 0,
      ponctualiteMoyenne:
        terminees.length > 0
          ? Math.round((aLheure.length / terminees.length) * 100)
          : 0,
      qualiteMoyenne:
        notees.length > 0
          ? Math.round(
              (notees.reduce((s, t) => s + (t.noteQualite ?? 0), 0) /
                notees.length) *
                10,
            ) / 10
          : null,
    },
    avancement: await avancementPeriode(equipeIds, periodeDebut, periodeFin),
    parMembre: [...parMembre].sort((a, b) => b.scoreGlobal - a.scoreGlobal),
    prolongations: missions.flatMap((m) =>
      m.prolongations.map((p) => ({
        date: formaterDate(p.dateDemande),
        ancienne: formaterDate(p.ancienneEcheance),
        nouvelle: formaterDate(p.nouvelleEcheance),
        joursAjoutes: differenceInCalendarDays(
          p.nouvelleEcheance,
          p.ancienneEcheance,
        ),
        motif: p.motif,
        auteur: p.auteur?.nom ?? null,
        activite: m.nom,
      })),
    ),
    realisations,
    sectionsIncluses: resoudreOrdreSections(rapport?.sectionsIncluses),
    taches: taches.map(versLigne),
    genereLe: new Date(),
  };
}

/** Courbe d'avancement cumulée sur la période, pour toute l'équipe du manager. */
async function avancementPeriode(userIds: string[], debut: Date, fin: Date) {
  if (userIds.length === 0) return [];

  const taches = await prisma.task.findMany({
    where: {
      assignes: { some: { userId: { in: userIds } } },
      statut: { not: "ANNULEE" },
      echeance: { gte: debut, lte: fin },
    },
    select: { echeance: true, statut: true, dateFin: true },
  });
  if (taches.length === 0) return [];

  const jours2 = differenceInCalendarDays(fin, debut);
  const pas2: Granularite = jours2 > 80 ? "mois" : "semaine";

  const points: { periode: string; completion: number }[] = [];
  let curseur2 = new Date(debut);
  let garde2 = 0;

  while (curseur2 <= fin && garde2 < 24) {
    const tranche = intervalle(pas2, curseur2);
    const limite = tranche.fin > fin ? fin : tranche.fin;

    const echues = taches.filter((t) => t.echeance <= limite);
    const faites = echues.filter(
      (t) => t.statut === "TERMINEE" && t.dateFin && t.dateFin <= limite,
    );

    points.push({
      periode: formaterDate(tranche.debut),
      completion:
        echues.length > 0 ? Math.round((faites.length / echues.length) * 100) : 0,
    });

    curseur2 = new Date(tranche.fin.getTime() + 1);
    garde2++;
  }

  return points;
}
