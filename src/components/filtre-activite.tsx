"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TOUTES = "__TOUTES__";

export function FiltreActivite({
  missions,
  valeur,
}: {
  missions: { id: string; nom: string }[];
  valeur: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function definir(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v && v !== TOUTES) params.set("mission", v);
    else params.delete("mission");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={valeur || TOUTES} onValueChange={definir}>
      <SelectTrigger aria-label="Filtrer par activité" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TOUTES}>Toutes les activités</SelectItem>
        {missions.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.nom}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
