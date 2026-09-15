"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { exigerManager } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export type Resultat = { erreur?: string; succes?: string } | undefined;

const schemaMembre = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  poste: z.string().optional(),
  motDePasse: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  role: z.enum(["MANAGER", "MEMBER"]),
});

export async function creerMembre(
  _etat: Resultat,
  donnees: FormData,
): Promise<Resultat> {
  await exigerManager();

  const parsed = schemaMembre.safeParse({
    nom: donnees.get("nom"),
    email: donnees.get("email"),
    poste: donnees.get("poste") || undefined,
    motDePasse: donnees.get("motDePasse"),
    role: donnees.get("role") ?? "MEMBER",
  });

  if (!parsed.success) return { erreur: parsed.error.issues[0].message };

  const email = parsed.data.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    return { erreur: "Un compte utilise déjà cette adresse email." };
  }

  await prisma.user.create({
    data: {
      nom: parsed.data.nom,
      email,
      poste: parsed.data.poste,
      role: parsed.data.role,
      motDePasse: await bcrypt.hash(parsed.data.motDePasse, 12),
    },
  });

  revalidatePath("/manager/equipe");
  return { succes: `${parsed.data.nom} a été ajouté à l'équipe.` };
}

export async function basculerActivation(userId: string): Promise<Resultat> {
  const manager = await exigerManager();

  if (userId === manager.id) {
    return { erreur: "Vous ne pouvez pas désactiver votre propre compte." };
  }

  const membre = await prisma.user.findUnique({ where: { id: userId } });
  if (!membre) return { erreur: "Compte introuvable." };

  await prisma.user.update({
    where: { id: userId },
    data: { actif: !membre.actif },
  });

  revalidatePath("/manager/equipe");
  return {
    succes: membre.actif
      ? `${membre.nom} n'a plus accès à l'outil.`
      : `${membre.nom} a de nouveau accès à l'outil.`,
  };
}

export async function reinitialiserMotDePasse(
  _etat: Resultat,
  donnees: FormData,
): Promise<Resultat> {
  await exigerManager();

  const userId = String(donnees.get("userId") ?? "");
  const motDePasse = String(donnees.get("motDePasse") ?? "");

  if (motDePasse.length < 8) {
    return { erreur: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const membre = await prisma.user.findUnique({ where: { id: userId } });
  if (!membre) return { erreur: "Compte introuvable." };

  await prisma.user.update({
    where: { id: userId },
    data: { motDePasse: await bcrypt.hash(motDePasse, 12) },
  });

  revalidatePath("/manager/equipe");
  return { succes: `Mot de passe de ${membre.nom} réinitialisé.` };
}
