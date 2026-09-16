"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { exigerManager } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export type Resultat = { erreur?: string; succes?: string } | undefined;

const schemaRubrique = z.object({
  titre: z.string().min(1),
  contenu: z.string().optional(),
});

const schema = z
  .object({
    periodeDebut: z.coerce.date(),
    periodeFin: z.coerce.date(),
    bilanContexte: z.string().optional(),
    bilanQualitatif: z.string().optional(),
    bilanPointsForts: z.string().optional(),
    bilanDefis: z.string().optional(),
    bilanRecommandations: z.string().optional(),
    bilanConclusion: z.string().optional(),
    informationsPratiques: z.string().optional(),
    rubriques: z.array(schemaRubrique),
  })
  .refine((d) => d.periodeFin >= d.periodeDebut, {
    message: "La date de fin doit suivre la date de début du mandat",
    path: ["periodeFin"],
  });

function lireFormulaire(donnees: FormData) {
  let rubriques: unknown = [];
  try {
    rubriques = JSON.parse(String(donnees.get("rubriques") || "[]"));
  } catch {
    rubriques = [];
  }

  return schema.safeParse({
    periodeDebut: donnees.get("periodeDebut"),
    periodeFin: donnees.get("periodeFin"),
    bilanContexte: donnees.get("bilanContexte") || undefined,
    bilanQualitatif: donnees.get("bilanQualitatif") || undefined,
    bilanPointsForts: donnees.get("bilanPointsForts") || undefined,
    bilanDefis: donnees.get("bilanDefis") || undefined,
    bilanRecommandations: donnees.get("bilanRecommandations") || undefined,
    bilanConclusion: donnees.get("bilanConclusion") || undefined,
    informationsPratiques: donnees.get("informationsPratiques") || undefined,
    rubriques,
  });
}

export async function sauvegarderRapportMandat(
  _etat: Resultat,
  donnees: FormData,
): Promise<Resultat> {
  const manager = await exigerManager();

  const analyse = lireFormulaire(donnees);
  if (!analyse.success) {
    return { erreur: analyse.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const d = analyse.data;

  const existant = await prisma.rapportMandat.findFirst({
    where: {
      managerId: manager.id,
      periodeDebut: d.periodeDebut,
      periodeFin: d.periodeFin,
    },
    select: { id: true },
  });

  const champs = {
    bilanContexte: d.bilanContexte || null,
    bilanQualitatif: d.bilanQualitatif || null,
    bilanPointsForts: d.bilanPointsForts || null,
    bilanDefis: d.bilanDefis || null,
    bilanRecommandations: d.bilanRecommandations || null,
    bilanConclusion: d.bilanConclusion || null,
    informationsPratiques: d.informationsPratiques || null,
    genereLe: new Date(),
  };

  const rapportId = existant
    ? existant.id
    : (
        await prisma.rapportMandat.create({
          data: {
            managerId: manager.id,
            periodeDebut: d.periodeDebut,
            periodeFin: d.periodeFin,
            ...champs,
          },
          select: { id: true },
        })
      ).id;

  if (existant) {
    await prisma.rapportMandat.update({ where: { id: rapportId }, data: champs });
  }

  // Pas d'upsert ligne à ligne : la liste est réécrite en bloc à chaque
  // sauvegarde, plus simple qu'un diff pour une poignée de rubriques.
  await prisma.rapportMandatRubrique.deleteMany({ where: { rapportId } });
  if (d.rubriques.length > 0) {
    await prisma.rapportMandatRubrique.createMany({
      data: d.rubriques.map((r, i) => ({
        rapportId,
        ordre: i,
        titre: r.titre,
        contenu: r.contenu || null,
      })),
    });
  }

  revalidatePath("/manager/rapport-fin-mission");
  return { succes: "Rapport de fin de mission enregistré." };
}
