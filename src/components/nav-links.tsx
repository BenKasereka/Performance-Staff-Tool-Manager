"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

type Lien = { href: string; libelle: string };

/**
 * Le lien actif est celui dont le href correspond exactement, ou à défaut le
 * plus long préfixe de route — pour qu'une sous-page (ex. la fiche d'une
 * mission) mette en avant l'entrée de menu parente sans jamais en activer
 * deux à la fois.
 */
function trouverLienActif(pathname: string, liens: Lien[]) {
  const correspondances = liens.filter(
    (l) => pathname === l.href || pathname.startsWith(`${l.href}/`),
  );
  if (correspondances.length === 0) return undefined;
  return correspondances.reduce((plusLong, l) =>
    l.href.length > plusLong.href.length ? l : plusLong,
  );
}

export function NavLinks({
  liens,
  className,
  linkClassName,
}: {
  liens: Lien[];
  className?: string;
  linkClassName?: string;
}) {
  const pathname = usePathname();
  const lienActif = trouverLienActif(pathname, liens);

  return (
    <nav className={className}>
      {liens.map((lien) => {
        const actif = lien.href === lienActif?.href;
        return (
          <Button
            key={lien.href}
            variant={actif ? "secondary" : "ghost"}
            size="sm"
            aria-current={actif ? "page" : undefined}
            asChild
          >
            <Link href={lien.href} className={linkClassName}>
              {lien.libelle}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
