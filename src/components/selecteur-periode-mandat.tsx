"use client";

import { usePathname, useRouter } from "next/navigation";

import { versValeurInput } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SelecteurPeriodeMandat({
  debut,
  fin,
}: {
  debut: Date;
  fin: Date;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function soumettre(donnees: FormData) {
    const params = new URLSearchParams();
    params.set("debut", String(donnees.get("debut")));
    params.set("fin", String(donnees.get("fin")));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form action={soumettre} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="debut">Début du mandat</Label>
        <Input
          id="debut"
          name="debut"
          type="date"
          defaultValue={versValeurInput(debut)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fin">Fin du mandat</Label>
        <Input
          id="fin"
          name="fin"
          type="date"
          defaultValue={versValeurInput(fin)}
          required
        />
      </div>
      <Button type="submit" variant="outline">
        Charger cette période
      </Button>
    </form>
  );
}
