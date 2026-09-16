import Link from "next/link";

import { Blob } from "@/components/blob";
import { FormulaireOubli } from "./formulaire-oubli";

export default function PageMotDePasseOublie() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
      <Blob className="absolute -top-24 -left-28 size-80 text-primary/[0.08]" />
      <Blob className="absolute -right-24 -bottom-28 size-96 text-info/[0.10] rotate-45" />

      <div className="relative w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Mot de passe oublié
          </h1>
          <p className="text-sm text-muted-foreground">
            Indiquez votre email : si un compte existe, vous recevrez un lien
            pour choisir un nouveau mot de passe.
          </p>
        </div>

        <FormulaireOubli />

        <p className="text-center text-sm">
          <Link
            href="/connexion"
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
