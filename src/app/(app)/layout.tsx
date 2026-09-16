import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";

export default async function LayoutApplication({
  children,
}: LayoutProps<"/">) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  // Vérifié en base à chaque navigation (pas dans le JWT) : la mise à jour
  // faite par /changer-mot-de-passe doit être vue immédiatement, pas
  // seulement à la prochaine connexion.
  const utilisateur = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { doitChangerMotDePasse: true },
  });
  if (utilisateur?.doitChangerMotDePasse) redirect("/changer-mot-de-passe");

  return <AppShell utilisateur={session.user}>{children}</AppShell>;
}
