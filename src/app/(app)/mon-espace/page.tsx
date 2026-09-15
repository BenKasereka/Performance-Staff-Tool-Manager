import Link from "next/link";

import { exigerUtilisateur } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { chargerTaches, chargerTachesDuJour } from "@/lib/donnees";
import { formaterDate, intervalle } from "@/lib/dates";
import { BadgeStatutTache } from "@/components/badges";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function PageMonEspace() {
  const utilisateur = await exigerUtilisateur();

  const jour = intervalle("jour", new Date());
  const semaine = intervalle("semaine", new Date());
  const mien = { assignes: { some: { userId: utilisateur.id } } };

  const [tachesJour, tachesSemaine, enRetard, nbMissions] = await Promise.all([
    chargerTachesDuJour(jour, mien),
    chargerTaches({
      ...mien,
      echeance: { gte: semaine.debut, lte: semaine.fin },
    }),
    chargerTaches({
      ...mien,
      statut: { notIn: ["TERMINEE", "ANNULEE"] },
      echeance: { lt: new Date() },
    }),
    prisma.mission.count({
      where: {
        membres: { some: { userId: utilisateur.id } },
        statut: { in: ["ACTIVE", "EN_ATTENTE_DECISION"] },
      },
    }),
  ]);

  const termineesSemaine = tachesSemaine.filter(
    (t) => t.statut === "TERMINEE",
  ).length;
  const taux =
    tachesSemaine.length > 0
      ? Math.round((termineesSemaine / tachesSemaine.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mon espace</h1>
        <p className="text-sm text-muted-foreground">
          Bonjour {utilisateur.nom}, voici votre semaine.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tâches aujourd&apos;hui</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {tachesJour.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cette semaine</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {tachesSemaine.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En retard</CardDescription>
            <CardTitle
              className={`text-3xl tabular-nums ${enRetard.length > 0 ? "text-destructive" : ""}`}
            >
              {enRetard.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Missions en cours</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{nbMissions}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Mon avancement de la semaine</CardTitle>
          <CardDescription>
            {termineesSemaine} tâche{termineesSemaine > 1 ? "s" : ""} terminée
            {termineesSemaine > 1 ? "s" : ""} sur {tachesSemaine.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={taux} />
          <p className="text-right text-sm font-medium tabular-nums">{taux} %</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mes tâches du jour</CardTitle>
          <CardDescription>
            {tachesJour.length === 0
              ? "Rien à échéance aujourd'hui"
              : "À traiter aujourd'hui"}
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" asChild>
              <Link href="/mon-espace/taches?g=jour">Voir tout</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {tachesJour.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune échéance aujourd&apos;hui.
            </p>
          ) : (
            <ul className="space-y-2">
              {tachesJour.map((tache) => (
                <li
                  key={tache.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate">{tache.titre}</span>
                  <BadgeStatutTache statut={tache.statut} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {enRetard.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">
              À rattraper
            </CardTitle>
            <CardDescription>
              Ces tâches ont dépassé leur échéance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {enRetard.map((tache) => (
                <li
                  key={tache.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate">{tache.titre}</span>
                  <span className="shrink-0 text-xs text-destructive">
                    {formaterDate(tache.echeance)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
