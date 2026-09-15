"use client";

import { useState } from "react";

import { evaluerTache } from "@/lib/actions/taches";
import { useFormulaireAction } from "@/lib/use-formulaire-action";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  tacheId: string;
  titre: string;
  noteActuelle: number | null;
};

const NOTES = [1, 2, 3, 4, 5];

export function DialogueEvaluation({ tacheId, titre, noteActuelle }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [note, setNote] = useState(noteActuelle ?? 0);
  const { erreur, enAttente, soumettre } = useFormulaireAction(evaluerTache, () =>
    setOuvert(false),
  );

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>
        <Button variant={noteActuelle ? "ghost" : "secondary"} size="sm">
          {noteActuelle ? `${noteActuelle}/5` : "Noter"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Évaluer la qualité</DialogTitle>
          <DialogDescription>{titre}</DialogDescription>
        </DialogHeader>

        <form action={soumettre} className="space-y-4">
          <input type="hidden" name="tacheId" value={tacheId} />
          <input type="hidden" name="noteQualite" value={note} />

          <div className="space-y-2">
            <Label>Note</Label>
            <div className="flex gap-2">
              {NOTES.map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={note === n ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setNote(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              1 = insuffisant · 5 = excellent
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commentaireQualite">Commentaire (optionnel)</Label>
            <Textarea id="commentaireQualite" name="commentaireQualite" rows={3} />
          </div>

          {erreur && (
            <p className="text-sm text-destructive" role="alert">
              {erreur}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={enAttente || note === 0}>
              {enAttente ? "Enregistrement…" : "Enregistrer la note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
