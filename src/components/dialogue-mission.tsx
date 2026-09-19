"use client";

import { useState } from "react";

import { creerMission, modifierMission } from "@/lib/actions/missions";
import { useFormulaireAction } from "@/lib/use-formulaire-action";
import { versValeurInput } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

export type MissionEditable = {
  id: string;
  nom: string;
  description: string | null;
  type: string;
  dateDebut: Date;
  dateFinActuelle: Date;
  membres: string[];
};

type Props = {
  membres: { id: string; nom: string }[];
  mission?: MissionEditable;
  declencheur: React.ReactNode;
};

export function DialogueMission({ membres, mission, declencheur }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const enEdition = Boolean(mission);
  const { erreur, enAttente, soumettre } = useFormulaireAction(
    enEdition ? modifierMission : creerMission,
    () => setOuvert(false),
  );

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>{declencheur}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {enEdition ? "Modifier l'activité" : "Nouvelle activité"}
          </DialogTitle>
          <DialogDescription>
            Une activité-projet a une fin définie. Un cycle récurrent sert au
            suivi continu de l&apos;activité courante.
          </DialogDescription>
        </DialogHeader>

        <form action={soumettre} className="space-y-4">
          {mission && (
            <input type="hidden" name="missionId" value={mission.id} />
          )}

          <div className="space-y-2">
            <Label htmlFor="nom">Nom</Label>
            <Input
              id="nom"
              name="nom"
              required
              defaultValue={mission?.nom}
              placeholder="Réapprovisionnement de l'entrepôt régional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={mission?.description ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              defaultValue={mission?.type ?? "PROJET"}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
            >
              <option value="PROJET">Activité-projet (début et fin définis)</option>
              <option value="CYCLE_RECURRENT">
                Cycle récurrent (suivi continu)
              </option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateDebut">Début</Label>
              <Input
                id="dateDebut"
                name="dateDebut"
                type="date"
                required
                defaultValue={versValeurInput(mission?.dateDebut ?? new Date())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFin">Fin prévue</Label>
              <Input
                id="dateFin"
                name="dateFin"
                type="date"
                required
                defaultValue={versValeurInput(
                  mission?.dateFinActuelle ?? new Date(),
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Membres assignés</Label>
            <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border p-3">
              {membres.map((membre) => (
                <label
                  key={membre.id}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    name="membres"
                    value={membre.id}
                    defaultChecked={mission?.membres.includes(membre.id)}
                  />
                  {membre.nom}
                </label>
              ))}
            </div>
          </div>

          {!enEdition && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox name="demarrer" value="1" defaultChecked />
              Démarrer l&apos;activité immédiatement
            </label>
          )}

          {erreur && (
            <p className="text-sm text-destructive" role="alert">
              {erreur}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={enAttente}>
              {enAttente
                ? "Enregistrement…"
                : enEdition
                  ? "Enregistrer"
                  : "Créer l'activité"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
