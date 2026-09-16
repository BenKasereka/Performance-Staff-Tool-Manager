import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CircleCheckBig,
  Clock,
  ListChecks,
  Users,
} from "lucide-react";

import { exigerManager } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { chargerTaches, chargerTachesDuJour } from "@/lib/donnees";
import {
  missionsProchesDeLecheance,
  verifierMissionsEchues,
} from "@/lib/actions/missions";
import { formaterDate, intervalle, joursRestants } from "@/lib/dates";
import { JOURS_ALERTE_FIN_MISSION } from "@/lib/missions";

import { BadgeStatutTache } from "@/components/badges";
import { BoutonsRapport } from "@/components/boutons-rapport";
import { PageHero } from "@/components/page-hero";
import { StatTile, type ToneStatTile } from "@/components/stat-tile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PageManager() {
  const utilisateur = await exigerManager();
  await verifierMissionsEchues();

  const semaine = intervalle("semaine", new Date());
  const jour = intervalle("jour", new Date());

  const [tachesSemaine, tachesJour, enRetard, missionsEnAttente, missionsProches, nbMembres] =
    await Promise.all([
      chargerTaches({ echeance: { gte: semaine.debut, lte: semaine.fin } }),
      chargerTachesDuJour(jour),
      chargerTaches({
        statut: { notIn: ["TERMINEE", "ANNULEE"] },
        echeance: { lt: new Date() },
      }),
      prisma.mission.findMany({
        where: { statut: "EN_ATTENTE_DECISION" },
        orderBy: { dateFinActuelle: "asc" },
      }),
      missionsProchesDeLecheance(JOURS_ALERTE_FIN_MISSION),
      prisma.user.count({ where: { role: "MEMBER", actif: true } }),
    ]);

  const termineesSemaine = tachesSemaine.filter(
    (t) => t.statut === "TERMINEE",
  ).length;
  const tauxSemaine =
    tachesSemaine.length > 0
      ? Math.round((termineesSemaine / tachesSemaine.length) * 100)
      : 0;

  const chiffres: {
    libelle: string;
    valeur: number;
    tone: ToneStatTile;
    icon: typeof Users;
  }[] = [
    { libelle: "Membres actifs", valeur: nbMembres, tone: "info", icon: Users },
    {
      libelle: "Tâches cette semaine",
      valeur: tachesSemaine.length,
      tone: "info",
      icon: ListChecks,
    },
    {
      libelle: "Terminées",
      valeur: termineesSemaine,
      tone: "success",
      icon: CircleCheckBig,
    },
    {
      libelle: "En retard",
      valeur: enRetard.length,
      tone: enRetard.length > 0 ? "destructive" : "neutral",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHero
        titre="Tableau de bord"
        description={`Bonjour ${utilisateur.nom}, ${tauxSemaine} % des tâches de la semaine sont terminées.`}
        actions={
          <BoutonsRapport base="/api/rapports/raci" libelle="RACI de passation" />
        }
      />

      {missionsEnAttente.length > 0 && (
        <Card className="ring-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle aria-hidden className="size-4.5" />
              {missionsEnAttente.length} activité
              {missionsEnAttente.length > 1 ? "s" : ""} en attente de votre
              décision
            </CardTitle>
            <CardDescription>
              L&apos;échéance est dépassée. Clôturez pour générer le rapport de
              clôture d&apos;activité, ou prolongez avec une nouvelle date.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {missionsEnAttente.map((mission) => (
              <div
                key={mission.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-card p-3 ring-1 ring-foreground/10"
              >
                <div>
                  <p className="font-medium">{mission.nom}</p>
                  <p className="text-sm text-muted-foreground">
                    Échéance dépassée depuis le{" "}
                    {formaterDate(mission.dateFinActuelle)}
                  </p>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/manager/missions/${mission.id}`}>Décider</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {missionsProches.length > 0 && (
        <Card className="ring-warning/40 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-warning">
              <Clock aria-hidden className="size-4.5" />
              Activités bientôt échues
            </CardTitle>
            <CardDescription>
              Préparez votre décision avant la date de fin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {missionsProches.map((mission) => {
              const restants = joursRestants(mission.dateFinActuelle);
              return (
                <div
                  key={mission.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-card p-3 ring-1 ring-foreground/10"
                >
                  <div>
                    <p className="font-medium">{mission.nom}</p>
                    <p className="text-sm text-muted-foreground">
                      {restants === 0
                        ? "Se termine aujourd'hui"
                        : `Se termine dans ${restants} jour${restants > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/manager/missions/${mission.id}`}>Ouvrir</Link>
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {chiffres.map((c) => (
          <StatTile
            key={c.libelle}
            libelle={c.libelle}
            valeur={c.valeur}
            tone={c.tone}
            icon={c.icon}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="ring-info/30 bg-info/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-info">
              <CalendarClock aria-hidden className="size-4.5" />
              Aujourd&apos;hui
            </CardTitle>
            <CardDescription>
              {tachesJour.length} tâche{tachesJour.length > 1 ? "s" : ""} à
              échéance
            </CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" asChild>
                <Link href="/manager/taches?g=jour">Voir</Link>
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
                {tachesJour.slice(0, 6).map((tache) => (
                  <li
                    key={tache.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {tache.titre}
                      <span className="text-muted-foreground">
                        {" · "}
                        {tache.assignes.map((a) => a.nom).join(", ")}
                      </span>
                    </span>
                    <BadgeStatutTache statut={tache.statut} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="ring-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle aria-hidden className="size-4.5" />
              Tâches en retard
            </CardTitle>
            <CardDescription>
              Échéance dépassée, tâche non terminée
            </CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" asChild>
                <Link href="/manager/taches?statut=EN_RETARD&g=mois">Voir</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {enRetard.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune tâche en retard. L&apos;équipe est à jour.
              </p>
            ) : (
              <ul className="space-y-2">
                {enRetard.slice(0, 6).map((tache) => (
                  <li
                    key={tache.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {tache.titre}
                      <span className="text-muted-foreground">
                        {" · "}
                        {tache.assignes.map((a) => a.nom).join(", ")}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-destructive">
                      {formaterDate(tache.echeance)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
