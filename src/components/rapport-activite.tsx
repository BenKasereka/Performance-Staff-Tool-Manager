"use client";

import { useState } from "react";

import { BoutonsRapport } from "@/components/boutons-rapport";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TOUTES = "__TOUTES__";

export function RapportActivite({
  activites,
  construireBase,
  libelle,
  avecOptionToutes = false,
}: {
  activites: { id: string; nom: string }[];
  construireBase: (activiteId?: string) => string;
  libelle: string;
  avecOptionToutes?: boolean;
}) {
  const [activiteId, setActiviteId] = useState(
    avecOptionToutes ? TOUTES : (activites[0]?.id ?? ""),
  );

  if (activites.length === 0 && !avecOptionToutes) {
    return <p className="text-sm text-muted-foreground">Aucune activité disponible.</p>;
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Select value={activiteId} onValueChange={setActiviteId}>
        <SelectTrigger aria-label="Choisir une activité" className="min-w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {avecOptionToutes && (
            <SelectItem value={TOUTES}>Toutes les activités en cours</SelectItem>
          )}
          {activites.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.nom}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {activiteId ? (
        <BoutonsRapport
          base={construireBase(activiteId === TOUTES ? undefined : activiteId)}
          libelle={libelle}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Choisissez une activité.</p>
      )}
    </div>
  );
}
