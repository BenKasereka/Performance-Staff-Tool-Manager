import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PageMonEspace() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const [nbTaches, nbMissions] = await Promise.all([
    prisma.task.count({
      where: { assignes: { some: { userId: session.user.id } } },
    }),
    prisma.mission.count({
      where: {
        membres: { some: { userId: session.user.id } },
        statut: { in: ["ACTIVE", "EN_ATTENTE_DECISION"] },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mon espace</h1>
        <p className="text-sm text-muted-foreground">
          Bonjour {session.user.nom}, voici votre activité.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mes tâches</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{nbTaches}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mes missions en cours</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{nbMissions}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
