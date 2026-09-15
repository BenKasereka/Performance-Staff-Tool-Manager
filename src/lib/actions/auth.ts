"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

export type EtatFormulaire = { erreur?: string } | undefined;

const schemaConnexion = z.object({
  email: z.string().email("Adresse email invalide"),
  motDePasse: z.string().min(1, "Mot de passe requis"),
});

export async function connexion(
  _etat: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const parsed = schemaConnexion.safeParse({
    email: donnees.get("email"),
    motDePasse: donnees.get("motDePasse"),
  });

  if (!parsed.success) {
    return { erreur: parsed.error.issues[0].message };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      motDePasse: parsed.data.motDePasse,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { erreur: "Email ou mot de passe incorrect." };
    }
    throw error;
  }
}

const schemaPremierManager = z
  .object({
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Adresse email invalide"),
    motDePasse: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmation: z.string(),
  })
  .refine((d) => d.motDePasse === d.confirmation, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmation"],
  });

export async function creerPremierManager(
  _etat: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const nbUtilisateurs = await prisma.user.count();
  if (nbUtilisateurs > 0) {
    return {
      erreur:
        "Un compte existe déjà. Demandez à votre manager de vous créer un accès.",
    };
  }

  const parsed = schemaPremierManager.safeParse({
    nom: donnees.get("nom"),
    email: donnees.get("email"),
    motDePasse: donnees.get("motDePasse"),
    confirmation: donnees.get("confirmation"),
  });

  if (!parsed.success) {
    return { erreur: parsed.error.issues[0].message };
  }

  const hash = await bcrypt.hash(parsed.data.motDePasse, 12);

  await prisma.user.create({
    data: {
      nom: parsed.data.nom,
      email: parsed.data.email.toLowerCase(),
      motDePasse: hash,
      role: "MANAGER",
    },
  });

  await initialiserPoidsKpi();

  redirect("/connexion?compte-cree=1");
}

/** Poids par défaut des 4 critères du score (ajustables en base, cf. section 5). */
export async function initialiserPoidsKpi() {
  const criteres = [
    { critere: "tauxCompletion", libelle: "Taux de complétion", poids: 0.25 },
    { critere: "ponctualite", libelle: "Respect des délais", poids: 0.25 },
    { critere: "noteQualite", libelle: "Note qualité", poids: 0.25 },
    { critere: "volume", libelle: "Volume de travail", poids: 0.25 },
  ];

  await Promise.all(
    criteres.map((c) =>
      prisma.kpiWeightConfig.upsert({
        where: { critere: c.critere },
        update: {},
        create: c,
      }),
    ),
  );
}
