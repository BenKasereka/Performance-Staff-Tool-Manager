"use server";

import { revalidatePath } from "next/cache";
import { addDays, addMonths, addWeeks, endOfDay } from "date-fns";
import { z } from "zod";

import { exigerManager } from "@/lib/auth-guards";
import { notifierPlusieurs } from "@/lib/notifications";
import { formaterDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export type Resultat = { erreur?: string; succes?: string } | undefined;

const schemaMission = z
  .object({
    nom: z.string().min(2, "Le nom de la mission est requis"),
    description: z.string().optional(),
    type: z.enum(["PROJET", "CYCLE_RECURRENT"]),
    dateDebut: z.coerce.date(),
    dateFin: z.coerce.date(),
    membres: z.array(z.string()).min(1, "Assignez au moins une personne"),
  })
  .refine((d) => d.dateFin >= d.dateDebut, {
    message: "La date de fin doit suivre la date de début",
    path: ["dateFin"],
  });

function lireFormulaireMission(donnees: FormData) {
  return schemaMission.safeParse({
    nom: donnees.get("nom"),
    description: donnees.get("description") || undefined,
    type: donnees.get("type") ?? "PROJET",
    dateDebut: donnees.get("dateDebut"),
    dateFin: donnees.get("dateFin"),
    membres: donnees.getAll("membres").map(String).filter(Boolean),
  });
}

export async function creerMission(
  _etat: Resultat,
  donnees: FormData,
): Promise<Resultat> {
  await exigerManager();

  const parsed = lireFormulaireMission(donnees);
  if (!parsed.success) return { erreur: parsed.error.issues[0].message };

  const { nom, description, type, dateDebut, dateFin, membres } = parsed.data;
  const fin = endOfDay(dateFin);

  await prisma.mission.create({
    data: {
      nom,
      description,
      type,
      dateDebut,
      dateFinInitiale: fin,
      dateFinActuelle: fin,
      statut: donnees.get("demarrer") === "1" ? "ACTIVE" : "EN_PREPARATION",
      membres: { create: membres.map((userId) => ({ userId })) },
    },
  });

  revalidatePath("/manager/missions");
  return { succes: `Mission « ${nom} » créée.` };
}

export async function modifierMission(
  _etat: Resultat,
  donnees: FormData,
): Promise<Resultat> {
  await exigerManager();

  const missionId = String(donnees.get("missionId") ?? "");
  const parsed = lireFormulaireMission(donnees);
  if (!parsed.success) return { erreur: parsed.error.issues[0].message };

  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission) return { erreur: "Mission introuvable." };

  const { nom, description, type, dateDebut, dateFin, membres } = parsed.data;
  const fin = endOfDay(dateFin);

  // Repousser l'échéance depuis ce formulaire n'est pas une prolongation au sens
  // du §3.1 : l'historique de prolongation ne se remplit que via prolongerMission.
  await prisma.$transaction([
    prisma.missionMembre.deleteMany({
      where: { missionId, userId: { notIn: membres } },
    }),
    prisma.missionMembre.createMany({
      data: membres.map((userId) => ({ missionId, userId })),
      skipDuplicates: true,
    }),
    prisma.mission.update({
      where: { id: missionId },
      data: { nom, description, type, dateDebut, dateFinActuelle: fin },
    }),
  ]);

  revalidatePath("/manager/missions");
  revalidatePath(`/manager/missions/${missionId}`);
  return { succes: "Mission mise à jour." };
}

export async function demarrerMission(missionId: string): Promise<Resultat> {
  await exigerManager();

  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission) return { erreur: "Mission introuvable." };
  if (mission.statut !== "EN_PREPARATION") {
    return { erreur: "Seule une mission en préparation peut être démarrée." };
  }

  await prisma.mission.update({
    where: { id: missionId },
    data: { statut: "ACTIVE" },
  });

  revalidatePath("/manager/missions");
  revalidatePath(`/manager/missions/${missionId}`);
  return { succes: "Mission démarrée." };
}

const schemaProlongation = z.object({
  missionId: z.string().min(1),
  mode: z.enum(["date", "duree"]),
  nouvelleEcheance: z.string().optional(),
  duree: z.enum(["1s", "2s", "1m", "3m"]).optional(),
  motif: z.string().optional(),
});

function appliquerDuree(base: Date, duree: "1s" | "2s" | "1m" | "3m") {
  switch (duree) {
    case "1s":
      return addWeeks(base, 1);
    case "2s":
      return addWeeks(base, 2);
    case "1m":
      return addMonths(base, 1);
    case "3m":
      return addMonths(base, 3);
  }
}

export async function prolongerMission(
  _etat: Resultat,
  donnees: FormData,
): Promise<Resultat> {
  const manager = await exigerManager();

  const parsed = schemaProlongation.safeParse({
    missionId: donnees.get("missionId"),
    mode: donnees.get("mode") ?? "duree",
    nouvelleEcheance: donnees.get("nouvelleEcheance") || undefined,
    duree: donnees.get("duree") || undefined,
    motif: donnees.get("motif") || undefined,
  });
  if (!parsed.success) return { erreur: "Formulaire de prolongation invalide." };

  const mission = await prisma.mission.findUnique({
    where: { id: parsed.data.missionId },
  });
  if (!mission) return { erreur: "Mission introuvable." };
  if (mission.statut === "CLOTUREE" || mission.statut === "ARCHIVEE") {
    return { erreur: "Une mission clôturée ne peut plus être prolongée." };
  }

  let nouvelle: Date;
  if (parsed.data.mode === "date") {
    if (!parsed.data.nouvelleEcheance) {
      return { erreur: "Indiquez la nouvelle date de fin." };
    }
    nouvelle = endOfDay(new Date(parsed.data.nouvelleEcheance));
  } else {
    if (!parsed.data.duree) return { erreur: "Choisissez une durée." };
    // La prolongation part de l'échéance en cours, ou d'aujourd'hui si elle est
    // déjà dépassée — sinon prolonger une mission en retard ne lui rendrait
    // aucun temps de travail réel.
    const base =
      mission.dateFinActuelle > new Date() ? mission.dateFinActuelle : new Date();
    nouvelle = endOfDay(appliquerDuree(base, parsed.data.duree));
  }

  if (nouvelle <= mission.dateFinActuelle) {
    return { erreur: "La nouvelle échéance doit dépasser l'échéance actuelle." };
  }

  await prisma.$transaction([
    prisma.missionProlongation.create({
      data: {
        missionId: mission.id,
        ancienneEcheance: mission.dateFinActuelle,
        nouvelleEcheance: nouvelle,
        motif: parsed.data.motif,
        auteurId: manager.id,
      },
    }),
    prisma.mission.update({
      where: { id: mission.id },
      data: {
        dateFinActuelle: nouvelle,
        statut: "ACTIVE",
        alerteJ3EnvoyeeLe: null,
        dernierRappelDecisionLe: null,
      },
    }),
  ]);

  const membresProlongation = await prisma.missionMembre.findMany({
    where: { missionId: mission.id },
    select: { userId: true },
  });
  await notifierPlusieurs(
    membresProlongation.map((m) => m.userId),
    {
      type: "MISSION_PROLONGEE",
      titre: `Mission prolongée : ${mission.nom}`,
      contenu: `La nouvelle échéance est le ${formaterDate(nouvelle)}.${parsed.data.motif ? ` Motif : ${parsed.data.motif}` : ""}`,
      lien: "/mon-espace/missions",
      email: true,
    },
  );

  revalidatePath("/manager");
  revalidatePath("/manager/missions");
  revalidatePath(`/manager/missions/${mission.id}`);
  return { succes: "Mission prolongée." };
}

export async function cloturerMission(missionId: string): Promise<Resultat> {
  await exigerManager();

  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission) return { erreur: "Mission introuvable." };
  if (mission.statut === "CLOTUREE" || mission.statut === "ARCHIVEE") {
    return { erreur: "Cette mission est déjà clôturée." };
  }

  await prisma.mission.update({
    where: { id: missionId },
    data: { statut: "CLOTUREE", dateCloture: new Date() },
  });

  const membres = await prisma.missionMembre.findMany({
    where: { missionId },
    select: { userId: true },
  });
  await notifierPlusieurs(
    membres.map((m) => m.userId),
    {
      type: "MISSION_CLOTUREE",
      titre: `Mission clôturée : ${mission.nom}`,
      contenu: "La mission est terminée. Merci pour votre travail.",
      lien: "/mon-espace/missions",
      email: true,
    },
  );

  revalidatePath("/manager");
  revalidatePath("/manager/missions");
  revalidatePath(`/manager/missions/${missionId}`);
  return { succes: "Mission clôturée. Le rapport de fin de mission est disponible." };
}

export async function archiverMission(missionId: string): Promise<Resultat> {
  await exigerManager();

  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission) return { erreur: "Mission introuvable." };
  if (mission.statut !== "CLOTUREE") {
    return { erreur: "Seule une mission clôturée peut être archivée." };
  }

  await prisma.mission.update({
    where: { id: missionId },
    data: { statut: "ARCHIVEE" },
  });

  revalidatePath("/manager/missions");
  return { succes: "Mission archivée." };
}

export async function enregistrerBilanQualitatif(
  _etat: Resultat,
  donnees: FormData,
): Promise<Resultat> {
  await exigerManager();

  const missionId = String(donnees.get("missionId") ?? "");
  const bilan = String(donnees.get("bilan") ?? "").trim();

  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission) return { erreur: "Mission introuvable." };

  await prisma.mission.update({
    where: { id: missionId },
    data: { bilanQualitatifManager: bilan || null },
  });

  revalidatePath(`/manager/missions/${missionId}`);
  return { succes: "Bilan enregistré." };
}

/**
 * Bascule en « en attente de décision » les missions-projets dont l'échéance est
 * passée sans décision du manager (§3.1). Appelée à l'affichage du dashboard et,
 * à l'étape 5, par le cron quotidien.
 */
export async function verifierMissionsEchues() {
  const maintenant = new Date();

  const { count } = await prisma.mission.updateMany({
    where: {
      statut: "ACTIVE",
      type: "PROJET",
      dateFinActuelle: { lt: maintenant },
    },
    data: { statut: "EN_ATTENTE_DECISION" },
  });

  return count;
}

export async function missionsProchesDeLecheance(joursAvant: number) {
  return prisma.mission.findMany({
    where: {
      statut: "ACTIVE",
      type: "PROJET",
      dateFinActuelle: {
        gte: new Date(),
        lte: addDays(new Date(), joursAvant),
      },
    },
    orderBy: { dateFinActuelle: "asc" },
  });
}
