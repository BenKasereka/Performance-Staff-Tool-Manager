import { notFound } from "next/navigation";

import { exigerUtilisateur } from "@/lib/auth-guards";
import { DetailTache } from "@/components/detail-tache";

export const dynamic = "force-dynamic";

export default async function PageDetailTacheMembre({
  params,
}: PageProps<"/mon-espace/taches/[id]">) {
  const utilisateur = await exigerUtilisateur();
  const { id } = await params;

  // DetailTache renvoie null si la tâche ne concerne pas cet utilisateur :
  // un membre ne peut donc pas ouvrir la tâche d'un collègue par son URL.
  const contenu = await DetailTache({
    tacheId: id,
    utilisateur: { id: utilisateur.id, role: utilisateur.role },
    retour: "/mon-espace/taches",
  });
  if (!contenu) notFound();

  return contenu;
}
