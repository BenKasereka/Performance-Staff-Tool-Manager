import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Blob } from "@/components/blob";
import { FormulaireChangement } from "./formulaire-changement";

export default async function PageChangerMotDePasse() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const utilisateur = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { doitChangerMotDePasse: true, role: true },
  });
  if (!utilisateur) redirect("/connexion");

  const accueil = utilisateur.role === "MANAGER" ? "/manager" : "/mon-espace";

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
      <Blob className="absolute -top-24 -left-28 size-80 text-primary/[0.08]" />
      <Blob className="absolute -right-24 -bottom-28 size-96 text-info/[0.10] rotate-45" />

      <div className="relative w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Changer le mot de passe
          </h1>
          {utilisateur.doitChangerMotDePasse ? (
            <p className="text-sm text-muted-foreground">
              Votre mot de passe a été défini par votre manager. Choisissez-en
              un que vous seul connaissez avant de continuer.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Choisissez un nouveau mot de passe pour votre compte.
            </p>
          )}
        </div>

        <FormulaireChangement />

        {!utilisateur.doitChangerMotDePasse && (
          <p className="text-center text-sm">
            <Link
              href={accueil}
              className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              ← Retour
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
