"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Role } from "@prisma/client";

import {
  basculerActivation,
  creerMembre,
  reinitialiserMotDePasse,
} from "@/lib/actions/equipe";
import { useFormulaireAction } from "@/lib/use-formulaire-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

type Membre = {
  id: string;
  nom: string;
  email: string;
  poste: string | null;
  role: Role;
  actif: boolean;
  _count: { tachesAssignees: number };
};

export function GestionEquipe({
  membres,
  managerId,
}: {
  membres: Membre[];
  managerId: string;
}) {
  const [enCours, demarrer] = useTransition();

  function basculer(id: string) {
    demarrer(async () => {
      const resultat = await basculerActivation(id);
      if (resultat?.erreur) toast.error(resultat.erreur);
      else if (resultat?.succes) toast.success(resultat.succes);
    });
  }

  return (
    <div className="space-y-4">
      <DialogueNouveauMembre />

      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {membres.map((membre) => (
              <li
                key={membre.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{membre.nom}</span>
                    {membre.role === "MANAGER" && (
                      <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-200">
                        Manager
                      </span>
                    )}
                    {!membre.actif && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        Désactivé
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {membre.email}
                    {membre.poste && ` · ${membre.poste}`}
                    {` · ${membre._count.tachesAssignees} tâche${membre._count.tachesAssignees > 1 ? "s" : ""}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <DialogueMotDePasse membre={membre} />
                  {membre.id !== managerId && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={enCours}
                      onClick={() => basculer(membre.id)}
                    >
                      {membre.actif ? "Désactiver" : "Réactiver"}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function DialogueNouveauMembre() {
  const [ouvert, setOuvert] = useState(false);
  const { erreur, enAttente, soumettre } = useFormulaireAction(creerMembre, () =>
    setOuvert(false),
  );

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>
        <Button>Ajouter un membre</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau compte</DialogTitle>
          <DialogDescription>
            Communiquez le mot de passe à la personne : elle pourra se connecter
            immédiatement.
          </DialogDescription>
        </DialogHeader>

        <form action={soumettre} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom complet</Label>
            <Input id="nom" name="nom" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="poste">Poste (optionnel)</Label>
            <Input id="poste" name="poste" placeholder="Chargé de projet" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <select
              id="role"
              name="role"
              defaultValue="MEMBER"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
            >
              <option value="MEMBER">Membre</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motDePasse">Mot de passe provisoire</Label>
            <Input
              id="motDePasse"
              name="motDePasse"
              type="text"
              required
              minLength={8}
            />
          </div>

          {erreur && (
            <p className="text-sm text-destructive" role="alert">
              {erreur}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={enAttente}>
              {enAttente ? "Création…" : "Créer le compte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DialogueMotDePasse({ membre }: { membre: Membre }) {
  const [ouvert, setOuvert] = useState(false);
  const { erreur, enAttente, soumettre } = useFormulaireAction(
    reinitialiserMotDePasse,
    () => setOuvert(false),
  );

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Mot de passe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
          <DialogDescription>{membre.nom}</DialogDescription>
        </DialogHeader>

        <form action={soumettre} className="space-y-4">
          <input type="hidden" name="userId" value={membre.id} />
          <div className="space-y-2">
            <Label htmlFor={`mdp-${membre.id}`}>Nouveau mot de passe</Label>
            <Input
              id={`mdp-${membre.id}`}
              name="motDePasse"
              type="text"
              required
              minLength={8}
            />
          </div>

          {erreur && (
            <p className="text-sm text-destructive" role="alert">
              {erreur}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={enAttente}>
              {enAttente ? "Enregistrement…" : "Réinitialiser"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
