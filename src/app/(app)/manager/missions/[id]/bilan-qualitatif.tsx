"use client";

import { enregistrerBilanQualitatif } from "@/lib/actions/missions";
import { useFormulaireAction } from "@/lib/use-formulaire-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type Bilan = {
  contexte: string | null;
  synthese: string | null;
  pointsForts: string | null;
  defis: string | null;
  recommandations: string | null;
  conclusion: string | null;
};

const RUBRIQUES = [
  {
    champ: "contexte",
    label: "Contexte et objet de l'activité",
    aide: "Pourquoi cette activité a été lancée, dans quel environnement, avec quelles contraintes.",
    exemple:
      "La refonte répondait à une hausse des réclamations clients sur le parcours de commande…",
    lignes: 5,
  },
  {
    champ: "synthese",
    label: "Synthèse générale",
    aide: "Votre lecture d'ensemble du déroulement de l'activité.",
    exemple: "L'équipe a tenu les délais sur la phase de cadrage…",
    lignes: 5,
  },
  {
    champ: "pointsForts",
    label: "Points forts de l'équipe",
    aide: "Ce qui a bien fonctionné et mérite d'être reconduit.",
    exemple: "Réactivité sur les incidents, montée en autonomie de…",
    lignes: 4,
  },
  {
    champ: "defis",
    label: "Défis rencontrés et points d'amélioration",
    aide: "Les obstacles réels et ce qui reste perfectible.",
    exemple: "Les validations externes ont décalé deux livrables…",
    lignes: 4,
  },
  {
    champ: "recommandations",
    label: "Recommandations pour la suite",
    aide: "Ce que vous conseillez à celui ou celle qui reprendra le sujet.",
    exemple: "Maintenir le point hebdomadaire, sécuriser l'accès aux…",
    lignes: 4,
  },
  {
    champ: "conclusion",
    label: "Conclusion et remerciements",
    aide: "Le mot de clôture du document.",
    exemple: "Je remercie l'ensemble de l'équipe pour son engagement…",
    lignes: 4,
  },
] as const;

export function BilanQualitatif({
  missionId,
  bilan,
}: {
  missionId: string;
  bilan: Bilan;
}) {
  const { erreur, enAttente, soumettre } = useFormulaireAction(
    enregistrerBilanQualitatif,
  );

  const remplies = RUBRIQUES.filter((r) => bilan[r.champ]).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bilan qualitatif du manager</CardTitle>
        <CardDescription>
          Ces six rubriques forment les sections rédigées du rapport de
          clôture d&apos;activité. Les parties laissées vides apparaissent comme « non
          renseigné » dans le PDF et restent complétables ensuite.{" "}
          <span className="font-medium text-foreground">
            {remplies} / {RUBRIQUES.length} renseignées.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={soumettre} className="space-y-5">
          <input type="hidden" name="missionId" value={missionId} />

          {RUBRIQUES.map((rubrique) => (
            <div key={rubrique.champ} className="space-y-2">
              <Label htmlFor={rubrique.champ}>{rubrique.label}</Label>
              <p className="text-xs text-muted-foreground">{rubrique.aide}</p>
              <Textarea
                id={rubrique.champ}
                name={rubrique.champ}
                rows={rubrique.lignes}
                defaultValue={bilan[rubrique.champ] ?? ""}
                placeholder={rubrique.exemple}
              />
            </div>
          ))}

          {erreur && (
            <p className="text-sm text-destructive" role="alert">
              {erreur}
            </p>
          )}

          <Button type="submit" disabled={enAttente}>
            {enAttente ? "Enregistrement…" : "Enregistrer le bilan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
