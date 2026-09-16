/**
 * Sections narratives du rapport de fin de mission dont le manager choisit
 * l'inclusion et l'ordre. La page de garde et l'annexe restent fixes
 * (toujours en première/dernière position) ; les rubriques complémentaires
 * et l'historique des prolongations restent conditionnés par la présence de
 * données (ils prennent simplement la position choisie pour "rubriques" /
 * "prolongations" quand ils s'appliquent).
 */
export type CleSectionMandat =
  | "intro"
  | "realisations"
  | "suspens"
  | "rh"
  | "performance"
  | "rubriques"
  | "checklist"
  | "prolongations"
  | "informations_pratiques"
  | "bilan_qualitatif"
  | "conclusion";

export const LIBELLES_SECTION_MANDAT: Record<CleSectionMandat, string> = {
  intro: "Introduction et contexte de la mission",
  realisations: "Grandes réalisations",
  suspens: "Récap des activités et priorités en suspens",
  rh: "Ressources humaines",
  performance: "Performance de l'équipe",
  rubriques: "Rubriques complémentaires",
  checklist: "Checklist de passation et priorités",
  prolongations: "Historique des prolongations",
  informations_pratiques: "Informations pratiques",
  bilan_qualitatif: "Bilan qualitatif du manager",
  conclusion: "Conclusion et remerciements",
};

export const ORDRE_SECTIONS_PAR_DEFAUT: CleSectionMandat[] = [
  "intro",
  "realisations",
  "suspens",
  "rh",
  "performance",
  "rubriques",
  "checklist",
  "prolongations",
  "informations_pratiques",
  "bilan_qualitatif",
  "conclusion",
];

const CLES_VALIDES = new Set<string>(ORDRE_SECTIONS_PAR_DEFAUT);

function estCleSection(valeur: string): valeur is CleSectionMandat {
  return CLES_VALIDES.has(valeur);
}

/**
 * Valide une liste de clés soumise par un formulaire : ignore les clés
 * inconnues et déduplique, sans en rajouter — une section absente est une
 * exclusion volontaire du manager, pas un oubli à corriger.
 */
export function validerOrdreSections(valeurs: string[] | undefined | null): CleSectionMandat[] {
  return [...new Set((valeurs ?? []).filter(estCleSection))];
}

/**
 * Résout la configuration à afficher (édition) ou à générer (PDF/Excel) :
 * une liste vide en base signifie « jamais configuré », donc l'ordre par
 * défaut complet — pas un rapport volontairement vidé de tout contenu.
 */
export function resoudreOrdreSections(valeurs: string[] | undefined | null): CleSectionMandat[] {
  const validees = validerOrdreSections(valeurs);
  return validees.length > 0 ? validees : ORDRE_SECTIONS_PAR_DEFAUT;
}
