import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { FormulairePremierManager } from "./formulaire-premier-manager";

// Le nombre de comptes doit être relu à chaque requête, jamais figé au build.
export const dynamic = "force-dynamic";

export default async function PageInscription() {
  // L'inscription libre n'est ouverte que pour créer le tout premier compte manager.
  // Ensuite, seuls les managers créent les comptes des membres.
  if ((await prisma.user.count()) > 0) {
    redirect("/connexion");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Créer le compte manager
          </h1>
          <p className="text-sm text-muted-foreground">
            Ce compte administrera l&apos;équipe, les missions et les
            évaluations.
          </p>
        </div>

        <FormulairePremierManager />
      </div>
    </main>
  );
}
