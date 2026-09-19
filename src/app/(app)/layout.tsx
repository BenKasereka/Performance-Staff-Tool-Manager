import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";

export default async function LayoutApplication({
  children,
}: LayoutProps<"/">) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  // Vérifié en base à chaque navigation (pas dans le JWT), qui ne garde que
  // le nom vu à la connexion : un changement de profil doit être visible
  // immédiatement dans l'en-tête, pas seulement à la prochaine connexion.
  const utilisateur = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { nom: true, doitChangerMotDePasse: true },
  });
  if (!utilisateur) redirect("/connexion");
  if (utilisateur.doitChangerMotDePasse) redirect("/changer-mot-de-passe");

  return (
    <AppShell utilisateur={{ ...session.user, nom: utilisateur.nom }}>
      {children}
    </AppShell>
  );
}
