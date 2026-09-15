import {
  eachDayOfInterval,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isToday,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import type { Granularite, Intervalle } from "@/lib/dates";
import { CLASSES_STATUT, statutAffiche } from "@/lib/taches";
import type { TacheAffichee } from "@/components/liste-taches";

const OPTIONS_SEMAINE = { locale: fr, weekStartsOn: 1 } as const;

type Props = {
  granularite: Extract<Granularite, "semaine" | "mois">;
  intervalle: Intervalle;
  reference: Date;
  taches: TacheAffichee[];
  afficherAssignes?: boolean;
};

export function PlanningCalendrier({
  granularite,
  intervalle,
  reference,
  taches,
  afficherAssignes = false,
}: Props) {
  // Le mois s'affiche sur des semaines entières, sinon la grille serait bancale.
  const debut =
    granularite === "mois"
      ? startOfWeek(intervalle.debut, OPTIONS_SEMAINE)
      : intervalle.debut;
  const fin =
    granularite === "mois"
      ? endOfWeek(intervalle.fin, OPTIONS_SEMAINE)
      : intervalle.fin;

  const jours = eachDayOfInterval({ start: debut, end: fin });

  return (
    <div
      className={cn(
        "grid gap-2",
        granularite === "semaine"
          ? "grid-cols-1 sm:grid-cols-7"
          : "grid-cols-1 sm:grid-cols-7",
      )}
    >
      {granularite === "mois" && (
        <div className="hidden sm:contents">
          {["lun", "mar", "mer", "jeu", "ven", "sam", "dim"].map((j) => (
            <div
              key={j}
              className="pb-1 text-center text-xs font-medium uppercase text-muted-foreground"
            >
              {j}
            </div>
          ))}
        </div>
      )}

      {jours.map((jour) => {
        const tachesDuJour = taches.filter((t) => isSameDay(t.echeance, jour));
        const horsMois =
          granularite === "mois" && !isSameMonth(jour, reference);

        if (horsMois && tachesDuJour.length === 0) {
          return (
            <div
              key={jour.toISOString()}
              className="hidden min-h-24 rounded-md border border-dashed bg-muted/20 sm:block"
            />
          );
        }

        return (
          <div
            key={jour.toISOString()}
            className={cn(
              "min-h-24 rounded-md border p-2",
              isToday(jour) && "border-foreground/40 bg-muted/40",
              horsMois && "opacity-60",
            )}
          >
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              <span className="sm:hidden">
                {format(jour, "EEEE d MMMM", { locale: fr })}
              </span>
              <span className="hidden sm:inline">
                {granularite === "semaine"
                  ? format(jour, "EEE d", { locale: fr })
                  : format(jour, "d", { locale: fr })}
              </span>
            </p>

            <ul className="space-y-1">
              {tachesDuJour.map((tache) => (
                <li
                  key={tache.id}
                  className={cn(
                    "rounded px-1.5 py-1 text-xs leading-tight",
                    CLASSES_STATUT[statutAffiche(tache)],
                  )}
                  title={tache.titre}
                >
                  <span className="line-clamp-2 font-medium">{tache.titre}</span>
                  {afficherAssignes && tache.assignes.length > 0 && (
                    <span className="block truncate opacity-80">
                      {tache.assignes.map((a) => a.nom).join(", ")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
