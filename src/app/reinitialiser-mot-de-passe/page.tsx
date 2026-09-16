import Link from "next/link";

import { Blob } from "@/components/blob";
import { FormulaireReinitialisation } from "./formulaire-reinitialisation";

export default async function PageReinitialiserMotDePasse({
  searchParams,
}: PageProps<"/reinitialiser-mot-de-passe">) {
  const params = await searchParams;
  const jeton = typeof params.jeton === "string" ? params.jeton : "";

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
      <Blob className="absolute -top-24 -left-28 size-80 text-primary/[0.08]" />
      <Blob className="absolute -right-24 -bottom-28 size-96 text-info/[0.10] rotate-45" />

      <div className="relative w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Choisir un nouveau mot de passe
          </h1>
          <p className="text-sm text-muted-foreground">
            Ce lien n&apos;est valable qu&apos;une heure et qu&apos;une seule
            fois.
          </p>
        </div>

        {jeton ? (
          <FormulaireReinitialisation jeton={jeton} />
        ) : (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Lien invalide ou incomplet.{" "}
            <Link href="/mot-de-passe-oublie" className="underline underline-offset-4">
              Demandez-en un nouveau
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
