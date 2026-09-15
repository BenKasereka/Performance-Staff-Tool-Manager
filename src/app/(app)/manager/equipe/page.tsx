import Link from "next/link";

import { exigerManager } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { GestionEquipe } from "./gestion-equipe";

export const dynamic = "force-dynamic";

export default async function PageEquipe() {
  const manager = await exigerManager();

  const membres = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { nom: "asc" }],
    select: {
      id: true,
      nom: true,
      email: true,
      poste: true,
      service: true,
      role: true,
      actif: true,
      superieurId: true,
      superieur: { select: { nom: true } },
      _count: { select: { tachesAssignees: true, subordonnes: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Équipe</h1>
          <p className="text-sm text-muted-foreground">
            Comptes, rattachements hiérarchiques et services.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/manager/organigramme">Voir l&apos;organigramme</Link>
        </Button>
      </div>

      <GestionEquipe membres={membres} managerId={manager.id} />
    </div>
  );
}
