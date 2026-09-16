import type { Prisma } from "@prisma/client";

import { exigerUtilisateur } from "@/lib/auth-guards";
import {
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

const GRANULARITES = ["jour", "semaine", "mois"] as const satisfies Granularite[];

export default async function PageMesTaches({
  searchParams,
}: PageProps<"/mon-espace/taches">) {
  const utilisateur = await exigerUtilisateur();
  const params = await searchParams;

  const granularite = GRANULARITES.includes(
    params.g as (typeof GRANULARITES)[number],
  )
    ? (params.g as (typeof GRANULARITES)[number])
    : "semaine";
  const reference = params.d ? new Date(String(params.d)) : new Date();
  const periode = intervalle(granularite, reference);
  const missionFiltre = params.mission ? String(params.mission) : "";
  const statutFiltre = params.statut ? String(params.statut) : "";

  // Isolation : un membre ne lit jamais que les tâches qui lui sont assignées.
  const filtres: Prisma.TaskWhereInput = {
    assignes: { some: { userId: utilisateur.id } },
    ...(missionFiltre
      ? missionFiltre === "aucune"
        ? { missionId: null }
        : { missionId: missionFiltre }
      : {}),
  };

  const [tachesBrutes, missions] = await Promise.all([
    granularite === "jour"
      ? chargerTachesDuJour(periode, filtres)
      : chargerTaches({
          ...filtres,
          echeance: { gte: periode.debut, lte: periode.fin },
        }),
    chargerMissionsOptions(utilisateur.id),
  ]);

  const taches = statutFiltre
    ? tachesBrutes.filter((t) => statutAffiche(t) === statutFiltre)
    : tachesBrutes;

  const terminees = taches.filter((t) => t.statut === "TERMINEE").length;
  const enRetard = taches.filter((t) => estEnRetard(t)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mes tâches</h1>
          <p className="text-sm text-muted-foreground">
            {taches.length} tâche{taches.length > 1 ? "s" : ""} sur la période ·{" "}
            {terminees} terminée{terminees > 1 ? "s" : ""} · {enRetard} en retard
          </p>
        </div>
        <DialogueTache
          membres={[{ id: utilisateur.id, nom: utilisateur.nom }]}
          missions={missions}
          utilisateur={{ id: utilisateur.id, role: utilisateur.role }}
          declencheur={<Button>Ajouter une tâche</Button>}
        />
      </div>

      <div className="space-y-3">
        <SelecteurPeriode granularite={granularite} reference={reference} />
        <FiltresTaches missions={missions} afficherOrigine={false} />
      </div>

      {granularite === "jour" ? (
        <ListeTaches
          taches={taches}
          utilisateur={{ id: utilisateur.id, role: utilisateur.role }}
          membres={[{ id: utilisateur.id, nom: utilisateur.nom }]}
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
          />
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Détail</h2>
            <ListeTaches
              taches={taches}
              utilisateur={{ id: utilisateur.id, role: utilisateur.role }}
              membres={[{ id: utilisateur.id, nom: utilisateur.nom }]}
              missions={missions}
            />
          </section>
        </div>
      )}
    </div>
  );
}
