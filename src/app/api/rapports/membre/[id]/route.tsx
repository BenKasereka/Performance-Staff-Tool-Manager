import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { intervalle, libelleIntervalle, type Granularite } from "@/lib/dates";
import { construireRapportIndividuel } from "@/lib/rapports/donnees";
import { excelIndividuel } from "@/lib/rapports/excel";
import { PdfIndividuel } from "@/lib/rapports/pdf-individuel";
import { prisma } from "@/lib/prisma";
import { nomFichier } from "@/lib/rapports/nommage";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const GRANULARITES: Granularite[] = [
  "jour",
  "semaine",
  "mois",
  "trimestre",
  "semestre",
  "annee",
];

export async function GET(
  requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Les rapports contiennent le classement : réservés aux managers.
  const session = await auth();
  if (session?.user.role !== "MANAGER") {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const url = new URL(requete.url);
  const format = url.searchParams.get("format") === "excel" ? "excel" : "pdf";
  const missionId = url.searchParams.get("mission") ?? undefined;

  const granularite = GRANULARITES.includes(
    url.searchParams.get("g") as Granularite,
  )
    ? (url.searchParams.get("g") as Granularite)
    : "mois";
  const reference = url.searchParams.get("d")
    ? new Date(String(url.searchParams.get("d")))
    : new Date();

  let debut: Date;
  let fin: Date;
  let libelle: string;

  if (missionId) {
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      select: { nom: true, dateDebut: true, dateFinActuelle: true },
    });
    if (!mission) {
      return NextResponse.json({ erreur: "Activité introuvable" }, { status: 404 });
    }
    debut = mission.dateDebut;
    fin = mission.dateFinActuelle;
    libelle = `Activité ${mission.nom}`;
  } else {
    const periode = intervalle(granularite, reference);
    debut = periode.debut;
    fin = periode.fin;
    libelle = libelleIntervalle(granularite, reference);
  }

  const rapport = await construireRapportIndividuel({
    userId: id,
    debut,
    fin,
    libellePeriode: libelle,
    missionId,
  });
  if (!rapport) {
    return NextResponse.json({ erreur: "Membre introuvable" }, { status: 404 });
  }

  const base = nomFichier(`Evaluation ${rapport.membre.nom} ${libelle}`);

  if (format === "excel") {
    const buffer = await excelIndividuel(rapport);
    return reponseFichier(
      buffer,
      `${base}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
  }

  const buffer = await renderToBuffer(<PdfIndividuel rapport={rapport} />);
  return reponseFichier(buffer, `${base}.pdf`, "application/pdf");
}

function reponseFichier(buffer: Buffer, nom: string, type: string) {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="${nom}"`,
      "Cache-Control": "no-store",
    },
  });
}
