"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Role } from "@prisma/client";

import {
  basculerActivation,
  creerMembre,
  modifierMembre,
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
  service: string | null;
  role: Role;
  actif: boolean;
  superieurId: string | null;
  superieur: { nom: string } | null;
  _count: { tachesAssignees: number; subordonnes: number };
};

const CLASSE_SELECT =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs";

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

  const sansSuperieur = membres.filter(
    (m) => !m.superieurId && m.role !== "MANAGER" && m.actif,
  ).length;

  return (
    <div className="space-y-4">
      <DialogueNouveauMembre membres={membres} />

      {sansSuperieur > 0 && (
        <p className="rounded-md border-l-4 border-l-warning bg-warning/[0.06] px-3 py-2 text-sm ring-1 ring-warning/30">
          {sansSuperieur} personne{sansSuperieur > 1 ? "s" : ""} sans supérieur
          hiérarchique. Renseignez le rattachement pour que leurs tâches aient un
          point de contact.
        </p>
      )}

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
                    {membre.service && ` · ${membre.service}`}
                    {` · ${membre._count.tachesAssignees} tâche${membre._count.tachesAssignees > 1 ? "s" : ""}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {membre.superieur
                      ? `Rattaché à ${membre.superieur.nom}`
                      : "Aucun supérieur renseigné"}
                    {membre._count.subordonnes > 0 &&
                      ` · encadre ${membre._count.subordonnes} personne${membre._count.subordonnes > 1 ? "s" : ""}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <DialogueProfil membre={membre} membres={membres} />
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

function DialogueProfil({
  membre,
  membres,
}: {
  membre: Membre;
  membres: Membre[];
}) {
  const [ouvert, setOuvert] = useState(false);
  const { erreur, enAttente, soumettre } = useFormulaireAction(
    modifierMembre,
    () => setOuvert(false),
  );

  // Se rattacher à soi-même est impossible ; les boucles plus profondes sont
  // refusées côté serveur, qui remonte toute la chaîne hiérarchique.
  const superieursPossibles = membres.filter((m) => m.id !== membre.id);

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le profil</DialogTitle>
          <DialogDescription>{membre.nom}</DialogDescription>
        </DialogHeader>

        <form action={soumettre} className="space-y-4">
          <input type="hidden" name="userId" value={membre.id} />

          <div className="space-y-2">
            <Label htmlFor={`nom-${membre.id}`}>Nom complet</Label>
            <Input
              id={`nom-${membre.id}`}
              name="nom"
              defaultValue={membre.nom}
              required
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`sup-${membre.id}`}>Supérieur hiérarchique</Label>
            <select
              id={`sup-${membre.id}`}
              name="superieurId"
              defaultValue={membre.superieurId ?? ""}
              className={CLASSE_SELECT}
            >
              <option value="">Aucun (sommet de l&apos;organigramme)</option>
              {superieursPossibles.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                  {m.poste ? ` — ${m.poste}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`poste-${membre.id}`}>Poste / fonction</Label>
            <Input
              id={`poste-${membre.id}`}
              name="poste"
              defaultValue={membre.poste ?? ""}
              placeholder="Chargé de projet"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`service-${membre.id}`}>Service</Label>
            <Input
              id={`service-${membre.id}`}
              name="service"
              defaultValue={membre.service ?? ""}
              placeholder="Opérations"
            />
          </div>

          {erreur && (
            <p className="text-sm text-destructive" role="alert">
              {erreur}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={enAttente}>
              {enAttente ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DialogueNouveauMembre({ membres }: { membres: Membre[] }) {
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="poste">Poste</Label>
              <Input id="poste" name="poste" placeholder="Chargé de projet" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Input id="service" name="service" placeholder="Opérations" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="superieurId">Supérieur hiérarchique</Label>
            <select
              id="superieurId"
              name="superieurId"
              defaultValue=""
              className={CLASSE_SELECT}
            >
              <option value="">À définir plus tard</option>
              {membres.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                  {m.poste ? ` — ${m.poste}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <select
              id="role"
              name="role"
              defaultValue="MEMBER"
              className={CLASSE_SELECT}
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
