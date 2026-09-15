import { NextResponse } from "next/server";

import {
  alerterEcheancesProches,
  alerterFinDeMission,
  alerterTachesEnRetard,
  cronAutorise,
  recapQuotidienMembres,
} from "@/lib/cron";
import { verifierMissionsEchues } from "@/lib/actions/missions";

// Durée max sur le plan Hobby de Vercel.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(requete: Request) {
  if (!cronAutorise(requete)) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }

  // L'ordre compte : les missions échues doivent basculer en attente de
  // décision avant que les rappels ne les cherchent.
  const missionsBasculees = await verifierMissionsEchues();
  const fin = await alerterFinDeMission();
  const retards = await alerterTachesEnRetard();
  const echeances = await alerterEcheancesProches();
  const recaps = await recapQuotidienMembres();

  return NextResponse.json({
    missionsBasculees,
    alertesFinMission: fin.alertes,
    rappelsDecision: fin.rappels,
    tachesEnRetard: retards,
    echeancesDemain: echeances,
    recapsEnvoyes: recaps,
  });
}
