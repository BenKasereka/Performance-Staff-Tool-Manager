"use client";

import { useRef } from "react";

import { ajouterCommentaire } from "@/lib/actions/taches";
import { useFormulaireAction } from "@/lib/use-formulaire-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Commentaire = {
  id: string;
  contenu: string;
  auteur: string;
  date: string;
};

export function FilCommentaires({
  tacheId,
  commentaires,
}: {
  tacheId: string;
  commentaires: Commentaire[];
}) {
  const formulaire = useRef<HTMLFormElement>(null);
  const { erreur, enAttente, soumettre } = useFormulaireAction(
    ajouterCommentaire,
    () => formulaire.current?.reset(),
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Discussion</CardTitle>
        <CardDescription>
          {commentaires.length === 0
            ? "Aucun commentaire pour l'instant."
            : `${commentaires.length} commentaire${commentaires.length > 1 ? "s" : ""}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {commentaires.length > 0 && (
          <ul className="space-y-3">
            {commentaires.map((c) => (
              <li key={c.id} className="rounded-md border p-3 text-sm">
                <p className="text-xs text-muted-foreground">
                  {c.auteur} · {c.date}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{c.contenu}</p>
              </li>
            ))}
          </ul>
        )}

        <form ref={formulaire} action={soumettre} className="space-y-2">
          <input type="hidden" name="tacheId" value={tacheId} />
          <Textarea
            name="contenu"
            rows={3}
            required
            placeholder="Ajouter un commentaire…"
          />
          {erreur && (
            <p className="text-sm text-destructive" role="alert">
              {erreur}
            </p>
          )}
          <Button type="submit" size="sm" disabled={enAttente}>
            {enAttente ? "Envoi…" : "Commenter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
