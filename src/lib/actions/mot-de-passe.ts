"use server";

import { createHash, randomBytes } from "crypto";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { envoyerEmail } from "@/lib/email";

export type Resultat = { erreur?: string; succes?: string } | undefined;

const DUREE_VALIDITE_JETON_MS = 60 * 60 * 1000;

function hashJeton(jeton: string) {
  return createHash("sha256").update(jeton).digest("hex");
}

const schemaNouveauMotDePasse = z
  .object({
    nouveauMotDePasse: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmation: z.string(),
  })
  .refine((d) => d.nouveauMotDePasse === d.confirmation, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmation"],
  });

/**
 * Changement volontaire (depuis le menu du compte) ou imposé au premier
 * login après un mot de passe assigné par le manager — même formulaire dans
 * les deux cas, on exige toujours le mot de passe actuel.
 */
export async function changerMotDePasse(
  _etat: Resultat,
  donnees: FormData,
): Promise<Resultat> {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const parsed = schemaNouveauMotDePasse
    .and(z.object({ motDePasseActuel: z.string().min(1, "Mot de passe actuel requis") }))
    .safeParse({
      motDePasseActuel: donnees.get("motDePasseActuel"),
      nouveauMotDePasse: donnees.get("nouveauMotDePasse"),
      confirmation: donnees.get("confirmation"),
    });

  if (!parsed.success) {
    return { erreur: parsed.error.issues[0].message };
  }

  const utilisateur = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!utilisateur) redirect("/connexion");

  const valide = await bcrypt.compare(
    parsed.data.motDePasseActuel,
    utilisateur.motDePasse,
  );
  if (!valide) return { erreur: "Mot de passe actuel incorrect." };

  await prisma.user.update({
    where: { id: utilisateur.id },
    data: {
      motDePasse: await bcrypt.hash(parsed.data.nouveauMotDePasse, 12),
      doitChangerMotDePasse: false,
    },
  });

  redirect(utilisateur.role === "MANAGER" ? "/manager" : "/mon-espace");
}

const schemaEmail = z.object({
  email: z.string().email("Adresse email invalide"),
});

/**
 * Toujours le même message de succès, que l'email existe ou non : ne jamais
 * révéler quels comptes existent via ce formulaire.
 */
const MESSAGE_GENERIQUE =
  "Si un compte existe avec cette adresse, un lien de réinitialisation vient de lui être envoyé.";

export async function demanderReinitialisation(
  _etat: Resultat,
  donnees: FormData,
): Promise<Resultat> {
  const parsed = schemaEmail.safeParse({ email: donnees.get("email") });
  if (!parsed.success) {
    return { erreur: parsed.error.issues[0].message };
  }

  const utilisateur = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (utilisateur && utilisateur.actif) {
    const jeton = randomBytes(32).toString("hex");

    await prisma.user.update({
      where: { id: utilisateur.id },
      data: {
        resetTokenHash: hashJeton(jeton),
        resetTokenExpire: new Date(Date.now() + DUREE_VALIDITE_JETON_MS),
      },
    });

    const lien = `${process.env.AUTH_URL}/reinitialiser-mot-de-passe?jeton=${jeton}`;

    const resultat = await envoyerEmail({
      destinataire: utilisateur.email,
      sujet: "Réinitialisation de votre mot de passe",
      titre: "Réinitialisation de votre mot de passe",
      corps: [
        `Bonjour ${utilisateur.nom},`,
        "Une réinitialisation de mot de passe a été demandée pour votre compte. Ce lien est valable une heure et ne peut être utilisé qu'une seule fois.",
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
      ],
      lien: { url: lien, libelle: "Choisir un nouveau mot de passe" },
    });

    if (!resultat.envoye) {
      console.log(`[mot-de-passe-oublie] Email non envoyé (${resultat.raison}). Lien : ${lien}`);
    }
  }

  return { succes: MESSAGE_GENERIQUE };
}

export async function reinitialiserAvecJeton(
  _etat: Resultat,
  donnees: FormData,
): Promise<Resultat> {
  const jeton = String(donnees.get("jeton") ?? "");
  if (!jeton) return { erreur: "Lien invalide ou expiré, demandez-en un nouveau." };

  const parsed = schemaNouveauMotDePasse.safeParse({
    nouveauMotDePasse: donnees.get("nouveauMotDePasse"),
    confirmation: donnees.get("confirmation"),
  });
  if (!parsed.success) {
    return { erreur: parsed.error.issues[0].message };
  }

  const utilisateur = await prisma.user.findUnique({
    where: { resetTokenHash: hashJeton(jeton) },
  });

  if (
    !utilisateur ||
    !utilisateur.resetTokenExpire ||
    utilisateur.resetTokenExpire < new Date()
  ) {
    return { erreur: "Lien invalide ou expiré, demandez-en un nouveau." };
  }

  await prisma.user.update({
    where: { id: utilisateur.id },
    data: {
      motDePasse: await bcrypt.hash(parsed.data.nouveauMotDePasse, 12),
      doitChangerMotDePasse: false,
      resetTokenHash: null,
      resetTokenExpire: null,
    },
  });

  redirect("/connexion?mot-de-passe-reinitialise=1");
}
