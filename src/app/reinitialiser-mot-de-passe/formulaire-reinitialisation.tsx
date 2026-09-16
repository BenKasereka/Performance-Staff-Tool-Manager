"use client";

import { useActionState } from "react";

import {
  reinitialiserAvecJeton,
  type Resultat,
} from "@/lib/actions/mot-de-passe";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormulaireReinitialisation({ jeton }: { jeton: string }) {
  const [etat, action, enAttente] = useActionState<Resultat, FormData>(
    reinitialiserAvecJeton,
    undefined,
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="space-y-4">
          <input type="hidden" name="jeton" value={jeton} />

          <div className="space-y-2">
            <Label htmlFor="nouveauMotDePasse">Nouveau mot de passe</Label>
            <Input
              id="nouveauMotDePasse"
              name="nouveauMotDePasse"
              type="password"
              autoComplete="new-password"
              required
            />
            <p className="text-xs text-muted-foreground">8 caractères minimum</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
            <Input
              id="confirmation"
              name="confirmation"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>

          {etat?.erreur && (
            <p className="text-sm text-destructive" role="alert">
              {etat.erreur}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={enAttente}>
            {enAttente ? "Enregistrement…" : "Choisir ce mot de passe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
