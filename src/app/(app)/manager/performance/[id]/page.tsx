import Link from "next/link";
import { notFound } from "next/navigation";
import { subMonths } from "date-fns";

import { exigerManager } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { calculerScores, LIBELLES_CRITERE } from "@/lib/kpi";
import { chargerTaches } from "@/lib/donnees";
import { formaterDate, intervalle } from "@/lib/dates";
import { estEnRetard, livreeEnRetard } from "@/lib/taches";
import { BadgeStatutTache } from "@/components/badges";
import { BoutonsRapport } from "@/components/boutons-rapport";
import { CourbeEvolution } from "@/components/graphiques/courbe-evolution";
import { PageHero } from "@/components/page-hero";
import { StatTile } from "@/components/stat-tile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

const MOIS_HISTORIQUE = 6;

export default async function PageMembrePerformance({
  params,
}: PageProps<"/manager/performance/[id]">) {
  await exigerManager();
  const { id } = await params;

  const membre = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      nom: true,
      poste: true,
      service: true,
      superieur: { select: { nom: true } },
    },
  });
  if (!membre) notFound();

  const moisCourant = intervalle("mois", new Date());
  // Le calcul porte sur toute l'équipe : restreindre à une personne fausserait
  // le critère de volume, qui se normalise sur la moyenne des collègues.
  const scoresEquipe = await calculerScores({
    debut: moisCourant.debut,
    fin: moisCourant.fin,
  });
  const scoreMois = scoresEquipe.find((s) => s.userId === membre.id);

  const evolution = await construireEvolutionMembre(membre.id);

  const taches = await chargerTaches({
    assignes: { some: { userId: membre.id } },
    echeance: { gte: moisCourant.debut, lte: moisCourant.fin },
  });

  const marquantes = await prisma.task.findMany({
    where: {
      assignes: { some: { userId: membre.id } },
      echeance: { gte: subMonths(new Date(), MOIS_HISTORIQUE) },
      statut: { not: "ANNULEE" },
    },
    select: {
      id: true,
      titre: true,
      statut: true,
      echeance: true,
      dateFin: true,
      noteQualite: true,
    },
    orderBy: { echeance: "desc" },
    take: 200,
  });

  const reussies = marquantes
    .filter((t) => t.noteQualite && t.noteQualite >= 4 && !livreeEnRetard(t))
    .slice(0, 5);
  const manquees = marquantes.filter((t) => estEnRetard(t)).slice(0, 5);

  const criteres = scoreMois
    ? [
        { cle: "tauxCompletion", valeur: scoreMois.tauxCompletion, suffixe: "%" },
        { cle: "ponctualite", valeur: scoreMois.ponctualite, suffixe: "%" },
        {
          cle: "noteQualite",
          valeur: scoreMois.noteQualiteMoyenne,
          suffixe: "%",
          absent: scoreMois.qualiteNonEvaluee,
        },
        { cle: "volume", valeur: scoreMois.volume, suffixe: "" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHero
        retour={{ href: "/manager/performance", libelle: "Classement" }}
        titre={membre.nom}
        description={
          <>
            {[membre.poste, membre.service].filter(Boolean).join(" · ") ||
              "Poste non renseigné"}
            {membre.superieur && ` · rattaché à ${membre.superieur.nom}`}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile
          className="lg:col-span-1"
          libelle="Score du mois"
          tone="info"
          valeur={
            <>
              {scoreMois?.scoreGlobal ?? 0}
              <span className="text-base text-muted-foreground"> / 100</span>
            </>
          }
        />

        {criteres.map((c) => (
          <Card key={c.cle}>
            <CardHeader className="pb-2">
              <CardDescription>
                {LIBELLES_CRITERE[c.cle as keyof typeof LIBELLES_CRITERE]}
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {c.absent ? (
                  <span className="text-base font-normal text-muted-foreground">
                    non évalué
                  </span>
                ) : (
                  `${c.valeur}${c.suffixe ? " " + c.suffixe : ""}`
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Progress value={c.absent ? 0 : c.valeur} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Évolution du score</CardTitle>
          <CardDescription>
            Score global mois par mois sur {MOIS_HISTORIQUE} mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CourbeEvolution
            donnees={evolution}
            series={[
              { cle: "score", libelle: "Score global" },
              { cle: "completion", libelle: "Complétion" },
              { cle: "ponctualite", libelle: "Délais" },
            ]}
            unite=""
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Réussites marquantes</CardTitle>
            <CardDescription>
              Tâches livrées dans les délais et notées 4 ou 5
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reussies.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune tâche notée 4 ou plus sur les derniers mois.
              </p>
            ) : (
              <ul className="space-y-2">
                {reussies.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="min-w-0 truncate">{t.titre}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {t.noteQualite}/5 · {formaterDate(t.echeance)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Points de vigilance</CardTitle>
            <CardDescription>Tâches encore en retard</CardDescription>
          </CardHeader>
          <CardContent>
            {manquees.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune tâche en retard. Rien à signaler.
              </p>
            ) : (
              <ul className="space-y-2">
                {manquees.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="min-w-0 truncate">{t.titre}</span>
                    <span className="shrink-0 text-xs text-destructive">
                      {formaterDate(t.echeance)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tâches du mois</CardTitle>
          <CardDescription>
            {taches.length} tâche{taches.length > 1 ? "s" : ""} à échéance ce
            mois-ci
          </CardDescription>
        </CardHeader>
        <CardContent>
          {taches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune tâche ce mois-ci.
            </p>
          ) : (
            <ul className="space-y-2">
              {taches.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <Link
                    href={`/manager/taches/${t.id}`}
                    className="min-w-0 truncate hover:underline"
                  >
                    {t.titre}
                  </Link>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formaterDate(t.echeance)}
                    </span>
                    <BadgeStatutTache statut={t.statut} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <BoutonsRapport
          base={`/api/rapports/membre/${membre.id}?g=mois`}
          libelle="Rapport d'évaluation"
        />
        <Button variant="outline" asChild>
          <Link href={`/manager/taches?membre=${membre.id}&g=mois`}>
            Toutes ses tâches
          </Link>
        </Button>
      </div>
    </div>
  );
}

async function construireEvolutionMembre(userId: string) {
  const points = [];

  for (let i = MOIS_HISTORIQUE - 1; i >= 0; i--) {
    const mois = intervalle("mois", subMonths(new Date(), i));
    // Le score est recalculé sur toute l'équipe : le critère de volume se
    // compare à la moyenne des collègues sur ce même mois.
    const scores = await calculerScores({ debut: mois.debut, fin: mois.fin });
    const sien = scores.find((s) => s.userId === userId);

    // Un mois sans tâche n'est pas un mois à zéro : on laisse un trou dans la
    // courbe plutôt que de faire croire à un effondrement.
    const sansActivite = !sien || sien.nbTachesTotal === 0;

    points.push({
      periode: formaterDate(mois.debut).replace(/^\d+ /, "").replace(/ \d{4}$/, ""),
      score: sansActivite ? null : sien.scoreGlobal,
      completion: sansActivite ? null : sien.tauxCompletion,
      ponctualite: sansActivite ? null : sien.ponctualite,
    });
  }

  return points;
}
