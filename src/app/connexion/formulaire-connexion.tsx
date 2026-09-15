"use client";

import { useActionState } from "react";

import { connexion, type EtatFormulaire } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormulaireConnexion() {
  const [etat, action, enAttente] = useActionState<EtatFormulaire, FormData>(
    connexion,
    undefined,
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="motDePasse">Mot de passe</Label>
            <Input
              id="motDePasse"
              name="motDePasse"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {etat?.erreur && (
            <p className="text-sm text-destructive" role="alert">
              {etat.erreur}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={enAttente}>
            {enAttente ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
