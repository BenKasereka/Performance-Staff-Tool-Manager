import Link from "next/link";
import { subWeeks } from "date-fns";

import { exigerManager } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { calculerScores, chargerPoids, LIBELLES_CRITERE } from "@/lib/kpi";
import {
  formaterDate,
  intervalle,
  libelleIntervalle,
  type Granularite,
} from "@/lib/dates";
import { estEnRetard } from "@/lib/taches";
import { BarresScores } from "@/components/graphiques/barres-scores";
import { CourbeEvolution } from "@/components/graphiques/courbe-evolution";
import {
  RepartitionStatuts,
  type LigneStatut,
} from "@/components/graphiques/repartition-statuts";
import { SelecteurPeriode } from "@/components/selecteur-periode";
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

const GRANULARITES: Granularite[] = ["jour", "semaine", "mois"];
const SEMAINES_HISTORIQUE = 8;

export default async function PagePerformance({
  searchParams,
}: PageProps<"/manager/performance">) {
  await exigerManager();
  const params = await searchParams;

  const granularite = GRANULARITES.includes(params.g as Granularite)
    ? (params.g as Granularite)
    : "mois";
  const reference = params.d ? new Date(String(params.d)) : new Date();
  const periode = intervalle(granularite, reference);
  const missionFiltre = params.mission ? String(params.mission) : "";

  const [scores, poids, missions] = await Promise.all([
    calculerScores({
      debut: periode.debut,
      fin: periode.fin,
      missionId: missionFiltre || undefined,
    }),
    chargerPoids(),
    prisma.mission.findMany({
      where: { statut: { in: ["ACTIVE", "EN_ATTENTE_DECISION", "CLOTUREE"] } },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  const classement = [...scores]
    .filter((s) => s.nbTachesTotal > 0)
    .sort((a, b) => b.scoreGlobal - a.scoreGlobal);
  const sansActivite = scores.filter((s) => s.nbTachesTotal === 0);

  const moyenneEquipe =
    classement.length > 0
      ? Math.round(
          classement.reduce((s, m) => s + m.scoreGlobal, 0) / classement.length,
        )
      : 0;

  const repartition: LigneStatut[] = await construireRepartition(
    periode,
    missionFiltre,
  );
  const evolution = await construireEvolution(missionFiltre);

  const qualiteManquante = classement.filter((s) => s.qualiteNonEvaluee);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Performance</h1>
        <p className="text-sm text-muted-foreground">
          Classement confidentiel — visible par les managers uniquement, jamais
          par les membres.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SelecteurPeriode granularite={granularite} reference={reference} />
        <FiltreMission missions={missions} valeur={missionFiltre} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Score moyen de l&apos;équipe</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {moyenneEquipe}
              <span className="text-base text-muted-foreground"> / 100</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Membres évalués</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {classement.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Meilleur score</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {classement[0]?.scoreGlobal ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Période</CardDescription>
            <CardTitle className="text-base capitalize">
              {libelleIntervalle(granularite, reference)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {qualiteManquante.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="text-base">
              Qualité non évaluée pour {qualiteManquante.length} membre
              {qualiteManquante.length > 1 ? "s" : ""}
            </CardTitle>
            <CardDescription>
              Faute de notes sur leurs tâches terminées, le critère qualité est
              retiré de leur score et les poids sont répartis sur les trois
              autres critères. Notez leurs tâches pour un score complet :{" "}
              {qualiteManquante.map((m) => m.nom).join(", ")}.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Classement</CardTitle>
          <CardDescription>
            Score global sur 100, pondéré selon{" "}
            {Object.entries(poids)
              .map(
                ([c, p]) =>
                  `${LIBELLES_CRITERE[c as keyof typeof LIBELLES_CRITERE]} ${Math.round(p * 100)} %`,
              )
              .join(" · ")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classement.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucune tâche sur cette période.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">#</th>
                    <th className="py-2 pr-3 font-medium">Membre</th>
                    <th className="py-2 pr-3 text-right font-medium">Score</th>
                    <th
                      className="py-2 pr-3 text-right font-medium"
                      title="Tâches terminées rapportées aux tâches déjà échues : celles dont l'échéance n'est pas encore arrivée n'entrent pas au dénominateur."
                    >
                      Complétion
                    </th>
                    <th className="py-2 pr-3 text-right font-medium">Délais</th>
                    <th className="py-2 pr-3 text-right font-medium">Qualité</th>
                    <th className="py-2 pr-3 text-right font-medium">Volume</th>
                    <th className="py-2 text-right font-medium">Tâches</th>
                  </tr>
                </thead>
                <tbody>
                  {classement.map((s, rang) => (
                    <tr key={s.userId} className="border-b last:border-0">
                      <td className="py-2 pr-3 tabular-nums text-muted-foreground">
                        {rang + 1}
                      </td>
                      <td className="py-2 pr-3">
                        <Link
                          href={`/manager/performance/${s.userId}`}
                          className="font-medium hover:underline"
                        >
                          {s.nom}
                        </Link>
                        {s.service && (
                          <span className="text-muted-foreground">
                            {" · "}
                            {s.service}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right font-semibold tabular-nums">
                        {s.scoreGlobal}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {s.tauxCompletion} %
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {s.ponctualite} %
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {s.qualiteNonEvaluee ? (
                          <span className="text-muted-foreground">non noté</span>
                        ) : (
                          `${s.noteMoyenneSur5} / 5`
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {s.volume}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        <span
                          title={`${s.nbTachesTotal} assignées sur la période, dont ${s.nbTachesExigibles} déjà échues ou terminées`}
                        >
                          {s.nbTachesTerminees}/{s.nbTachesExigibles}
                        </span>
                        {s.nbTachesEnRetard > 0 && (
                          <span className="text-destructive">
                            {" "}
                            · {s.nbTachesEnRetard} en retard
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {sansActivite.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Hors classement, faute de tâche sur la période :{" "}
              {sansActivite.map((s) => s.nom).join(", ")}.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Comparatif des scores</CardTitle>
            <CardDescription>Score global sur la période</CardDescription>
          </CardHeader>
          <CardContent>
            <BarresScores
              donnees={classement.map((s) => ({
                nom: s.nom,
                score: s.scoreGlobal,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Répartition des tâches</CardTitle>
            <CardDescription>Par statut et par membre</CardDescription>
          </CardHeader>
          <CardContent>
            <RepartitionStatuts donnees={repartition} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Évolution du taux de complétion
          </CardTitle>
          <CardDescription>
            Moyenne de l&apos;équipe sur les {SEMAINES_HISTORIQUE} dernières
            semaines
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" asChild>
              <Link href="/manager/taches?g=semaine">Voir les tâches</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <CourbeEvolution
            donnees={evolution}
            series={[{ cle: "completion", libelle: "Taux de complétion" }]}
            unite=" %"
          />
        </CardContent>
      </Card>
    </div>
  );
}

async function construireRepartition(
  periode: { debut: Date; fin: Date },
  missionId: string,
): Promise<LigneStatut[]> {
  const taches = await prisma.task.findMany({
    where: {
      echeance: { gte: periode.debut, lte: periode.fin },
      statut: { not: "ANNULEE" },
      ...(missionId ? { missionId } : {}),
    },
    select: {
      statut: true,
      echeance: true,
      assignes: { select: { user: { select: { id: true, nom: true } } } },
    },
  });

  const parMembre = new Map<string, LigneStatut>();

  for (const tache of taches) {
    for (const { user } of tache.assignes) {
      let ligne = parMembre.get(user.id);
      if (!ligne) {
        ligne = { nom: user.nom, terminees: 0, enCours: 0, aFaire: 0, enRetard: 0 };
        parMembre.set(user.id, ligne);
      }

      if (tache.statut === "TERMINEE") ligne.terminees++;
      else if (estEnRetard(tache)) ligne.enRetard++;
      else if (tache.statut === "EN_COURS") ligne.enCours++;
      else ligne.aFaire++;
    }
  }

  return [...parMembre.values()].sort((a, b) =>
    a.nom.localeCompare(b.nom, "fr"),
  );
}

/** Taux de complétion de l'équipe, semaine par semaine. */
async function construireEvolution(missionId: string) {
  const points: { periode: string; completion: number }[] = [];

  for (let i = SEMAINES_HISTORIQUE - 1; i >= 0; i--) {
    const semaine = intervalle("semaine", subWeeks(new Date(), i));

    const taches = await prisma.task.findMany({
      where: {
        echeance: { gte: semaine.debut, lte: semaine.fin },
        statut: { not: "ANNULEE" },
        ...(missionId ? { missionId } : {}),
      },
      select: { statut: true },
    });

    const terminees = taches.filter((t) => t.statut === "TERMINEE").length;
    points.push({
      periode: formaterDate(semaine.debut).replace(/ \d{4}$/, ""),
      completion:
        taches.length > 0 ? Math.round((terminees / taches.length) * 100) : 0,
    });
  }

  return points;
}

function FiltreMission({
  missions,
  valeur,
}: {
  missions: { id: string; nom: string }[];
  valeur: string;
}) {
  return (
    <form className="flex items-center gap-2">
      <label htmlFor="mission" className="sr-only">
        Filtrer par mission
      </label>
      <select
        id="mission"
        name="mission"
        defaultValue={valeur}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-xs"
      >
        <option value="">Toutes les missions</option>
        {missions.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nom}
          </option>
        ))}
      </select>
      <Button type="submit" variant="outline" size="sm">
        Filtrer
      </Button>
    </form>
  );
}
