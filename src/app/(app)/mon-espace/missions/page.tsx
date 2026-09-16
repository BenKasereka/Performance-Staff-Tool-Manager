import { exigerUtilisateur } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formaterDate } from "@/lib/dates";
import { LIBELLES_TYPE_MISSION } from "@/lib/missions";
import { estEnRetard } from "@/lib/taches";
import { BadgeStatutMission } from "@/components/badges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function PageMesMissions() {
  const utilisateur = await exigerUtilisateur();

  const missions = await prisma.mission.findMany({
    where: { membres: { some: { userId: utilisateur.id } } },
    orderBy: [{ statut: "asc" }, { dateFinActuelle: "asc" }],
    include: {
      // Seules les tâches du membre : il ne voit pas la charge de ses collègues.
      taches: {
        where: { assignes: { some: { userId: utilisateur.id } } },
        select: { statut: true, echeance: true },
      },
    },
  });

  if (missions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mes activités</h1>
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Vous n&apos;êtes assigné à aucune activité pour l&apos;instant.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mes activités</h1>
        <p className="text-sm text-muted-foreground">
          Votre avancement personnel sur chaque activité.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {missions.map((mission) => {
          const total = mission.taches.length;
          const terminees = mission.taches.filter(
            (t) => t.statut === "TERMINEE",
          ).length;
          const enRetard = mission.taches.filter((t) => estEnRetard(t)).length;
          const taux = total > 0 ? Math.round((terminees / total) * 100) : 0;

          return (
            <Card key={mission.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{mission.nom}</CardTitle>
                  <BadgeStatutMission statut={mission.statut} />
                </div>
                <CardDescription>
                  {LIBELLES_TYPE_MISSION[mission.type]} ·{" "}
                  {formaterDate(mission.dateDebut)} →{" "}
                  {formaterDate(mission.dateFinActuelle)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mon avancement</span>
                  <span className="font-medium tabular-nums">{taux} %</span>
                </div>
                <Progress value={taux} />
                <p className="text-xs text-muted-foreground">
                  {terminees} / {total} tâche{total > 1 ? "s" : ""} terminée
                  {terminees > 1 ? "s" : ""}
                  {enRetard > 0 && ` · ${enRetard} en retard`}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
