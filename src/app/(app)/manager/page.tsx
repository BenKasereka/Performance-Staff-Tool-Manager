import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PageManager() {
  const session = await auth();
  if (session?.user.role !== "MANAGER") redirect("/mon-espace");

  const [nbMembres, nbMissions, nbTaches] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER", actif: true } }),
    prisma.mission.count({ where: { statut: { in: ["ACTIVE", "EN_ATTENTE_DECISION"] } } }),
    prisma.task.count(),
  ]);

  const cartes = [
    { titre: "Membres actifs", valeur: nbMembres },
    { titre: "Missions en cours", valeur: nbMissions },
    { titre: "Tâches enregistrées", valeur: nbTaches },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-sm text-muted-foreground">
          Bonjour {session.user.nom}, voici l&apos;état de votre équipe.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cartes.map((carte) => (
          <Card key={carte.titre}>
            <CardHeader className="pb-2">
              <CardDescription>{carte.titre}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {carte.valeur}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prochaines étapes</CardTitle>
          <CardDescription>
            Les fondations sont en place. La suite arrive par étapes.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-inside list-disc space-y-1">
            <li>Étape 2 — missions et tâches (CRUD, vues jour/semaine/mois)</li>
            <li>Étape 3 — KPIs, score de performance et classement privé</li>
            <li>Étape 4 — espace membre</li>
            <li>Étape 5 — notifications email et in-app</li>
            <li>Étape 6 — rapports PDF et Excel</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
