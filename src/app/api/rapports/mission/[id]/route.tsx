import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { construireRapportMission } from "@/lib/rapports/donnees";
import { excelMission } from "@/lib/rapports/excel";
import { PdfMission } from "@/lib/rapports/pdf-mission";
import { nomFichier } from "@/lib/rapports/nommage";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(
  requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const format =
    new URL(requete.url).searchParams.get("format") === "excel"
      ? "excel"
      : "pdf";

  const rapport = await construireRapportMission(id);
  if (!rapport) {
    return NextResponse.json({ erreur: "Mission introuvable" }, { status: 404 });
  }

  const base = nomFichier(`Rapport fin de mission ${rapport.mission.nom}`);

  if (format === "excel") {
    const buffer = await excelMission(rapport);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${base}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const buffer = await renderToBuffer(<PdfMission rapport={rapport} />);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${base}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
