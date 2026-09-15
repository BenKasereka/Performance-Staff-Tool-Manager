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
import { Textarea } from "@/components/ui/textarea";

export function BilanQualitatif({
  missionId,
  bilan,
}: {
  missionId: string;
  bilan: string | null;
}) {
  const { erreur, enAttente, soumettre } = useFormulaireAction(
    enregistrerBilanQualitatif,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bilan qualitatif du manager</CardTitle>
        <CardDescription>
          Points forts de l&apos;équipe, points d&apos;amélioration,
          recommandations. Ce texte constitue une section du rapport de fin de
          mission et reste modifiable avant l&apos;export définitif.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={soumettre} className="space-y-3">
          <input type="hidden" name="missionId" value={missionId} />
          <Textarea
            name="bilan"
            rows={8}
            defaultValue={bilan ?? ""}
            placeholder="L'équipe a tenu les délais sur la phase de cadrage…"
          />
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
