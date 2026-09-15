import { notFound } from "next/navigation";

import { exigerManager } from "@/lib/auth-guards";
import { DetailTache } from "@/components/detail-tache";

export const dynamic = "force-dynamic";

export default async function PageDetailTacheManager({
  params,
}: PageProps<"/manager/taches/[id]">) {
  const utilisateur = await exigerManager();
  const { id } = await params;

  const contenu = await DetailTache({
    tacheId: id,
    utilisateur: { id: utilisateur.id, role: utilisateur.role },
    retour: "/manager/taches",
  });
  if (!contenu) notFound();

  return contenu;
}
