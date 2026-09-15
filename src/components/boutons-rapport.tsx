import { Button } from "@/components/ui/button";

type Props = {
  /** Base de l'URL de rapport, sans le paramètre de format. */
  base: string;
  libelle?: string;
};

export function BoutonsRapport({ base, libelle = "Rapport" }: Props) {
  const separateur = base.includes("?") ? "&" : "?";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" asChild>
        {/* Téléchargement direct : la route renvoie un Content-Disposition. */}
        <a href={`${base}${separateur}format=pdf`}>{libelle} PDF</a>
      </Button>
      <Button size="sm" variant="outline" asChild>
        <a href={`${base}${separateur}format=excel`}>Excel</a>
      </Button>
    </div>
  );
}
