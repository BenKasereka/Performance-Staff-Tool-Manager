import { redirect } from "next/navigation";

import { auth } from "@/auth";

export async function exigerUtilisateur() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  return session.user;
}

export async function exigerManager() {
  const utilisateur = await exigerUtilisateur();
  if (utilisateur.role !== "MANAGER") redirect("/mon-espace");
  return utilisateur;
}
