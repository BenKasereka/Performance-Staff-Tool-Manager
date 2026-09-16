import Link from "next/link";
import { notFound } from "next/navigation";

import { exigerManager } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { chargerMembres, chargerTaches } from "@/lib/donnees";
import { calculerScores } from "@/lib/kpi";
import { formaterDate, formaterDateHeure, joursRestants } from "@/lib/dates";
import {
  JOURS_ALERTE_FIN_MISSION,
  LIBELLES_TYPE_MISSION,
  missionAccepteTaches,
  missionModifiable,
} from "@/lib/missions";
import { estEnRetard } from "@/lib/taches";
import { BadgeStatutMission } from "@/components/badges";
import { BoutonsRapport } from "@/components/boutons-rapport";
import { DialogueMission } from "@/components/dialogue-mission";
import { DialogueTache } from "@/components/dialogue-tache";
import { ListeTaches } from "@/components/liste-taches";
import { ActionsMission } from "./actions-mission";
import { BilanQualitatif } from "./bilan-qualitatif";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PageMission({
  params,
}: PageProps<"/manager/missions/[id]">) {
  const utilisateur = await exigerManager();
  const { id } = await params;

  const mission = await prisma.mission.findUnique({
    where: { id },
    include: {
      membres: { include: { user: { select: { id: true, nom: true } } } },
      prolongations: {
        include: { auteur: { select: { nom: true } } },
        orderBy: { dateDemande: "desc" },
      },
    },
  });
  if (!mission) notFound();

  const [taches, membres, contributionsBrutes] = await Promise.all([
    chargerTaches({ missionId: mission.id }),
    chargerMembres(),
    calculerScores({
      debut: mission.dateDebut,
      fin: mission.dateFinActuelle,
      missionId: mission.id,
    }),
  ]);

  const contributions = [...contributionsBrutes].sort(
    (a, b) => b.scoreGlobal - a.scoreGlobal,
  );

  const terminees = taches.filter((t) => t.statut === "TERMINEE").length;
  const enRetard = taches.filter((t) => estEnRetard(t)).length;
  const tauxCompletion =
    taches.length > 0 ? Math.round((terminees / taches.length) * 100) : 0;
  const restants = joursRestants(mission.dateFinActuelle);

  const chiffres = [
    { libelle: "Tâches", valeur: taches.length },
    { libelle: "Terminées", valeur: terminees },
    { libelle: "En retard", valeur: enRetard },
    { libelle: "Complétion", valeur: `${tauxCompletion} %` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Link
            href="/manager/missions"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Activités
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {mission.nom}
            </h1>
            <BadgeStatutMission statut={mission.statut} />
          </div>
          <p className="text-sm text-muted-foreground">
            {LIBELLES_TYPE_MISSION[mission.type]} ·{" "}
            {formaterDate(mission.dateDebut)} →{" "}
            {formaterDate(mission.dateFinActuelle)}
            {mission.dateCloture &&
              ` · clôturée le ${formaterDate(mission.dateCloture)}`}
          </p>
          {mission.description && (
            <p className="max-w-2xl text-sm">{mission.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {missionModifiable(mission.statut) && (
            <DialogueMission
              membres={membres}
              mission={{
                id: mission.id,
                nom: mission.nom,
                description: mission.description,
                type: mission.type,
                dateDebut: mission.dateDebut,
                dateFinActuelle: mission.dateFinActuelle,
                membres: mission.membres.map((m) => m.userId),
              }}
              declencheur={
                <Button variant="outline" size="sm">
                  Modifier
                </Button>
              }
            />
          )}
          <ActionsMission
            missionId={mission.id}
            statut={mission.statut}
            echeanceActuelle={mission.dateFinActuelle}
          />
          {(mission.statut === "CLOTUREE" || mission.statut === "ARCHIVEE") && (
            <BoutonsRapport
              base={`/api/rapports/mission/${mission.id}`}
              libelle="Rapport de clôture d'activité"
            />
          )}
          <BoutonsRapport
            base={`/api/rapports/raci?mission=${mission.id}`}
            libelle="RACI de passation"
          />
        </div>
      </div>

      {mission.statut === "EN_ATTENTE_DECISION" && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Cette activité attend votre décision
            </CardTitle>
            <CardDescription>
              L&apos;échéance du {formaterDate(mission.dateFinActuelle)} est
              passée. L&apos;activité ne se clôture ni ne se prolonge d&apos;elle-même :
              clôturez-la pour générer le rapport de clôture d&apos;activité, ou
              prolongez-la avec une nouvelle échéance.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {mission.statut === "ACTIVE" &&
        restants >= 0 &&
        restants <= JOURS_ALERTE_FIN_MISSION && (
          <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
            <CardHeader>
              <CardTitle className="text-base">
                Fin d&apos;activité proche
              </CardTitle>
              <CardDescription>
                {restants === 0
                  ? "L'activité se termine aujourd'hui."
                  : `L'activité se termine dans ${restants} jour${restants > 1 ? "s" : ""}.`}{" "}
                Préparez votre décision : clôture ou prolongation.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {chiffres.map((c) => (
          <Card key={c.libelle}>
            <CardHeader className="pb-2">
              <CardDescription>{c.libelle}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{c.valeur}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Contribution par membre</CardTitle>
          <CardDescription>
            Score calculé sur le périmètre de cette activité uniquement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contributions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun membre assigné à cette activité.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Membre</th>
                    <th className="py-2 pr-3 text-right font-medium">Score</th>
                    <th className="py-2 pr-3 text-right font-medium">
                      Complétion
                    </th>
                    <th className="py-2 pr-3 text-right font-medium">Délais</th>
                    <th className="py-2 pr-3 text-right font-medium">Qualité</th>
                    <th className="py-2 text-right font-medium">Tâches</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((c) => (
                    <tr key={c.userId} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        <Link
                          href={`/manager/performance/${c.userId}`}
                          className="font-medium hover:underline"
                        >
                          {c.nom}
                        </Link>
                      </td>
                      <td className="py-2 pr-3 text-right font-semibold tabular-nums">
                        {c.scoreGlobal}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {c.tauxCompletion} %
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {c.ponctualite} %
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {c.qualiteNonEvaluee ? (
                          <span className="text-muted-foreground">non noté</span>
                        ) : (
                          `${c.noteMoyenneSur5} / 5`
                        )}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {c.nbTachesTerminees}/{c.nbTachesExigibles}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {mission.prolongations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Historique des prolongations
            </CardTitle>
            <CardDescription>
              Conservé intégralement et repris dans le rapport de clôture d&apos;activité.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {mission.prolongations.map((p) => (
                <li key={p.id} className="border-l-2 pl-3 text-sm">
                  <p className="font-medium">
                    {formaterDate(p.ancienneEcheance)} →{" "}
                    {formaterDate(p.nouvelleEcheance)}
                  </p>
                  <p className="text-muted-foreground">
                    Décidée le {formaterDateHeure(p.dateDemande)}
                    {p.auteur && ` par ${p.auteur.nom}`}
                  </p>
                  {p.motif && <p className="mt-1 italic">« {p.motif} »</p>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {(mission.statut === "CLOTUREE" || mission.statut === "ARCHIVEE") && (
        <BilanQualitatif
          missionId={mission.id}
          bilan={{
            contexte: mission.bilanContexte,
            synthese: mission.bilanQualitatifManager,
            pointsForts: mission.bilanPointsForts,
            defis: mission.bilanDefis,
            recommandations: mission.bilanRecommandations,
            conclusion: mission.bilanConclusion,
          }}
        />
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Tâches de l&apos;activité</h2>
          {missionAccepteTaches(mission.statut) && (
            <DialogueTache
              membres={mission.membres.map((m) => ({
                id: m.user.id,
                nom: m.user.nom,
              }))}
              missions={[{ id: mission.id, nom: mission.nom }]}
              utilisateur={{ id: utilisateur.id, role: utilisateur.role }}
              declencheur={<Button size="sm">Nouvelle tâche</Button>}
            />
          )}
        </div>

        <ListeTaches
          taches={taches}
          utilisateur={{ id: utilisateur.id, role: utilisateur.role }}
          membres={mission.membres.map((m) => ({
            id: m.user.id,
            nom: m.user.nom,
          }))}
          missions={[{ id: mission.id, nom: mission.nom }]}
          messageVide="Aucune tâche rattachée à cette activité."
        />
      </section>
    </div>
  );
}
