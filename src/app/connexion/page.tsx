import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { FormulaireConnexion } from "./formulaire-connexion";

export default async function PageConnexion({
  searchParams,
}: PageProps<"/connexion">) {
  const params = await searchParams;
  const compteCree = params["compte-cree"] === "1";
  const aucunUtilisateur = (await prisma.user.count()) === 0;

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Suivi de Performance d&apos;Équipe
          </h1>
          <p className="text-sm text-muted-foreground">
            Connectez-vous pour accéder à votre espace.
          </p>
        </div>

        {compteCree && (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            Compte manager créé. Vous pouvez maintenant vous connecter.
          </p>
        )}

        <FormulaireConnexion />

        {aucunUtilisateur && (
          <p className="text-center text-sm text-muted-foreground">
            Première utilisation ?{" "}
            <Link
              href="/inscription"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Créer le compte manager
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
