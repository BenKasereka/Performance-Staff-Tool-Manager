import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { construireRaci } from "@/lib/rapports/raci";
import { excelRaci } from "@/lib/rapports/excel";
import { PdfRaci } from "@/lib/rapports/pdf-raci";
import { nomFichier } from "@/lib/rapports/nommage";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(requete: Request) {
  // La matrice expose les responsabilités de toute l'équipe : réservée au manager.
  const session = await auth();
  if (session?.user.role !== "MANAGER") {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 403 });
  }

  const url = new URL(requete.url);
  const format = url.searchParams.get("format") === "excel" ? "excel" : "pdf";
  const missionId = url.searchParams.get("mission") ?? undefined;

  const rapport = await construireRaci(missionId);
  const base = nomFichier(`Matrice RACI passation ${rapport.perimetre}`);

  if (format === "excel") {
    const buffer = await excelRaci(rapport);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${base}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const buffer = await renderToBuffer(<PdfRaci rapport={rapport} />);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${base}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
