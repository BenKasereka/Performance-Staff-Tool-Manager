import Link from "next/link";

import { exigerManager } from "@/lib/auth-guards";
import { construireOrganigramme, type NoeudOrganigramme } from "@/lib/organigramme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function PageOrganigramme() {
  await exigerManager();
  const { racines, noeuds } = await construireOrganigramme();

  const sansRattachement = noeuds.filter(
    (n) => !n.superieurId && n.role !== "MANAGER",
  );
  const encadrants = noeuds
    .filter((n) => n.enfants.length > 0)
    .sort((a, b) => b.chargeEquipe.total - a.chargeEquipe.total);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Organigramme
          </h1>
          <p className="text-sm text-muted-foreground">
            Qui fait quoi, qui supervise qui, et combien de tâches relèvent de
            chacun.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/manager/equipe">Modifier les rattachements</Link>
        </Button>
      </div>

      {sansRattachement.length > 0 && (
        <Card className="ring-warning/40 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-base">
              {sansRattachement.length} personne
              {sansRattachement.length > 1 ? "s" : ""} sans supérieur
            </CardTitle>
            <CardDescription>
              Sans rattachement, leurs tâches n&apos;ont pas de point de contact
              hiérarchique et n&apos;apparaissent dans la charge d&apos;aucune
              équipe.
            </CardDescription>
          </CardHeader>
          <CardAction />
          <CardContent className="flex flex-wrap gap-2">
            {sansRattachement.map((n) => (
              <Link
                key={n.id}
                href="/manager/equipe"
                className="rounded-md border bg-background px-2 py-1 text-sm hover:bg-muted"
              >
                {n.nom}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Structure hiérarchique</CardTitle>
          <CardDescription>
            Entre parenthèses : tâches de la personne seule, puis de toute son
            équipe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {racines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun collaborateur enregistré.
            </p>
          ) : (
            <ul className="space-y-1">
              {racines.map((racine) => (
                <Noeud key={racine.id} noeud={racine} niveau={0} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {encadrants.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Répartition des responsabilités
            </CardTitle>
            <CardDescription>
              Charge cumulée de chaque encadrant, subordonnés inclus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="text-xs uppercase text-muted-foreground">
                  <TableHead>Encadrant</TableHead>
                  <TableHead>Subordonnés</TableHead>
                  <TableHead className="text-right">Tâches équipe</TableHead>
                  <TableHead className="text-right">Ouvertes</TableHead>
                  <TableHead className="text-right">En retard</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {encadrants.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="whitespace-normal">
                      <span className="font-medium">{n.nom}</span>
                      {n.poste && (
                        <span className="text-muted-foreground">
                          {" "}
                          · {n.poste}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {n.enfants.length}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {n.chargeEquipe.total}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {n.chargeEquipe.ouvertes}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${n.chargeEquipe.enRetard > 0 ? "font-medium text-destructive" : ""}`}
                    >
                      {n.chargeEquipe.enRetard}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Noeud({
  noeud,
  niveau,
}: {
  noeud: NoeudOrganigramme;
  niveau: number;
}) {
  return (
    <li>
      <div
        className="flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60"
        style={{ marginInlineStart: `${niveau * 1.25}rem` }}
      >
        {niveau > 0 && (
          <span className="text-muted-foreground" aria-hidden>
            └
          </span>
        )}
        <Link
          href={`/manager/taches?membre=${noeud.id}&g=mois`}
          className="font-medium hover:underline"
        >
          {noeud.nom}
        </Link>
        {noeud.poste && (
          <span className="text-sm text-muted-foreground">{noeud.poste}</span>
        )}
        {noeud.service && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs">
            {noeud.service}
          </span>
        )}
        {noeud.role === "MANAGER" && <Badge variant="outline">Manager</Badge>}
        {!noeud.actif && <Badge variant="neutral">Désactivé</Badge>}
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {noeud.chargePropre.total} tâche
          {noeud.chargePropre.total > 1 ? "s" : ""}
          {noeud.enfants.length > 0 &&
            ` · équipe ${noeud.chargeEquipe.total}`}
          {noeud.chargeEquipe.enRetard > 0 && (
            <span className="text-destructive">
              {" "}
              · {noeud.chargeEquipe.enRetard} en retard
            </span>
          )}
        </span>
      </div>

      {noeud.enfants.length > 0 && (
        <ul className="space-y-1">
          {noeud.enfants.map((enfant) => (
            <Noeud key={enfant.id} noeud={enfant} niveau={niveau + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
