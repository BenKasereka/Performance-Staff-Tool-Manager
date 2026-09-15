"use client";

import { useActionState } from "react";

import { creerPremierManager, type EtatFormulaire } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormulairePremierManager() {
  const [etat, action, enAttente] = useActionState<EtatFormulaire, FormData>(
    creerPremierManager,
    undefined,
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom complet</Label>
            <Input id="nom" name="nom" required autoComplete="name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motDePasse">Mot de passe</Label>
            <Input
              id="motDePasse"
              name="motDePasse"
              type="password"
              required
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">8 caractères minimum</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
            <Input
              id="confirmation"
              name="confirmation"
              type="password"
              required
              autoComplete="new-password"
            />
          </div>

          {etat?.erreur && (
            <p className="text-sm text-destructive" role="alert">
              {etat.erreur}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={enAttente}>
            {enAttente ? "Création…" : "Créer le compte"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
