"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { MissionStatut } from "@prisma/client";

import {
  archiverMission,
  cloturerMission,
  demarrerMission,
  prolongerMission,
  type Resultat,
} from "@/lib/actions/missions";
import { useFormulaireAction } from "@/lib/use-formulaire-action";
import { formaterDate, versValeurInput } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  missionId: string;
  statut: MissionStatut;
  echeanceActuelle: Date;
};

export function ActionsMission({ missionId, statut, echeanceActuelle }: Props) {
  const [enCours, demarrer] = useTransition();

  function traiter(promesse: Promise<Resultat>) {
    demarrer(async () => {
      const resultat = await promesse;
      if (resultat?.erreur) toast.error(resultat.erreur);
      else if (resultat?.succes) toast.success(resultat.succes);
    });
  }

  const peutProlonger = statut === "ACTIVE" || statut === "EN_ATTENTE_DECISION";
  const peutCloturer =
    statut === "ACTIVE" || statut === "EN_ATTENTE_DECISION";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {statut === "EN_PREPARATION" && (
        <Button
          size="sm"
          disabled={enCours}
          onClick={() => traiter(demarrerMission(missionId))}
        >
          Démarrer
        </Button>
      )}

      {peutProlonger && (
        <DialogueProlongation
          missionId={missionId}
          echeanceActuelle={echeanceActuelle}
        />
      )}

      {peutCloturer && (
        <Button
          size="sm"
          variant={statut === "EN_ATTENTE_DECISION" ? "default" : "outline"}
          disabled={enCours}
          onClick={() => traiter(cloturerMission(missionId))}
        >
          Clôturer
        </Button>
      )}

      {statut === "CLOTUREE" && (
        <Button
          size="sm"
          variant="outline"
          disabled={enCours}
          onClick={() => traiter(archiverMission(missionId))}
        >
          Archiver
        </Button>
      )}
    </div>
  );
}

function DialogueProlongation({
  missionId,
  echeanceActuelle,
}: {
  missionId: string;
  echeanceActuelle: Date;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [mode, setMode] = useState<"duree" | "date">("duree");
  const { erreur, enAttente, soumettre } = useFormulaireAction(
    prolongerMission,
    () => setOuvert(false),
  );

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Prolonger
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Prolonger l&apos;activité</DialogTitle>
          <DialogDescription>
            Échéance actuelle : {formaterDate(echeanceActuelle)}. Chaque
            prolongation est conservée dans l&apos;historique.
          </DialogDescription>
        </DialogHeader>

        <form action={soumettre} className="space-y-4">
          <input type="hidden" name="missionId" value={missionId} />
          <input type="hidden" name="mode" value={mode} />

          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "duree" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setMode("duree")}
            >
              Ajouter une durée
            </Button>
            <Button
              type="button"
              variant={mode === "date" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setMode("date")}
            >
              Date précise
            </Button>
          </div>

          {mode === "duree" ? (
            <div className="space-y-2">
              <Label htmlFor="duree">Durée à ajouter</Label>
              <select
                id="duree"
                name="duree"
                defaultValue="2s"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
              >
                <option value="1s">1 semaine</option>
                <option value="2s">2 semaines</option>
                <option value="1m">1 mois</option>
                <option value="3m">3 mois</option>
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="nouvelleEcheance">Nouvelle date de fin</Label>
              <Input
                id="nouvelleEcheance"
                name="nouvelleEcheance"
                type="date"
                defaultValue={versValeurInput(echeanceActuelle)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="motif">Motif (optionnel)</Label>
            <Textarea
              id="motif"
              name="motif"
              rows={3}
              placeholder="Retard fournisseur, dédouanement plus long que prévu…"
            />
          </div>

          {erreur && (
            <p className="text-sm text-destructive" role="alert">
              {erreur}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={enAttente}>
              {enAttente ? "Enregistrement…" : "Prolonger"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
