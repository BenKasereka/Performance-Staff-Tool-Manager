"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { decaler, libelleIntervalle, versValeurInput, type Granularite } from "@/lib/dates";
import { Button } from "@/components/ui/button";

const GRANULARITES: { valeur: Granularite; libelle: string }[] = [
  { valeur: "jour", libelle: "Aujourd'hui" },
  { valeur: "semaine", libelle: "Cette semaine" },
  { valeur: "mois", libelle: "Ce mois" },
];

export function SelecteurPeriode({
  granularite,
  reference,
}: {
  granularite: Granularite;
  reference: Date;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function naviguer(modif: { g?: Granularite; d?: Date }) {
    const params = new URLSearchParams(searchParams.toString());
    if (modif.g) params.set("g", modif.g);
    if (modif.d) params.set("d", versValeurInput(modif.d));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-md border p-0.5">
        {GRANULARITES.map((g) => (
          <Button
            key={g.valeur}
            variant={granularite === g.valeur ? "secondary" : "ghost"}
            size="sm"
            onClick={() => naviguer({ g: g.valeur, d: new Date() })}
          >
            {g.libelle}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          aria-label="Période précédente"
          onClick={() => naviguer({ d: decaler(granularite, reference, -1) })}
        >
          ←
        </Button>
        <span className="min-w-44 text-center text-sm font-medium capitalize">
          {libelleIntervalle(granularite, reference)}
        </span>
        <Button
          variant="outline"
          size="sm"
          aria-label="Période suivante"
          onClick={() => naviguer({ d: decaler(granularite, reference, 1) })}
        >
          →
        </Button>
      </div>
    </div>
  );
}
