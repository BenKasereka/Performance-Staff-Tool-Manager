"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { sauvegarderRapportMandat } from "@/lib/actions/rapport-mandat";
import { useFormulaireAction } from "@/lib/use-formulaire-action";
import {
  LIBELLES_SECTION_MANDAT,
  ORDRE_SECTIONS_PAR_DEFAUT,
  type CleSectionMandat,
} from "@/lib/rapports/sections-mandat";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type BilanMandatEditable = {
  periodeDebut: string;
  periodeFin: string;
  bilanContexte: string;
  bilanQualitatif: string;
  bilanPointsForts: string;
  bilanDefis: string;
  bilanRecommandations: string;
  bilanConclusion: string;
  informationsPratiques: string;
  rubriques: { titre: string; contenu: string }[];
  sectionsIncluses: CleSectionMandat[];
};

type SectionConfig = { cle: CleSectionMandat; incluse: boolean };

/** Place les sections choisies en tête dans l'ordre voulu, puis les sections
 * exclues à la suite (dans l'ordre par défaut) pour qu'elles restent
 * réactivables sans tout reconfigurer. */
function ordreInitial(sectionsIncluses: CleSectionMandat[]): SectionConfig[] {
  const incluses =
    sectionsIncluses.length > 0 ? sectionsIncluses : ORDRE_SECTIONS_PAR_DEFAUT;
  const restantes = ORDRE_SECTIONS_PAR_DEFAUT.filter(
    (cle) => !incluses.includes(cle),
  );
  return [...incluses, ...restantes].map((cle) => ({
    cle,
    incluse: incluses.includes(cle),
  }));
}

export function FormulaireRapportMandat({
  valeurs,
}: {
  valeurs: BilanMandatEditable;
}) {
  const [rubriques, setRubriques] = useState(valeurs.rubriques);
  const [sections, setSections] = useState<SectionConfig[]>(() =>
    ordreInitial(valeurs.sectionsIncluses),
  );
  const { erreur, enAttente, soumettre } = useFormulaireAction(
    sauvegarderRapportMandat,
  );

  function ajouterRubrique() {
    setRubriques((r) => [...r, { titre: "", contenu: "" }]);
  }

  function supprimerRubrique(index: number) {
    setRubriques((r) => r.filter((_, i) => i !== index));
  }

  function modifierRubrique(index: number, champ: "titre" | "contenu", valeur: string) {
    setRubriques((r) =>
      r.map((rub, i) => (i === index ? { ...rub, [champ]: valeur } : rub)),
    );
  }

  function basculerSection(index: number, incluse: boolean) {
    setSections((s) => s.map((sec, i) => (i === index ? { ...sec, incluse } : sec)));
  }

  function deplacerSection(index: number, direction: -1 | 1) {
    setSections((s) => {
      const cible = index + direction;
      if (cible < 0 || cible >= s.length) return s;
      const copie = [...s];
      [copie[index], copie[cible]] = [copie[cible], copie[index]];
      return copie;
    });
  }

  function reinitialiserSections() {
    setSections(ORDRE_SECTIONS_PAR_DEFAUT.map((cle) => ({ cle, incluse: true })));
  }

  function envoyer(donnees: FormData) {
    donnees.set(
      "rubriques",
      JSON.stringify(rubriques.filter((r) => r.titre.trim())),
    );
    donnees.set(
      "sectionsIncluses",
      JSON.stringify(sections.filter((s) => s.incluse).map((s) => s.cle)),
    );
    soumettre(donnees);
  }

  return (
    <form action={envoyer} className="space-y-6">
      <input type="hidden" name="periodeDebut" value={valeurs.periodeDebut} />
      <input type="hidden" name="periodeFin" value={valeurs.periodeFin} />

      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Structure du rapport</h3>
          <Button type="button" variant="outline" size="sm" onClick={reinitialiserSections}>
            Ordre par défaut
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Choisissez les sections à inclure et leur ordre d&apos;apparition
          dans le document généré. La page de garde et l&apos;annexe des
          tâches restent toujours présentes.
        </p>

        <div className="space-y-1.5">
          {sections.map((s, i) => (
            <div
              key={s.cle}
              className="flex items-center gap-3 rounded-md border p-2.5"
            >
              <Checkbox
                checked={s.incluse}
                onCheckedChange={(v) => basculerSection(i, v === true)}
                aria-label={`Inclure la section ${LIBELLES_SECTION_MANDAT[s.cle]}`}
              />
              <span
                className={
                  "flex-1 text-sm " +
                  (s.incluse ? "" : "text-muted-foreground line-through")
                }
              >
                {LIBELLES_SECTION_MANDAT[s.cle]}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Monter cette section"
                disabled={i === 0}
                onClick={() => deplacerSection(i, -1)}
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Descendre cette section"
                disabled={i === sections.length - 1}
                onClick={() => deplacerSection(i, 1)}
              >
                <ArrowDown />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bilanContexte">Contexte de la mission</Label>
        <Textarea
          id="bilanContexte"
          name="bilanContexte"
          defaultValue={valeurs.bilanContexte}
          rows={3}
          placeholder="Dans quel cadre ce mandat s'est-il déroulé ?"
        />
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Rubriques complémentaires</h3>
          <Button type="button" variant="outline" size="sm" onClick={ajouterRubrique}>
            <Plus /> Ajouter une rubrique
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Sections libres selon le type de mission (ex. gestion des stocks,
          achats, transport pour une mission logistique).
        </p>

        {rubriques.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune rubrique ajoutée.</p>
        ) : (
          <div className="space-y-4">
            {rubriques.map((r, i) => (
              <div key={i} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={r.titre}
                    onChange={(e) => modifierRubrique(i, "titre", e.target.value)}
                    placeholder="Titre de la rubrique (ex. Gestion des stocks)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Supprimer cette rubrique"
                    onClick={() => supprimerRubrique(i)}
                  >
                    <Trash2 />
                  </Button>
                </div>
                <Textarea
                  value={r.contenu}
                  onChange={(e) => modifierRubrique(i, "contenu", e.target.value)}
                  rows={3}
                  placeholder="Contenu de cette rubrique"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="informationsPratiques">Informations pratiques</Label>
        <Textarea
          id="informationsPratiques"
          name="informationsPratiques"
          defaultValue={valeurs.informationsPratiques}
          rows={3}
          placeholder="Contacts, accès, procédures utiles à la personne qui prend la suite — jamais de mot de passe ici."
        />
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Bilan qualitatif du manager</h3>
        <div className="space-y-1.5">
          <Label htmlFor="bilanQualitatif">Synthèse générale</Label>
          <Textarea
            id="bilanQualitatif"
            name="bilanQualitatif"
            defaultValue={valeurs.bilanQualitatif}
            rows={3}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bilanPointsForts">Points forts de l&apos;équipe</Label>
          <Textarea
            id="bilanPointsForts"
            name="bilanPointsForts"
            defaultValue={valeurs.bilanPointsForts}
            rows={3}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bilanDefis">Défis rencontrés et points d&apos;amélioration</Label>
          <Textarea
            id="bilanDefis"
            name="bilanDefis"
            defaultValue={valeurs.bilanDefis}
            rows={3}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bilanRecommandations">Recommandations pour la suite</Label>
          <Textarea
            id="bilanRecommandations"
            name="bilanRecommandations"
            defaultValue={valeurs.bilanRecommandations}
            rows={3}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bilanConclusion">Conclusion et remerciements</Label>
        <Textarea
          id="bilanConclusion"
          name="bilanConclusion"
          defaultValue={valeurs.bilanConclusion}
          rows={3}
        />
      </div>

      {erreur && <p className="text-sm text-destructive">{erreur}</p>}

      <Button type="submit" disabled={enAttente}>
        {enAttente ? "Enregistrement…" : "Enregistrer le bilan"}
      </Button>
    </form>
  );
}
