"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { LIBELLES_STATUT } from "@/lib/taches";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  membres?: { id: string; nom: string }[];
  missions?: { id: string; nom: string }[];
  afficherOrigine?: boolean;
};

/** Radix Select refuse une valeur vide : ce jeton représente « aucun filtre ». */
const TOUS = "__TOUS__";

export function FiltresTaches({
  membres,
  missions,
  afficherOrigine = true,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function definir(cle: string, valeur: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valeur && valeur !== TOUS) params.set(cle, valeur);
    else params.delete(cle);
    router.push(`${pathname}?${params.toString()}`);
  }

  function reinitialiser() {
    const params = new URLSearchParams(searchParams.toString());
    for (const cle of ["membre", "mission", "statut", "origine"]) {
      params.delete(cle);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const filtreActif = ["membre", "mission", "statut", "origine"].some((c) =>
    searchParams.get(c),
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {membres && (
        <Select
          value={searchParams.get("membre") ?? TOUS}
          onValueChange={(v) => definir("membre", v)}
        >
          <SelectTrigger aria-label="Filtrer par membre" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TOUS}>Tous les membres</SelectItem>
            {membres.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {missions && (
        <Select
          value={searchParams.get("mission") ?? TOUS}
          onValueChange={(v) => definir("mission", v)}
        >
          <SelectTrigger aria-label="Filtrer par activité" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TOUS}>Toutes les activités</SelectItem>
            <SelectItem value="aucune">Hors activité</SelectItem>
            {missions.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={searchParams.get("statut") ?? TOUS}
        onValueChange={(v) => definir("statut", v)}
      >
        <SelectTrigger aria-label="Filtrer par statut" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TOUS}>Tous les statuts</SelectItem>
          {Object.entries(LIBELLES_STATUT).map(([valeur, libelle]) => (
            <SelectItem key={valeur} value={valeur}>
              {libelle}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {afficherOrigine && (
        <Select
          value={searchParams.get("origine") ?? TOUS}
          onValueChange={(v) => definir("origine", v)}
        >
          <SelectTrigger aria-label="Filtrer par origine" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TOUS}>Toutes origines</SelectItem>
            <SelectItem value="MANAGER">Assignées par le manager</SelectItem>
            <SelectItem value="MEMBRE">Auto-déclarées</SelectItem>
          </SelectContent>
        </Select>
      )}

      {filtreActif && (
        <Button variant="ghost" size="sm" onClick={reinitialiser}>
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
