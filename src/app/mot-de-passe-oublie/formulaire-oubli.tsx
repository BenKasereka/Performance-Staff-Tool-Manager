"use client";

import { demanderReinitialisation } from "@/lib/actions/mot-de-passe";
import { useFormulaireAction } from "@/lib/use-formulaire-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormulaireOubli() {
  const { erreur, enAttente, soumettre } = useFormulaireAction(
    demanderReinitialisation,
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={soumettre} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="prenom.nom@entreprise.com"
            />
          </div>

          {erreur && (
            <p className="text-sm text-destructive" role="alert">
              {erreur}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={enAttente}>
            {enAttente ? "Envoi…" : "Envoyer le lien de réinitialisation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
