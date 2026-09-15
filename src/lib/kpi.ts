import type { PeriodeType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CritereKpi = "tauxCompletion" | "ponctualite" | "noteQualite" | "volume";

export type DetailScore = {
  userId: string;
  nom: string;
  poste: string | null;
  service: string | null;

  tauxCompletion: number;
  ponctualite: number;
  noteQualiteMoyenne: number;
  volume: number;
  scoreGlobal: number;

  nbTachesTotal: number;
  /** Tâches déjà échues ou terminées : le dénominateur du taux de complétion. */
  nbTachesExigibles: number;
  nbTachesTerminees: number;
  nbTachesEnRetard: number;
  nbTachesNotees: number;
  noteMoyenneSur5: number | null;

  /** Vrai quand la qualité n'a pas pu entrer dans le score, faute de notation. */
  qualiteNonEvaluee: boolean;
};

const POIDS_PAR_DEFAUT: Record<CritereKpi, number> = {
  tauxCompletion: 0.25,
  ponctualite: 0.25,
  noteQualite: 0.25,
  volume: 0.25,
};

export async function chargerPoids(): Promise<Record<CritereKpi, number>> {
  const config = await prisma.kpiWeightConfig.findMany();
  const poids = { ...POIDS_PAR_DEFAUT };
  for (const c of config) {
    if (c.critere in poids) poids[c.critere as CritereKpi] = c.poids;
  }
  return poids;
}

type Options = {
  debut: Date;
  fin: Date;
  missionId?: string;
  userIds?: string[];
};

/**
 * Calcule le score des membres sur une période.
 *
 * Les tâches annulées sont exclues de tous les dénominateurs : une tâche
 * abandonnée par décision du manager ne doit pénaliser personne.
 *
 * Quand aucune tâche terminée n'a été notée, le critère qualité est retiré du
 * score et les poids sont renormalisés sur les critères restants — sinon un
 * membre serait pénalisé pour une évaluation que son manager n'a pas faite.
 */
export async function calculerScores(options: Options): Promise<DetailScore[]> {
  const poids = await chargerPoids();

  const membres = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      actif: true,
      ...(options.userIds ? { id: { in: options.userIds } } : {}),
      ...(options.missionId
        ? { missions: { some: { missionId: options.missionId } } }
        : {}),
    },
    select: { id: true, nom: true, poste: true, service: true },
    orderBy: { nom: "asc" },
  });

  const where: Prisma.TaskWhereInput = {
    echeance: { gte: options.debut, lte: options.fin },
    statut: { not: "ANNULEE" },
    ...(options.missionId ? { missionId: options.missionId } : {}),
  };

  const taches = await prisma.task.findMany({
    where,
    select: {
      statut: true,
      echeance: true,
      dateFin: true,
      noteQualite: true,
      assignes: { select: { userId: true } },
    },
  });

  const parMembre = new Map<
    string,
    {
      total: number;
      exigibles: number;
      terminees: number;
      aLheure: number;
      enRetard: number;
      notes: number[];
    }
  >();
  for (const m of membres) {
    parMembre.set(m.id, {
      total: 0,
      exigibles: 0,
      terminees: 0,
      aLheure: 0,
      enRetard: 0,
      notes: [],
    });
  }

  const maintenant = new Date();

  for (const tache of taches) {
    const echue = tache.echeance < maintenant;
    const terminee = tache.statut === "TERMINEE";

    for (const { userId } of tache.assignes) {
      const agg = parMembre.get(userId);
      if (!agg) continue;

      agg.total++;

      // Une tâche dont l'échéance n'est pas encore arrivée et qui n'est pas
      // faite n'est pas un échec : au milieu d'un mois, la compter écraserait
      // le taux de complétion de toute l'équipe. Elle entrera au dénominateur
      // quand son échéance sera passée.
      if (echue || terminee) agg.exigibles++;

      if (terminee) {
        agg.terminees++;
        // Sans date de fin enregistrée, on ne peut pas conclure au retard :
        // on donne le bénéfice du doute plutôt que d'inventer une pénalité.
        if (!tache.dateFin || tache.dateFin <= tache.echeance) agg.aLheure++;
        if (tache.noteQualite) agg.notes.push(tache.noteQualite);
      } else if (echue) {
        agg.enRetard++;
      }
    }
  }

  const volumes = membres.map((m) => parMembre.get(m.id)!.total);
  const actifs = volumes.filter((v) => v > 0);
  const moyenneVolume =
    actifs.length > 0 ? actifs.reduce((s, v) => s + v, 0) / actifs.length : 0;

  return membres.map((membre) => {
    const agg = parMembre.get(membre.id)!;

    const tauxCompletion =
      agg.exigibles > 0 ? (agg.terminees / agg.exigibles) * 100 : 0;
    const ponctualite = agg.terminees > 0 ? (agg.aLheure / agg.terminees) * 100 : 0;

    const noteMoyenneSur5 =
      agg.notes.length > 0
        ? agg.notes.reduce((s, n) => s + n, 0) / agg.notes.length
        : null;
    // Une note de 1/5 vaut 0 et 5/5 vaut 100 : la note plancher ne doit pas
    // offrir 20 points gratuits.
    const noteQualiteMoyenne =
      noteMoyenneSur5 !== null ? ((noteMoyenneSur5 - 1) / 4) * 100 : 0;

    // La moyenne d'équipe vaut 50 points, le double de la moyenne plafonne à 100.
    const volume =
      moyenneVolume > 0 ? Math.min(100, (agg.total / moyenneVolume) * 50) : 0;

    const qualiteNonEvaluee = noteMoyenneSur5 === null;

    const composantes: { critere: CritereKpi; valeur: number }[] = [
      { critere: "tauxCompletion", valeur: tauxCompletion },
      { critere: "ponctualite", valeur: ponctualite },
      { critere: "volume", valeur: volume },
    ];
    if (!qualiteNonEvaluee) {
      composantes.push({ critere: "noteQualite", valeur: noteQualiteMoyenne });
    }

    const sommePoids = composantes.reduce((s, c) => s + poids[c.critere], 0);
    const scoreGlobal =
      sommePoids > 0
        ? composantes.reduce((s, c) => s + c.valeur * poids[c.critere], 0) / sommePoids
        : 0;

    return {
      userId: membre.id,
      nom: membre.nom,
      poste: membre.poste,
      service: membre.service,
      tauxCompletion: arrondir(tauxCompletion),
      ponctualite: arrondir(ponctualite),
      noteQualiteMoyenne: arrondir(noteQualiteMoyenne),
      volume: arrondir(volume),
      scoreGlobal: arrondir(scoreGlobal),
      nbTachesTotal: agg.total,
      nbTachesExigibles: agg.exigibles,
      nbTachesTerminees: agg.terminees,
      nbTachesEnRetard: agg.enRetard,
      nbTachesNotees: agg.notes.length,
      noteMoyenneSur5: noteMoyenneSur5 !== null ? arrondir(noteMoyenneSur5, 1) : null,
      qualiteNonEvaluee,
    };
  });
}

function arrondir(valeur: number, decimales = 0) {
  const facteur = 10 ** decimales;
  return Math.round(valeur * facteur) / facteur;
}

/** Fige les scores d'une période pour tracer l'évolution dans le temps. */
export async function enregistrerScores(
  periodeType: PeriodeType,
  options: Options,
) {
  const scores = await calculerScores(options);

  for (const s of scores) {
    const chiffres = {
      tauxCompletion: s.tauxCompletion,
      ponctualite: s.ponctualite,
      noteQualiteMoyenne: s.noteQualiteMoyenne,
      volume: s.volume,
      scoreGlobal: s.scoreGlobal,
      nbTachesTotal: s.nbTachesTotal,
      nbTachesTerminees: s.nbTachesTerminees,
      nbTachesEnRetard: s.nbTachesEnRetard,
    };

    // Pas d'upsert : Prisma refuse un null dans une clé unique composée, et
    // missionId est nul pour les périodes hors mission.
    const existant = await prisma.performanceScore.findFirst({
      where: {
        userId: s.userId,
        periodeType,
        periodeDebut: options.debut,
        periodeFin: options.fin,
        missionId: options.missionId ?? null,
      },
      select: { id: true },
    });

    if (existant) {
      await prisma.performanceScore.update({
        where: { id: existant.id },
        data: { ...chiffres, calculeLe: new Date() },
      });
    } else {
      await prisma.performanceScore.create({
        data: {
          userId: s.userId,
          periodeType,
          periodeDebut: options.debut,
          periodeFin: options.fin,
          missionId: options.missionId ?? null,
          ...chiffres,
        },
      });
    }
  }

  return scores;
}

export const LIBELLES_CRITERE: Record<CritereKpi, string> = {
  tauxCompletion: "Taux de complétion",
  ponctualite: "Respect des délais",
  noteQualite: "Note qualité",
  volume: "Volume de travail",
};
