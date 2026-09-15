"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { LIBELLES_STATUT } from "@/lib/taches";
import { Button } from "@/components/ui/button";

type Props = {
  membres?: { id: string; nom: string }[];
  missions?: { id: string; nom: string }[];
  afficherOrigine?: boolean;
};

const CLASSE_SELECT =
  "h-9 rounded-md border border-input bg-background px-2 text-sm shadow-xs";

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
    if (valeur) params.set(cle, valeur);
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
        <select
          aria-label="Filtrer par membre"
          className={CLASSE_SELECT}
          value={searchParams.get("membre") ?? ""}
          onChange={(e) => definir("membre", e.target.value)}
        >
          <option value="">Tous les membres</option>
          {membres.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nom}
            </option>
          ))}
        </select>
      )}

      {missions && (
        <select
          aria-label="Filtrer par mission"
          className={CLASSE_SELECT}
          value={searchParams.get("mission") ?? ""}
          onChange={(e) => definir("mission", e.target.value)}
        >
          <option value="">Toutes les missions</option>
          <option value="aucune">Hors mission</option>
          {missions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nom}
            </option>
          ))}
        </select>
      )}

      <select
        aria-label="Filtrer par statut"
        className={CLASSE_SELECT}
        value={searchParams.get("statut") ?? ""}
        onChange={(e) => definir("statut", e.target.value)}
      >
        <option value="">Tous les statuts</option>
        {Object.entries(LIBELLES_STATUT).map(([valeur, libelle]) => (
          <option key={valeur} value={valeur}>
            {libelle}
          </option>
        ))}
      </select>

      {afficherOrigine && (
        <select
          aria-label="Filtrer par origine"
          className={CLASSE_SELECT}
          value={searchParams.get("origine") ?? ""}
          onChange={(e) => definir("origine", e.target.value)}
        >
          <option value="">Toutes origines</option>
          <option value="MANAGER">Assignées par le manager</option>
          <option value="MEMBRE">Auto-déclarées</option>
        </select>
      )}

      {filtreActif && (
        <Button variant="ghost" size="sm" onClick={reinitialiser}>
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
