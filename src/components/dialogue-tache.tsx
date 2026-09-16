"use client";

import { useState } from "react";
import type { Role } from "@prisma/client";

import { creerTache, modifierTache } from "@/lib/actions/taches";
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

export type OptionMembre = { id: string; nom: string };
export type OptionMission = { id: string; nom: string };

export type TacheEditable = {
  id: string;
  titre: string;
  description: string | null;
  missionId: string | null;
  periodicite: string;
  echeance: Date;
  priorite: string;
  recurrenceActive: boolean;
  recurrenceFrequence: string | null;
  recurrenceFinLe: Date | null;
  assignes: string[];
};

type Props = {
  membres: OptionMembre[];
  missions: OptionMission[];
  utilisateur: { id: string; role: Role };
  tache?: TacheEditable;
  declencheur: React.ReactNode;
};

export function DialogueTache({
  membres,
  missions,
  utilisateur,
  tache,
  declencheur,
}: Props) {
  const [ouvert, setOuvert] = useState(false);
  const enEdition = Boolean(tache);
  const estManager = utilisateur.role === "MANAGER";

  const { erreur, enAttente, soumettre } = useFormulaireAction(
    enEdition ? modifierTache : creerTache,
    () => setOuvert(false),
  );

  const [recurrence, setRecurrence] = useState(
    tache?.recurrenceActive ?? false,
  );

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>{declencheur}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {enEdition ? "Modifier la tâche" : "Nouvelle tâche"}
          </DialogTitle>
          <DialogDescription>
            {estManager
              ? "Assignez la tâche à un ou plusieurs membres de l'équipe."
              : "Ajoutez une activité à votre planning."}
          </DialogDescription>
        </DialogHeader>

        <form action={soumettre} className="space-y-4">
          {tache && <input type="hidden" name="tacheId" value={tache.id} />}

          <div className="space-y-2">
            <Label htmlFor="titre">Titre</Label>
            <Input
              id="titre"
              name="titre"
              required
              defaultValue={tache?.titre}
              placeholder="Préparer le rapport mensuel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={tache?.description ?? ""}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="echeance">Échéance</Label>
              <Input
                id="echeance"
                name="echeance"
                type="date"
                required
                defaultValue={versValeurInput(tache?.echeance ?? new Date())}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priorite">Priorité</Label>
              <select
                id="priorite"
                name="priorite"
                defaultValue={tache?.priorite ?? "MOYENNE"}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
              >
                <option value="BASSE">Basse</option>
                <option value="MOYENNE">Moyenne</option>
                <option value="HAUTE">Haute</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="periodicite">Périodicité</Label>
              <select
                id="periodicite"
                name="periodicite"
                defaultValue={tache?.periodicite ?? "PONCTUELLE"}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
              >
                <option value="PONCTUELLE">Ponctuelle</option>
                <option value="JOURNALIERE">Journalière</option>
                <option value="HEBDOMADAIRE">Hebdomadaire</option>
                <option value="MENSUELLE">Mensuelle</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="missionId">Activité</Label>
              <select
                id="missionId"
                name="missionId"
                defaultValue={tache?.missionId ?? ""}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
              >
                <option value="">Aucune (activité courante)</option>
                {missions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {estManager ? (
            <div className="space-y-2">
              <Label>Assignée à</Label>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
                {membres.map((membre) => (
                  <label
                    key={membre.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      name="assignes"
                      value={membre.id}
                      defaultChecked={tache?.assignes.includes(membre.id)}
                    />
                    {membre.nom}
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <input type="hidden" name="assignes" value={utilisateur.id} />
          )}

          <div className="space-y-3 rounded-md border p-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <Checkbox
                name="recurrenceActive"
                value="1"
                checked={recurrence}
                onCheckedChange={(v) => setRecurrence(v === true)}
              />
              Tâche récurrente
            </label>

            {recurrence && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recurrenceFrequence">Fréquence</Label>
                  <select
                    id="recurrenceFrequence"
                    name="recurrenceFrequence"
                    defaultValue={tache?.recurrenceFrequence ?? "HEBDOMADAIRE"}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                  >
                    <option value="QUOTIDIENNE">Chaque jour</option>
                    <option value="HEBDOMADAIRE">Chaque semaine</option>
                    <option value="MENSUELLE">Chaque mois</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurrenceFinLe">Jusqu&apos;au (optionnel)</Label>
                  <Input
                    id="recurrenceFinLe"
                    name="recurrenceFinLe"
                    type="date"
                    defaultValue={
                      tache?.recurrenceFinLe
                        ? versValeurInput(tache.recurrenceFinLe)
                        : ""
                    }
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              La tâche suivante est recréée automatiquement dès que celle-ci est
              terminée.
            </p>
          </div>

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
                  : "Créer la tâche"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
