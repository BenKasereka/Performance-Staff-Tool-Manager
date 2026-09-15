"use server";

import { revalidatePath } from "next/cache";
import { addDays, addMonths, endOfDay } from "date-fns";
import { z } from "zod";
import type { RecurrenceFrequence, Task, TaskStatut } from "@prisma/client";

import { exigerUtilisateur } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export type Resultat = { erreur?: string; succes?: string } | undefined;

const schemaTache = z.object({
  titre: z.string().min(2, "Le titre est requis"),
  description: z.string().optional(),
  missionId: z.string().optional(),
  periodicite: z.enum([
    "JOURNALIERE",
    "HEBDOMADAIRE",
    "MENSUELLE",
    "PONCTUELLE",
  ]),
  echeance: z.coerce.date(),
  priorite: z.enum(["BASSE", "MOYENNE", "HAUTE"]),
  assignes: z.array(z.string()).min(1, "Assignez au moins une personne"),
  recurrenceFrequence: z
    .enum(["QUOTIDIENNE", "HEBDOMADAIRE", "MENSUELLE"])
    .optional(),
  recurrenceFinLe: z.coerce.date().optional(),
});

function lireFormulaireTache(donnees: FormData) {
  const recurrenceActive = donnees.get("recurrenceActive") === "1";
  return {
    recurrenceActive,
    parsed: schemaTache.safeParse({
      titre: donnees.get("titre"),
      description: donnees.get("description") || undefined,
      missionId: donnees.get("missionId") || undefined,
      periodicite: donnees.get("periodicite") ?? "PONCTUELLE",
      echeance: donnees.get("echeance"),
      priorite: donnees.get("priorite") ?? "MOYENNE",
      assignes: donnees.getAll("assignes").map(String).filter(Boolean),
      recurrenceFrequence: recurrenceActive
        ? donnees.get("recurrenceFrequence") || undefined
        : undefined,
      recurrenceFinLe:
        recurrenceActive && donnees.get("recurrenceFinLe")
          ? donnees.get("recurrenceFinLe")
          : undefined,
    }),
  };
}

export async function creerTache(
  _etat: Resultat,
  donnees: FormData,
): Promise<Resultat> {
  const utilisateur = await exigerUtilisateur();
  const { recurrenceActive, parsed } = lireFormulaireTache(donnees);
  if (!parsed.success) return { erreur: parsed.error.issues[0].message };

  const estManager = utilisateur.role === "MANAGER";
  const { assignes } = parsed.data;

  // Un membre ne peut se déclarer des tâches qu'à lui-même : sans ce garde-fou,
  // il pourrait assigner du travail à ses collègues.
  if (!estManager && (assignes.length !== 1 || assignes[0] !== utilisateur.id)) {
    return { erreur: "Vous ne pouvez créer des tâches que pour vous-même." };
  }

  const mission = parsed.data.missionId
    ? await prisma.mission.findUnique({ where: { id: parsed.data.missionId } })
    : null;
  if (parsed.data.missionId && !mission) {
    return { erreur: "Mission introuvable." };
  }

  await prisma.task.create({
    data: {
      titre: parsed.data.titre,
      description: parsed.data.description,
      missionId: mission?.id,
      periodicite: parsed.data.periodicite,
      echeance: endOfDay(parsed.data.echeance),
      priorite: parsed.data.priorite,
      origine: estManager ? "MANAGER" : "MEMBRE",
      createurId: utilisateur.id,
      recurrenceActive,
      recurrenceFrequence: parsed.data.recurrenceFrequence,
      recurrenceFinLe: parsed.data.recurrenceFinLe
        ? endOfDay(parsed.data.recurrenceFinLe)
        : null,
      assignes: { create: assignes.map((userId) => ({ userId })) },
    },
  });

  revaliderVues(mission?.id);
  return { succes: "Tâche créée." };
}

export async function modifierTache(
  _etat: Resultat,
  donnees: FormData,
): Promise<Resultat> {
  const utilisateur = await exigerUtilisateur();
  const tacheId = String(donnees.get("tacheId") ?? "");

  const tache = await prisma.task.findUnique({
    where: { id: tacheId },
    include: { assignes: true },
  });
  if (!tache) return { erreur: "Tâche introuvable." };

  const estManager = utilisateur.role === "MANAGER";
  if (!estManager && tache.createurId !== utilisateur.id) {
    return { erreur: "Vous ne pouvez modifier que les tâches que vous avez créées." };
  }

  const { recurrenceActive, parsed } = lireFormulaireTache(donnees);
  if (!parsed.success) return { erreur: parsed.error.issues[0].message };

  const { assignes } = parsed.data;
  if (!estManager && (assignes.length !== 1 || assignes[0] !== utilisateur.id)) {
    return { erreur: "Vous ne pouvez assigner des tâches qu'à vous-même." };
  }

  await prisma.$transaction([
    prisma.taskAssignee.deleteMany({
      where: { taskId: tacheId, userId: { notIn: assignes } },
    }),
    prisma.taskAssignee.createMany({
      data: assignes.map((userId) => ({ taskId: tacheId, userId })),
      skipDuplicates: true,
    }),
    prisma.task.update({
      where: { id: tacheId },
      data: {
        titre: parsed.data.titre,
        description: parsed.data.description,
        missionId: parsed.data.missionId || null,
        periodicite: parsed.data.periodicite,
        echeance: endOfDay(parsed.data.echeance),
        priorite: parsed.data.priorite,
        recurrenceActive,
        recurrenceFrequence: parsed.data.recurrenceFrequence ?? null,
        recurrenceFinLe: parsed.data.recurrenceFinLe
          ? endOfDay(parsed.data.recurrenceFinLe)
          : null,
      },
    }),
  ]);

  revaliderVues(parsed.data.missionId);
  return { succes: "Tâche mise à jour." };
}

export async function changerStatutTache(
  tacheId: string,
  statut: TaskStatut,
): Promise<Resultat> {
  const utilisateur = await exigerUtilisateur();

  const tache = await prisma.task.findUnique({
    where: { id: tacheId },
    include: { assignes: true },
  });
  if (!tache) return { erreur: "Tâche introuvable." };

  const estManager = utilisateur.role === "MANAGER";
  const estAssigne = tache.assignes.some((a) => a.userId === utilisateur.id);
  if (!estManager && !estAssigne) {
    return { erreur: "Cette tâche ne vous est pas assignée." };
  }

  const termine = statut === "TERMINEE";
  await prisma.task.update({
    where: { id: tacheId },
    data: {
      statut,
      // dateFin sert au calcul de ponctualité : on la fige à la complétion et on
      // l'efface si la tâche est rouverte. Une tâche annulée n'a pas de date de
      // livraison et sort des calculs de performance.
      dateFin: termine ? (tache.dateFin ?? new Date()) : null,
      ...(statut === "ANNULEE"
        ? { noteQualite: null, evaluateurId: null, dateEvaluation: null }
        : {}),
    },
  });

  if (termine && tache.recurrenceActive) {
    await genererProchaineOccurrence(tache);
  }

  revaliderVues(tache.missionId);
  return { succes: "Statut mis à jour." };
}

export async function evaluerTache(
  _etat: Resultat,
  donnees: FormData,
): Promise<Resultat> {
  const utilisateur = await exigerUtilisateur();
  if (utilisateur.role !== "MANAGER") {
    return { erreur: "Seul un manager peut noter la qualité d'une tâche." };
  }

  const tacheId = String(donnees.get("tacheId") ?? "");
  const note = Number(donnees.get("noteQualite"));
  const commentaire = String(donnees.get("commentaireQualite") ?? "").trim();

  if (!Number.isInteger(note) || note < 1 || note > 5) {
    return { erreur: "La note doit être comprise entre 1 et 5." };
  }

  const tache = await prisma.task.findUnique({ where: { id: tacheId } });
  if (!tache) return { erreur: "Tâche introuvable." };
  if (tache.statut !== "TERMINEE") {
    return { erreur: "Seule une tâche terminée peut être évaluée." };
  }

  await prisma.task.update({
    where: { id: tacheId },
    data: {
      noteQualite: note,
      commentaireQualite: commentaire || null,
      evaluateurId: utilisateur.id,
      dateEvaluation: new Date(),
    },
  });

  revaliderVues(tache.missionId);
  return { succes: "Évaluation enregistrée." };
}

export async function supprimerTache(tacheId: string): Promise<Resultat> {
  const utilisateur = await exigerUtilisateur();

  const tache = await prisma.task.findUnique({ where: { id: tacheId } });
  if (!tache) return { erreur: "Tâche introuvable." };

  if (utilisateur.role !== "MANAGER" && tache.createurId !== utilisateur.id) {
    return { erreur: "Vous ne pouvez supprimer que les tâches que vous avez créées." };
  }

  await prisma.task.delete({ where: { id: tacheId } });

  revaliderVues(tache.missionId);
  return { succes: "Tâche supprimée." };
}

export async function ajouterCommentaire(
  _etat: Resultat,
  donnees: FormData,
): Promise<Resultat> {
  const utilisateur = await exigerUtilisateur();

  const tacheId = String(donnees.get("tacheId") ?? "");
  const contenu = String(donnees.get("contenu") ?? "").trim();
  if (!contenu) return { erreur: "Le commentaire est vide." };

  const tache = await prisma.task.findUnique({
    where: { id: tacheId },
    include: { assignes: true },
  });
  if (!tache) return { erreur: "Tâche introuvable." };

  const estManager = utilisateur.role === "MANAGER";
  const estConcerne =
    tache.assignes.some((a) => a.userId === utilisateur.id) ||
    tache.createurId === utilisateur.id;
  if (!estManager && !estConcerne) {
    return { erreur: "Cette tâche ne vous concerne pas." };
  }

  await prisma.comment.create({
    data: { taskId: tacheId, auteurId: utilisateur.id, contenu },
  });

  revalidatePath(`/manager/taches/${tacheId}`);
  revalidatePath(`/mon-espace/taches/${tacheId}`);
  return { succes: "Commentaire ajouté." };
}

function prochaineEcheance(base: Date, frequence: RecurrenceFrequence) {
  switch (frequence) {
    case "QUOTIDIENNE":
      return addDays(base, 1);
    case "HEBDOMADAIRE":
      return addDays(base, 7);
    case "MENSUELLE":
      return addMonths(base, 1);
  }
}

/** Recrée la tâche suivante d'une série récurrente à sa complétion. */
async function genererProchaineOccurrence(tache: Task) {
  if (!tache.recurrenceFrequence) return;

  const suivante = endOfDay(
    prochaineEcheance(tache.echeance, tache.recurrenceFrequence),
  );
  if (tache.recurrenceFinLe && suivante > tache.recurrenceFinLe) return;

  const dejaCreee = await prisma.task.findFirst({
    where: {
      tacheModeleId: tache.tacheModeleId ?? tache.id,
      echeance: suivante,
    },
  });
  if (dejaCreee) return;

  const assignes = await prisma.taskAssignee.findMany({
    where: { taskId: tache.id },
  });

  await prisma.task.create({
    data: {
      titre: tache.titre,
      description: tache.description,
      missionId: tache.missionId,
      periodicite: tache.periodicite,
      echeance: suivante,
      priorite: tache.priorite,
      origine: tache.origine,
      createurId: tache.createurId,
      recurrenceActive: true,
      recurrenceFrequence: tache.recurrenceFrequence,
      recurrenceFinLe: tache.recurrenceFinLe,
      tacheModeleId: tache.tacheModeleId ?? tache.id,
      assignes: { create: assignes.map((a) => ({ userId: a.userId })) },
    },
  });
}

function revaliderVues(missionId?: string | null) {
  revalidatePath("/manager");
  revalidatePath("/manager/taches");
  revalidatePath("/manager/planning");
  revalidatePath("/mon-espace");
  revalidatePath("/mon-espace/taches");
  if (missionId) revalidatePath(`/manager/missions/${missionId}`);
}
