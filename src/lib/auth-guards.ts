import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function exigerUtilisateur() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  // Le nom vient du JWT, figé à la connexion : on le resynchronise à chaque
  // navigation pour qu'un changement de profil (écran Équipe) soit visible
  // immédiatement, sans attendre une reconnexion.
  const frais = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { nom: true },
  });
  if (!frais) redirect("/connexion");

  return { ...session.user, nom: frais.nom };
}

export async function exigerManager() {
  const utilisateur = await exigerUtilisateur();
  if (utilisateur.role !== "MANAGER") redirect("/mon-espace");
  return utilisateur;
}
