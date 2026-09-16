import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { Blob } from "@/components/blob";
import { FormulaireConnexion } from "./formulaire-connexion";

export default async function PageConnexion({
  searchParams,
}: PageProps<"/connexion">) {
  const params = await searchParams;
  const compteCree = params["compte-cree"] === "1";
  const motDePasseReinitialise = params["mot-de-passe-reinitialise"] === "1";
  const aucunUtilisateur = (await prisma.user.count()) === 0;

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
      <Blob className="absolute -top-24 -left-28 size-80 text-primary/[0.08]" />
      <Blob className="absolute -right-24 -bottom-28 size-96 text-accent/60 rotate-45" />

      <div className="relative w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Suivi de Performance d&apos;Équipe
          </h1>
          <p className="text-sm text-muted-foreground">
            Connectez-vous pour accéder à votre espace.
          </p>
        </div>

        {compteCree && (
          <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
            Compte manager créé. Vous pouvez maintenant vous connecter.
          </p>
        )}

        {motDePasseReinitialise && (
          <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
            Mot de passe modifié. Vous pouvez maintenant vous connecter.
          </p>
        )}

        <FormulaireConnexion />

        <p className="text-center text-sm">
          <Link
            href="/mot-de-passe-oublie"
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Mot de passe oublié ?
          </Link>
        </p>

        {process.env.DEMO_PUBLIQUE === "1" && (
          <div className="space-y-2 rounded-lg border border-dashed p-4 text-sm">
            <p className="font-medium">Démonstration publique</p>
            <p className="text-muted-foreground">
              Les données sont fictives. Connectez-vous avec l&apos;un de ces
              comptes, mot de passe{" "}
              <code className="rounded bg-muted px-1 py-0.5">demo1234</code>.
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Manager</span> —{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  manager@demo.fr
                </code>
              </li>
              <li>
                <span className="font-medium text-foreground">Membre</span> —{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  claire.dubois@demo.fr
                </code>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Le compte manager donne accès au classement de performance et aux
              rapports ; le compte membre montre l&apos;espace personnel, sans
              aucune comparaison aux collègues.
            </p>
          </div>
        )}

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
