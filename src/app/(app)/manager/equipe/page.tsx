import { exigerManager } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
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
      role: true,
      actif: true,
      _count: { select: { tachesAssignees: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Équipe</h1>
        <p className="text-sm text-muted-foreground">
          Créez les comptes de vos collaborateurs et gérez leurs accès.
        </p>
      </div>

      <GestionEquipe membres={membres} managerId={manager.id} />
    </div>
  );
}
