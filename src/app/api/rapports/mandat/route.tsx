import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { formaterDate } from "@/lib/dates";
import { construireRapportMandat } from "@/lib/rapports/donnees";
import { excelMandat } from "@/lib/rapports/excel";
import { PdfMandat } from "@/lib/rapports/pdf-mandat";
import { nomFichier } from "@/lib/rapports/nommage";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(requete: Request) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 403 });
  }

  const url = new URL(requete.url);
  const format = url.searchParams.get("format") === "excel" ? "excel" : "pdf";
  const debutParam = url.searchParams.get("debut");
  const finParam = url.searchParams.get("fin");
  if (!debutParam || !finParam) {
    return NextResponse.json(
      { erreur: "Période du mandat manquante" },
      { status: 400 },
    );
  }

  const periodeDebut = new Date(debutParam);
  const periodeFin = new Date(finParam);
  if (Number.isNaN(periodeDebut.getTime()) || Number.isNaN(periodeFin.getTime())) {
    return NextResponse.json({ erreur: "Période invalide" }, { status: 400 });
  }

  const rapport = await construireRapportMandat(
    session.user.id,
    periodeDebut,
    periodeFin,
  );
  if (!rapport) {
    return NextResponse.json({ erreur: "Manager introuvable" }, { status: 404 });
  }

  const base = nomFichier(
    `Rapport de fin de mission ${rapport.manager.nom} ${formaterDate(periodeDebut)} - ${formaterDate(periodeFin)}`,
  );

  if (format === "excel") {
    const buffer = await excelMandat(rapport);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${base}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const buffer = await renderToBuffer(<PdfMandat rapport={rapport} />);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${base}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
