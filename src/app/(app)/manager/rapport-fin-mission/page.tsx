import { subYears } from "date-fns";

import { exigerManager } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { construireRapportMandat } from "@/lib/rapports/donnees";
import { validerOrdreSections } from "@/lib/rapports/sections-mandat";
import { formaterDate, versValeurInput } from "@/lib/dates";
import { BoutonsRapport } from "@/components/boutons-rapport";
import { PageHero } from "@/components/page-hero";
import { SelecteurPeriodeMandat } from "@/components/selecteur-periode-mandat";
import { FormulaireRapportMandat } from "@/components/formulaire-rapport-mandat";
import { StatTile } from "@/components/stat-tile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PageRapportFinMission({
  searchParams,
}: PageProps<"/manager/rapport-fin-mission">) {
  const manager = await exigerManager();
  const params = await searchParams;

  const maintenant = new Date();
  const periodeDebut = params.debut
    ? new Date(String(params.debut))
    : subYears(maintenant, 1);
  const periodeFin = params.fin ? new Date(String(params.fin)) : maintenant;

  const [rapport, existant] = await Promise.all([
    construireRapportMandat(manager.id, periodeDebut, periodeFin),
    prisma.rapportMandat.findFirst({
      where: { managerId: manager.id, periodeDebut, periodeFin },
      include: { rubriques: { orderBy: { ordre: "asc" } } },
    }),
  ]);

  const query = `debut=${versValeurInput(periodeDebut)}&fin=${versValeurInput(periodeFin)}`;

  return (
    <div className="space-y-6">
      <PageHero
        titre="Rapport de fin de mission"
        description="Couvre tout votre mandat sur la période choisie : toutes vos activités et celles de votre équipe, pas une seule activité isolée."
        actions={
          <BoutonsRapport
            base={`/api/rapports/mandat?${query}`}
            libelle="Rapport de fin de mission"
          />
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Période du mandat</CardTitle>
          <CardDescription>
            Définissez-la avant de rédiger le bilan ci-dessous — changer la
            période recharge la page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SelecteurPeriodeMandat debut={periodeDebut} fin={periodeFin} />
        </CardContent>
      </Card>

      {!rapport ? (
        <p className="text-sm text-destructive">
          Impossible de charger les données pour cette période.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile libelle="Équipe couverte" valeur={rapport.equipe.length} tone="info" />
            <StatTile
              libelle="Activités couvertes"
              valeur={rapport.activites.length}
              tone="info"
            />
            <StatTile
              libelle="Tâches sur la période"
              valeur={rapport.chiffres.total}
              tone="neutral"
            />
            <StatTile
              libelle="Encore en suspens"
              valeur={rapport.enSuspens.length}
              tone={rapport.enSuspens.length > 0 ? "warning" : "neutral"}
            />
          </div>

          {rapport.equipe.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucun collaborateur rattaché à votre organigramme pour le
              moment : rendez-vous dans « Équipe » pour définir qui vous est
              rattaché avant de générer ce rapport.
            </p>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Bilan du {formaterDate(periodeDebut)} au{" "}
                {formaterDate(periodeFin)}
              </CardTitle>
              <CardDescription>
                Ces textes sont repris tels quels dans le rapport téléchargé.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormulaireRapportMandat
                valeurs={{
                  periodeDebut: versValeurInput(periodeDebut),
                  periodeFin: versValeurInput(periodeFin),
                  bilanContexte: existant?.bilanContexte ?? "",
                  bilanQualitatif: existant?.bilanQualitatif ?? "",
                  bilanPointsForts: existant?.bilanPointsForts ?? "",
                  bilanDefis: existant?.bilanDefis ?? "",
                  bilanRecommandations: existant?.bilanRecommandations ?? "",
                  bilanConclusion: existant?.bilanConclusion ?? "",
                  informationsPratiques: existant?.informationsPratiques ?? "",
                  rubriques: (existant?.rubriques ?? []).map((r) => ({
                    titre: r.titre,
                    contenu: r.contenu ?? "",
                  })),
                  sectionsIncluses: validerOrdreSections(
                    existant?.sectionsIncluses,
                  ),
                }}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
