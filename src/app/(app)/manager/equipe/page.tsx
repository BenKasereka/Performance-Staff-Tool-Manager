import Link from "next/link";

import { exigerManager } from "@/lib/auth-guards";
import { idsEquipeGeree } from "@/lib/organigramme";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { GestionEquipe } from "./gestion-equipe";

export const dynamic = "force-dynamic";

export default async function PageEquipe() {
  const manager = await exigerManager();

  // Chaque manager ne voit et ne gère que sa propre organisation : lui-même,
  // sa descendance hiérarchique, et les membres pas encore rattachés à
  // personne. Un autre manager et son équipe restent hors de cet écran.
  const geres = await idsEquipeGeree(manager.id);

  const membres = await prisma.user.findMany({
    where: { id: { in: [...geres] } },
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
