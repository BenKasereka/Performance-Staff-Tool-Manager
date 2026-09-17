import Link from "next/link";

import { exigerManager } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/page-hero";
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
      <PageHero
        titre="Équipe"
        description="Comptes, rattachements hiérarchiques et services."
        actions={
          <Button variant="outline" asChild>
            <Link href="/manager/organigramme">Voir l&apos;organigramme</Link>
          </Button>
        }
      />

      <GestionEquipe membres={membres} managerId={manager.id} />
    </div>
  );
}
