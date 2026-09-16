import Link from "next/link";

import { exigerManager } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { chargerMembres } from "@/lib/donnees";
import { verifierMissionsEchues } from "@/lib/actions/missions";
import { formaterDate, joursRestants } from "@/lib/dates";
import { LIBELLES_TYPE_MISSION } from "@/lib/missions";
import { BadgeStatutMission } from "@/components/badges";
import { DialogueMission } from "@/components/dialogue-mission";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PageMissions() {
  await exigerManager();
  await verifierMissionsEchues();

  const [missions, membres] = await Promise.all([
    prisma.mission.findMany({
      orderBy: [{ statut: "asc" }, { dateFinActuelle: "asc" }],
      include: {
        membres: { include: { user: { select: { id: true, nom: true } } } },
        _count: { select: { taches: true, prolongations: true } },
      },
    }),
    chargerMembres(),
  ]);

  const enAttente = missions.filter((m) => m.statut === "EN_ATTENTE_DECISION");
  const autres = missions.filter((m) => m.statut !== "EN_ATTENTE_DECISION");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Activités</h1>
          <p className="text-sm text-muted-foreground">
            Projets ponctuels et cycles de suivi récurrents.
          </p>
        </div>
        <DialogueMission
          membres={membres}
          declencheur={<Button>Nouvelle activité</Button>}
        />
      </div>

      {enAttente.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-destructive">
            Décision attendue ({enAttente.length})
          </h2>
          <div className="space-y-2">
            {enAttente.map((mission) => (
              <CarteMission key={mission.id} mission={mission} enAlerte />
            ))}
          </div>
        </section>
      )}

      {autres.length === 0 && enAttente.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Aucune activité pour l&apos;instant. Créez-en une pour commencer à
          suivre le travail de votre équipe.
        </p>
      ) : (
        <div className="space-y-2">
          {autres.map((mission) => (
            <CarteMission key={mission.id} mission={mission} />
          ))}
        </div>
      )}
    </div>
  );
}

type MissionCarte = Awaited<
  ReturnType<
    typeof prisma.mission.findMany<{
      include: {
        membres: { include: { user: { select: { id: true; nom: true } } } };
        _count: { select: { taches: true; prolongations: true } };
      };
    }>
  >
>[number];

function CarteMission({
  mission,
  enAlerte = false,
}: {
  mission: MissionCarte;
  enAlerte?: boolean;
}) {
  const restants = joursRestants(mission.dateFinActuelle);
  const afficherCompteARebours =
    mission.statut === "ACTIVE" && restants >= 0 && restants <= 7;

  return (
    <Card className={enAlerte ? "ring-destructive/40 bg-destructive/5" : undefined}>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/manager/missions/${mission.id}`}
              className="font-medium hover:underline"
            >
              {mission.nom}
            </Link>
            <BadgeStatutMission statut={mission.statut} />
            <span className="text-xs text-muted-foreground">
              {LIBELLES_TYPE_MISSION[mission.type]}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            {formaterDate(mission.dateDebut)} → {formaterDate(mission.dateFinActuelle)}
            {mission._count.prolongations > 0 &&
              ` · ${mission._count.prolongations} prolongation${mission._count.prolongations > 1 ? "s" : ""}`}
            {` · ${mission.membres.length} membre${mission.membres.length > 1 ? "s" : ""}`}
            {` · ${mission._count.taches} tâche${mission._count.taches > 1 ? "s" : ""}`}
          </p>

          {afficherCompteARebours && (
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              {restants === 0
                ? "Se termine aujourd'hui"
                : `Se termine dans ${restants} jour${restants > 1 ? "s" : ""}`}
            </p>
          )}

          {enAlerte && (
            <p className="text-xs font-medium text-destructive">
              Échéance dépassée — clôturez ou prolongez cette activité.
            </p>
          )}
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link href={`/manager/missions/${mission.id}`}>Ouvrir</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
