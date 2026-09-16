import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { fr } from "date-fns/locale";

export type Granularite =
  | "jour"
  | "semaine"
  | "mois"
  | "trimestre"
  | "semestre"
  | "annee";

export type Intervalle = { debut: Date; fin: Date };

const OPTIONS_SEMAINE = { locale: fr, weekStartsOn: 1 } as const;

function debutSemestre(reference: Date): Date {
  const mois = reference.getMonth() < 6 ? 0 : 6;
  return startOfMonth(new Date(reference.getFullYear(), mois, 1));
}

function finSemestre(reference: Date): Date {
  return endOfMonth(addMonths(debutSemestre(reference), 5));
}

export function intervalle(granularite: Granularite, reference: Date): Intervalle {
  switch (granularite) {
    case "jour":
      return { debut: startOfDay(reference), fin: endOfDay(reference) };
    case "semaine":
      return {
        debut: startOfWeek(reference, OPTIONS_SEMAINE),
        fin: endOfWeek(reference, OPTIONS_SEMAINE),
      };
    case "mois":
      return { debut: startOfMonth(reference), fin: endOfMonth(reference) };
    case "trimestre":
      return { debut: startOfQuarter(reference), fin: endOfQuarter(reference) };
    case "semestre":
      return { debut: debutSemestre(reference), fin: finSemestre(reference) };
    case "annee":
      return { debut: startOfYear(reference), fin: endOfYear(reference) };
  }
}

export function decaler(
  granularite: Granularite,
  reference: Date,
  pas: number,
): Date {
  switch (granularite) {
    case "jour":
      return addDays(reference, pas);
    case "semaine":
      return addWeeks(reference, pas);
    case "mois":
      return addMonths(reference, pas);
    case "trimestre":
      return addQuarters(reference, pas);
    case "semestre":
      return addMonths(reference, pas * 6);
    case "annee":
      return addYears(reference, pas);
  }
}

export function libelleIntervalle(
  granularite: Granularite,
  reference: Date,
): string {
  switch (granularite) {
    case "jour":
      return format(reference, "EEEE d MMMM yyyy", { locale: fr });
    case "semaine": {
      const { debut, fin } = intervalle("semaine", reference);
      return `${format(debut, "d MMM", { locale: fr })} – ${format(fin, "d MMM yyyy", { locale: fr })}`;
    }
    case "mois":
      return format(reference, "MMMM yyyy", { locale: fr });
    case "trimestre": {
      const trimestre = Math.floor(reference.getMonth() / 3) + 1;
      return `T${trimestre} ${format(reference, "yyyy")}`;
    }
    case "semestre": {
      const semestre = reference.getMonth() < 6 ? 1 : 2;
      return `S${semestre} ${format(reference, "yyyy")}`;
    }
    case "annee":
      return format(reference, "yyyy");
  }
}

export function formaterDate(date: Date) {
  return format(date, "d MMM yyyy", { locale: fr });
}

export function formaterDateCourte(date: Date) {
  return format(date, "d MMM", { locale: fr });
}

export function formaterDateHeure(date: Date) {
  return format(date, "d MMM yyyy 'à' HH:mm", { locale: fr });
}

/** Valeur `yyyy-MM-dd` pour les champs <input type="date">. */
export function versValeurInput(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function joursRestants(echeance: Date, reference = new Date()) {
  const diff = startOfDay(echeance).getTime() - startOfDay(reference).getTime();
  return Math.round(diff / 86_400_000);
}
