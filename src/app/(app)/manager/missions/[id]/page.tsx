import Link from "next/link";
import { notFound } from "next/navigation";

import { exigerManager } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { chargerMembres, chargerTaches } from "@/lib/donnees";
import { formaterDate, formaterDateHeure, joursRestants } from "@/lib/dates";
import {
  JOURS_ALERTE_FIN_MISSION,
  LIBELLES_TYPE_MISSION,
  missionAccepteTaches,
  missionModifiable,
} from "@/lib/missions";
import { estEnRetard } from "@/lib/taches";
import { BadgeStatutMission } from "@/components/badges";
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

  const [taches, membres] = await Promise.all([
    chargerTaches({ missionId: mission.id }),
    chargerMembres(),
  ]);

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
            ← Missions
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
        </div>
      </div>

      {mission.statut === "EN_ATTENTE_DECISION" && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Cette mission attend votre décision
            </CardTitle>
            <CardDescription>
              L&apos;échéance du {formaterDate(mission.dateFinActuelle)} est
              passée. La mission ne se clôture ni ne se prolonge d&apos;elle-même :
              clôturez-la pour générer le rapport de fin de mission, ou
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
                Fin de mission proche
              </CardTitle>
              <CardDescription>
                {restants === 0
                  ? "La mission se termine aujourd'hui."
                  : `La mission se termine dans ${restants} jour${restants > 1 ? "s" : ""}.`}{" "}
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
        <CardHeader>
          <CardTitle className="text-base">Membres assignés</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {mission.membres.map((m) => (
            <span
              key={m.userId}
              className="rounded-md bg-muted px-2 py-1 text-sm"
            >
              {m.user.nom}
            </span>
          ))}
        </CardContent>
      </Card>

      {mission.prolongations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Historique des prolongations
            </CardTitle>
            <CardDescription>
              Conservé intégralement et repris dans le rapport de fin de mission.
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
          bilan={mission.bilanQualitatifManager}
        />
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Tâches de la mission</h2>
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
          messageVide="Aucune tâche rattachée à cette mission."
        />
      </section>
    </div>
  );
}
