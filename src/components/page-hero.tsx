import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Bandeau de titre pleine largeur (vert forêt), utilisé en tête de chaque
 * page de l'application. Le `left-1/2 -mx-[50vw]` sort la bande de la
 * colonne centrée (max-w-7xl) du layout sans dépendre de ses marges.
 */
export function PageHero({
  titre,
  description,
  actions,
  retour,
  className,
}: {
  titre: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  retour?: { href: string; libelle: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "section-heros relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-background text-foreground",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-start justify-between gap-3 px-4 py-6">
        <div>
          {retour && (
            <Link
              href={retour.href}
              className="mb-1 inline-block text-sm text-foreground/70 hover:text-foreground hover:underline"
            >
              ← {retour.libelle}
            </Link>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">{titre}</h1>
          {description && (
            <p className="text-sm text-foreground/80">{description}</p>
          )}
        </div>
        {actions}
      </div>
    </div>
  );
}
