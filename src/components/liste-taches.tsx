"use client";

import Link from "next/link";
import { useTransition } from "react";
import { isSameDay } from "date-fns";
import { toast } from "sonner";
import type { Role, TaskStatut } from "@prisma/client";

import {
  changerStatutTache,
  supprimerTache,
  type Resultat,
} from "@/lib/actions/taches";
import { formaterDate } from "@/lib/dates";
import { joursDeReport, statutAffiche, LIBELLES_STATUT } from "@/lib/taches";
import {
  BadgeOrigine,
  BadgePriorite,
  BadgeStatutTache,
} from "@/components/badges";
import {
  DialogueTache,
  type OptionMembre,
  type OptionMission,
} from "@/components/dialogue-tache";
import { DialogueEvaluation } from "@/components/dialogue-evaluation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type TacheAffichee = {
  id: string;
  titre: string;
  description: string | null;
  statut: TaskStatut;
  dateDebut: Date;
  echeance: Date;
  priorite: "BASSE" | "MOYENNE" | "HAUTE";
  periodicite: string;
  origine: "MANAGER" | "MEMBRE";
  missionId: string | null;
  missionNom: string | null;
  noteQualite: number | null;
  recurrenceActive: boolean;
  recurrenceFrequence: string | null;
  recurrenceFinLe: Date | null;
  assignes: { id: string; nom: string }[];
};

type Props = {
  taches: TacheAffichee[];
  utilisateur: { id: string; role: Role };
  membres: OptionMembre[];
  missions: OptionMission[];
  messageVide?: string;
};

const STATUTS: TaskStatut[] = [
  "A_FAIRE",
  "EN_COURS",
  "EN_ATTENTE",
  "TERMINEE",
  "ANNULEE",
];

export function ListeTaches({
  taches,
  utilisateur,
  membres,
  missions,
  messageVide = "Aucune tâche pour cette période.",
}: Props) {
  const [enCours, demarrer] = useTransition();
  const estManager = utilisateur.role === "MANAGER";

  function traiter(promesse: Promise<Resultat>) {
    demarrer(async () => {
      const resultat = await promesse;
      if (resultat?.erreur) toast.error(resultat.erreur);
      else if (resultat?.succes) toast.success(resultat.succes);
    });
  }

  if (taches.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        {messageVide}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {taches.map((tache) => {
        const statut = statutAffiche(tache);
        const report = joursDeReport(tache);
        const modifiable = estManager || tache.origine === "MEMBRE";

        return (
          <li
            key={tache.id}
            className="rounded-lg border bg-background p-3 sm:p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`${estManager ? "/manager" : "/mon-espace"}/taches/${tache.id}`}
                    className="font-medium hover:underline"
                  >
                    {tache.titre}
                  </Link>
                  <BadgeStatutTache statut={statut} />
                  <BadgePriorite priorite={tache.priorite} />
                  {estManager && <BadgeOrigine origine={tache.origine} />}
                  {tache.recurrenceActive && (
                    <span className="text-xs text-muted-foreground">
                      récurrente
                    </span>
                  )}
                </div>

                {tache.description && (
                  <p className="text-sm text-muted-foreground">
                    {tache.description}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  {isSameDay(tache.dateDebut, tache.echeance)
                    ? `Échéance ${formaterDate(tache.echeance)}`
                    : `Du ${formaterDate(tache.dateDebut)} au ${formaterDate(tache.echeance)}`}
                  {tache.missionNom && ` · ${tache.missionNom}`}
                  {estManager &&
                    tache.assignes.length > 0 &&
                    ` · ${tache.assignes.map((a) => a.nom).join(", ")}`}
                  {tache.noteQualite && ` · qualité ${tache.noteQualite}/5`}
                </p>

                {report > 0 && (
                  <p className="text-xs font-medium text-warning">
                    Reportée depuis le {formaterDate(tache.echeance)} —{" "}
                    {report} jour{report > 1 ? "s" : ""}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={enCours}>
                      {LIBELLES_STATUT[tache.statut]}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {STATUTS.map((s) => (
                      <DropdownMenuItem
                        key={s}
                        onSelect={() =>
                          traiter(changerStatutTache(tache.id, s))
                        }
                      >
                        {LIBELLES_STATUT[s]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {estManager && tache.statut === "TERMINEE" && (
                  <DialogueEvaluation
                    tacheId={tache.id}
                    titre={tache.titre}
                    noteActuelle={tache.noteQualite}
                  />
                )}

                {modifiable && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={enCours}>
                        •••
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DialogueTache
                        membres={membres}
                        missions={missions}
                        utilisateur={utilisateur}
                        tache={{
                          id: tache.id,
                          titre: tache.titre,
                          description: tache.description,
                          missionId: tache.missionId,
                          periodicite: tache.periodicite,
                          dateDebut: tache.dateDebut,
                          echeance: tache.echeance,
                          priorite: tache.priorite,
                          recurrenceActive: tache.recurrenceActive,
                          recurrenceFrequence: tache.recurrenceFrequence,
                          recurrenceFinLe: tache.recurrenceFinLe,
                          assignes: tache.assignes.map((a) => a.id),
                        }}
                        declencheur={
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                          >
                            Modifier
                          </DropdownMenuItem>
                        }
                      />
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => traiter(supprimerTache(tache.id))}
                      >
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
