import { NextResponse } from "next/server";

import { cronAutorise, recapHebdomadaireManager } from "@/lib/cron";
import { enregistrerScores } from "@/lib/kpi";
import { intervalle } from "@/lib/dates";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(requete: Request) {
  if (!cronAutorise(requete)) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }

  // Fige le score de la semaine écoulée : c'est ce qui alimente les courbes
  // d'évolution, qui ne peuvent pas se recalculer rétroactivement une fois les
  // tâches modifiées.
  const semaine = intervalle("semaine", new Date());
  const scores = await enregistrerScores("SEMAINE", {
    debut: semaine.debut,
    fin: semaine.fin,
  });

  const recaps = await recapHebdomadaireManager();

  return NextResponse.json({ scoresEnregistres: scores.length, recaps });
}
