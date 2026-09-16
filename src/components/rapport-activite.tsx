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

function construireBase(
  basePath: string,
  mode: "path" | "query",
  activiteId?: string,
) {
  if (mode === "path") return `${basePath}/${activiteId}`;
  return `${basePath}${activiteId ? `?mission=${activiteId}` : ""}`;
}

export function RapportActivite({
  activites,
  basePath,
  mode,
  libelle,
  avecOptionToutes = false,
}: {
  activites: { id: string; nom: string }[];
  /** Chemin de base de l'API, sans le paramètre d'activité (ex. "/api/rapports/mission"). */
  basePath: string;
  /** "path" ajoute `/${id}` ; "query" ajoute `?mission=${id}` (omis si aucune activité choisie). */
  mode: "path" | "query";
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
          base={construireBase(basePath, mode, activiteId === TOUTES ? undefined : activiteId)}
          libelle={libelle}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Choisissez une activité.</p>
      )}
    </div>
  );
}
