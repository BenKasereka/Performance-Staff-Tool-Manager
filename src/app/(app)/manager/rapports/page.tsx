import Link from "next/link";

import { exigerManager } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { RapportBilanIndividuel } from "@/components/rapport-bilan-individuel";
import { RapportActivite } from "@/components/rapport-activite";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PageRapports() {
  await exigerManager();

  const [membres, activites, activitesEnCours] = await Promise.all([
    prisma.user.findMany({
      where: { role: "MEMBER", actif: true },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
    prisma.mission.findMany({
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
    prisma.mission.findMany({
      where: { statut: { in: ["EN_PREPARATION", "ACTIVE", "EN_ATTENTE_DECISION"] } },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rapports</h1>
        <p className="text-sm text-muted-foreground">
          Tous les documents téléchargeables au même endroit, chacun avec ses
          propres filtres.
        </p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rapport de fin de mission</CardTitle>
          <CardDescription>
            Le bilan de votre mandat sur une période : toutes vos activités et
            celles de votre équipe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/manager/rapport-fin-mission">
              Configurer et télécharger
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bilans individuels</CardTitle>
          <CardDescription>
            Preuves tangibles pour évaluer un membre : choisissez la personne
            et la fréquence du bilan (journalier à annuel).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RapportBilanIndividuel membres={membres} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Clôture d&apos;activité</CardTitle>
          <CardDescription>
            Bilan complet d&apos;une activité-projet ou d&apos;un cycle
            récurrent donné.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RapportActivite
            activites={activites}
            basePath="/api/rapports/mission"
            mode="path"
            libelle="Rapport"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">RACI de passation</CardTitle>
          <CardDescription>
            Répartition des responsabilités sur les activités encore
            ouvertes — sur une activité précise ou sur l&apos;ensemble.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RapportActivite
            activites={activitesEnCours}
            avecOptionToutes
            basePath="/api/rapports/raci"
            mode="query"
            libelle="RACI"
          />
        </CardContent>
      </Card>
    </div>
  );
}
