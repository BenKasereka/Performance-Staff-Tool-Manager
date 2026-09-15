import type { Prisma } from "@prisma/client";

import { exigerManager } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import {
  chargerMembres,
  chargerMissionsOptions,
  chargerTaches,
  chargerTachesDuJour,
} from "@/lib/donnees";
import { intervalle, type Granularite } from "@/lib/dates";
import { estEnRetard, statutAffiche } from "@/lib/taches";
import { DialogueTache } from "@/components/dialogue-tache";
import { FiltresTaches } from "@/components/filtres-taches";
import { ListeTaches } from "@/components/liste-taches";
import { PlanningCalendrier } from "@/components/planning-calendrier";
import { SelecteurPeriode } from "@/components/selecteur-periode";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const GRANULARITES: Granularite[] = ["jour", "semaine", "mois"];

export default async function PageTaches({
  searchParams,
}: PageProps<"/manager/taches">) {
  const utilisateur = await exigerManager();
  const params = await searchParams;

  const granularite = GRANULARITES.includes(params.g as Granularite)
    ? (params.g as Granularite)
    : "semaine";
  const reference = params.d ? new Date(String(params.d)) : new Date();
  const periode = intervalle(granularite, reference);

  const membreFiltre = params.membre ? String(params.membre) : "";
  const missionFiltre = params.mission ? String(params.mission) : "";
  const statutFiltre = params.statut ? String(params.statut) : "";
  const origineFiltre = params.origine ? String(params.origine) : "";

  const filtres: Prisma.TaskWhereInput = {
    ...(membreFiltre ? { assignes: { some: { userId: membreFiltre } } } : {}),
    ...(missionFiltre
      ? missionFiltre === "aucune"
        ? { missionId: null }
        : { missionId: missionFiltre }
      : {}),
    ...(origineFiltre === "MANAGER" || origineFiltre === "MEMBRE"
      ? { origine: origineFiltre }
      : {}),
  };

  const [tachesBrutes, membres, missions, toutesMissions] = await Promise.all([
    // La vue du jour reporte les tâches ouvertes non clôturées ; les vues
    // semaine et mois restent fidèles aux échéances réellement planifiées.
    granularite === "jour"
      ? chargerTachesDuJour(periode, filtres)
      : chargerTaches({
          ...filtres,
          echeance: { gte: periode.debut, lte: periode.fin },
        }),
    chargerMembres(),
    chargerMissionsOptions(),
    prisma.mission.findMany({
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  // « En retard » étant dérivé, ce filtre ne peut pas passer par la requête SQL.
  const taches = statutFiltre
    ? tachesBrutes.filter((t) => statutAffiche(t) === statutFiltre)
    : tachesBrutes;

  const enRetard = taches.filter((t) => estEnRetard(t)).length;
  const terminees = taches.filter((t) => t.statut === "TERMINEE").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tâches</h1>
          <p className="text-sm text-muted-foreground">
            {taches.length} tâche{taches.length > 1 ? "s" : ""} sur la période ·{" "}
            {terminees} terminée{terminees > 1 ? "s" : ""} · {enRetard} en retard
          </p>
        </div>
        <DialogueTache
          membres={membres}
          missions={missions}
          utilisateur={{ id: utilisateur.id, role: utilisateur.role }}
          declencheur={<Button>Nouvelle tâche</Button>}
        />
      </div>

      <div className="space-y-3">
        <SelecteurPeriode granularite={granularite} reference={reference} />
        <FiltresTaches membres={membres} missions={toutesMissions} />
      </div>

      {granularite === "jour" ? (
        <ListeTaches
          taches={taches}
          utilisateur={{ id: utilisateur.id, role: utilisateur.role }}
          membres={membres}
          missions={missions}
          messageVide="Aucune tâche prévue ce jour-là."
        />
      ) : (
        <div className="space-y-6">
          <PlanningCalendrier
            granularite={granularite}
            intervalle={periode}
            reference={reference}
            taches={taches}
            afficherAssignes
          />
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Détail</h2>
            <ListeTaches
              taches={taches}
              utilisateur={{ id: utilisateur.id, role: utilisateur.role }}
              membres={membres}
              missions={missions}
            />
          </section>
        </div>
      )}
    </div>
  );
}
