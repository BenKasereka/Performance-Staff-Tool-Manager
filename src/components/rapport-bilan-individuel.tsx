"use client";

import { useState } from "react";

import type { Granularite } from "@/lib/dates";
import { BoutonsRapport } from "@/components/boutons-rapport";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PERIODES: { valeur: Granularite; libelle: string }[] = [
  { valeur: "jour", libelle: "Journalier" },
  { valeur: "semaine", libelle: "Hebdomadaire" },
  { valeur: "mois", libelle: "Mensuel" },
  { valeur: "trimestre", libelle: "Trimestriel" },
  { valeur: "semestre", libelle: "Semestriel" },
  { valeur: "annee", libelle: "Annuel" },
];

export function RapportBilanIndividuel({
  membres,
}: {
  membres: { id: string; nom: string }[];
}) {
  const [membreId, setMembreId] = useState(membres[0]?.id ?? "");
  const [periode, setPeriode] = useState<Granularite>("mois");

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Select value={membreId} onValueChange={setMembreId}>
        <SelectTrigger aria-label="Choisir un membre" className="min-w-44">
          <SelectValue placeholder="Choisir un membre" />
        </SelectTrigger>
        <SelectContent>
          {membres.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.nom}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={periode} onValueChange={(v) => setPeriode(v as Granularite)}>
        <SelectTrigger aria-label="Choisir la période du bilan" className="min-w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIODES.map((p) => (
            <SelectItem key={p.valeur} value={p.valeur}>
              {p.libelle}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {membreId ? (
        <BoutonsRapport
          base={`/api/rapports/membre/${membreId}?g=${periode}`}
          libelle="Bilan"
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucun membre disponible.
        </p>
      )}
    </div>
  );
}
