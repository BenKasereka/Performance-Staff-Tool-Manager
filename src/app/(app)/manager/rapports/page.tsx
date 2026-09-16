import Link from "next/link";
import { FileText, ListTree, Network, Users } from "lucide-react";

import { exigerManager } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { RapportBilanIndividuel } from "@/components/rapport-bilan-individuel";
import { RapportActivite } from "@/components/rapport-activite";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PUCE =
  "inline-flex size-9 items-center justify-center rounded-full";

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

      <Card className="ring-primary/35 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rapport de fin de mission</CardTitle>
          <CardDescription>
            Le bilan de votre mandat sur une période : toutes vos activités et
            celles de votre équipe.
          </CardDescription>
          <CardAction>
            <span aria-hidden className={cn(PUCE, "bg-primary/15 text-primary")}>
              <FileText className="size-4.5" />
            </span>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/manager/rapport-fin-mission">
              Configurer et télécharger
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="ring-info/35 bg-info/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bilans individuels</CardTitle>
          <CardDescription>
            Preuves tangibles pour évaluer un membre : choisissez la personne
            et la fréquence du bilan (journalier à annuel).
          </CardDescription>
          <CardAction>
            <span aria-hidden className={cn(PUCE, "bg-info/15 text-info")}>
              <Users className="size-4.5" />
            </span>
          </CardAction>
        </CardHeader>
        <CardContent>
          <RapportBilanIndividuel membres={membres} />
        </CardContent>
      </Card>

      <Card className="ring-success/35 bg-success/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Clôture d&apos;activité</CardTitle>
          <CardDescription>
            Bilan complet d&apos;une activité-projet ou d&apos;un cycle
            récurrent donné.
          </CardDescription>
          <CardAction>
            <span aria-hidden className={cn(PUCE, "bg-success/15 text-success")}>
              <ListTree className="size-4.5" />
            </span>
          </CardAction>
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

      <Card className="ring-warning/35 bg-warning/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">RACI de passation</CardTitle>
          <CardDescription>
            Répartition des responsabilités sur les activités encore
            ouvertes — sur une activité précise ou sur l&apos;ensemble.
          </CardDescription>
          <CardAction>
            <span aria-hidden className={cn(PUCE, "bg-warning/15 text-warning")}>
              <Network className="size-4.5" />
            </span>
          </CardAction>
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
