"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { exigerManager } from "@/lib/auth-guards";
import { envoyerEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export type Resultat = { erreur?: string; succes?: string } | undefined;

const schemaMembre = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  poste: z.string().optional(),
  service: z.string().optional(),
  superieurId: z.string().optional(),
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
    service: donnees.get("service") || undefined,
    superieurId: donnees.get("superieurId") || undefined,
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
      service: parsed.data.service,
      superieurId: parsed.data.superieurId,
      role: parsed.data.role,
      motDePasse: await bcrypt.hash(parsed.data.motDePasse, 12),
      // Mot de passe choisi par le manager, pas par la personne elle-même :
      // à changer dès la première connexion pour rester confidentiel.
      doitChangerMotDePasse: true,
    },
  });

  // Le mot de passe en clair n'existe que dans cette requête (jamais persisté
  // ailleurs que le hash ci-dessus) : c'est le seul moment où il peut être
  // transmis à la personne concernée.
  const invitation = await envoyerEmail({
    destinataire: email,
    sujet: "Votre accès à l'outil de suivi de performance d'équipe",
    titre: "Bienvenue — votre accès a été créé",
    corps: [
      `Bonjour ${parsed.data.nom},`,
      "Un accès à l'outil de suivi de performance d'équipe vient d'être créé pour vous par votre manager. Voici vos identifiants de connexion :",
      `Identifiant (email) : ${email}`,
      `Mot de passe temporaire : ${parsed.data.motDePasse}`,
      "Ce mot de passe est temporaire : vous devrez en choisir un nouveau, connu de vous seul, dès votre première connexion.",
    ],
    lien: { url: `${process.env.AUTH_URL}/connexion`, libelle: "Se connecter" },
  });

  revalidatePath("/manager/equipe");
  revalidatePath("/manager/organigramme");
  return {
    succes: invitation.envoye
      ? `${parsed.data.nom} a été ajouté à l'équipe et a reçu un email d'invitation.`
      : `${parsed.data.nom} a été ajouté à l'équipe. Email d'invitation non envoyé (${invitation.raison}) : communiquez-lui son mot de passe temporaire vous-même.`,
  };
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

export async function definirRattachement(
  _etat: Resultat,
  donnees: FormData,
): Promise<Resultat> {
  await exigerManager();

  const userId = String(donnees.get("userId") ?? "");
  const superieurId = String(donnees.get("superieurId") ?? "") || null;
  const service = String(donnees.get("service") ?? "").trim() || null;
  const poste = String(donnees.get("poste") ?? "").trim() || null;

  const membre = await prisma.user.findUnique({ where: { id: userId } });
  if (!membre) return { erreur: "Compte introuvable." };

  if (superieurId === userId) {
    return { erreur: "Une personne ne peut pas être son propre supérieur." };
  }

  if (superieurId && (await creeraitUnCycle(userId, superieurId))) {
    return {
      erreur:
        "Ce rattachement créerait une boucle dans l'organigramme : cette personne est déjà, directement ou non, au-dessus du supérieur choisi.",
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { superieurId, service, poste },
  });

  revalidatePath("/manager/equipe");
  revalidatePath("/manager/organigramme");
  return { succes: `Rattachement de ${membre.nom} mis à jour.` };
}

/**
 * Un organigramme est un arbre : rattacher quelqu'un sous l'un de ses propres
 * subordonnés produirait un cycle, et toute remontée hiérarchique boucherait
 * indéfiniment.
 */
async function creeraitUnCycle(userId: string, superieurViseId: string) {
  const vus = new Set<string>([userId]);
  let courant: string | null = superieurViseId;

  while (courant) {
    if (vus.has(courant)) return true;
    vus.add(courant);
    const parent: { superieurId: string | null } | null =
      await prisma.user.findUnique({
        where: { id: courant },
        select: { superieurId: true },
      });
    courant = parent?.superieurId ?? null;
  }

  return false;
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
    data: {
      motDePasse: await bcrypt.hash(motDePasse, 12),
      doitChangerMotDePasse: true,
    },
  });

  revalidatePath("/manager/equipe");
  return { succes: `Mot de passe de ${membre.nom} réinitialisé.` };
}
