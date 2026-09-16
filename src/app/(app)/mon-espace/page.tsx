import Link from "next/link";
import { subWeeks } from "date-fns";
import {
  AlertTriangle,
  CalendarCheck,
  ListChecks,
  TrendingUp,
} from "lucide-react";

import { exigerUtilisateur } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { chargerTaches, chargerTachesDuJour } from "@/lib/donnees";
import { formaterDate, formaterDateCourte, intervalle } from "@/lib/dates";
import { BadgeStatutTache } from "@/components/badges";
import { CourbeEvolution } from "@/components/graphiques/courbe-evolution";
import { StatTile } from "@/components/stat-tile";
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

const SEMAINES_PROGRESSION = 6;

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

  const progression = await construireProgression(utilisateur.id);

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
        <StatTile
          libelle="Tâches aujourd'hui"
          valeur={tachesJour.length}
          tone="info"
          icon={CalendarCheck}
        />
        <StatTile
          libelle="Cette semaine"
          valeur={tachesSemaine.length}
          tone="info"
          icon={ListChecks}
        />
        <StatTile
          libelle="En retard"
          valeur={enRetard.length}
          tone={enRetard.length > 0 ? "destructive" : "neutral"}
          icon={AlertTriangle}
        />
        <StatTile
          libelle="Activités en cours"
          valeur={nbMissions}
          tone="neutral"
          icon={TrendingUp}
        />
      </div>

      <Card className="ring-info/30 bg-info/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ma progression</CardTitle>
          <CardDescription>
            Vos six dernières semaines. Ces chiffres ne vous comparent à
            personne.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CourbeEvolution
            donnees={progression}
            series={[
              { cle: "completion", libelle: "Tâches terminées" },
              { cle: "ponctualite", libelle: "Dans les délais" },
            ]}
            unite=" %"
          />
        </CardContent>
      </Card>

      <Card className="ring-success/30 bg-success/5">
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

      <Card className="ring-primary/25 bg-primary/5">
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
        <Card className="ring-destructive/40 bg-destructive/5">
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

/**
 * Progression personnelle sur six semaines.
 *
 * Volontairement calculée ici plutôt que via calculerScores : le score global
 * intègre un volume normalisé sur la moyenne de l'équipe, donc une comparaison
 * implicite avec les collègues. Un membre ne doit voir que ses propres chiffres.
 */
async function construireProgression(userId: string) {
  const points = [];

  for (let i = SEMAINES_PROGRESSION - 1; i >= 0; i--) {
    const semaine = intervalle("semaine", subWeeks(new Date(), i));

    const taches = await prisma.task.findMany({
      where: {
        assignes: { some: { userId } },
        echeance: { gte: semaine.debut, lte: semaine.fin },
        statut: { not: "ANNULEE" },
      },
      select: { statut: true, echeance: true, dateFin: true },
    });

    const maintenant = new Date();
    const exigibles = taches.filter(
      (t) => t.echeance < maintenant || t.statut === "TERMINEE",
    );
    const terminees = taches.filter((t) => t.statut === "TERMINEE");
    const aLheure = terminees.filter(
      (t) => !t.dateFin || t.dateFin <= t.echeance,
    );

    points.push({
      periode: formaterDateCourte(semaine.debut),
      completion:
        exigibles.length > 0
          ? Math.round((terminees.length / exigibles.length) * 100)
          : null,
      ponctualite:
        terminees.length > 0
          ? Math.round((aLheure.length / terminees.length) * 100)
          : null,
    });
  }

  return points;
}
