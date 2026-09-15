"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

export type ResultatAction = { erreur?: string; succes?: string } | undefined;

type ActionServeur = (
  etat: ResultatAction,
  donnees: FormData,
) => Promise<ResultatAction>;

/**
 * Soumission de formulaire avec retour d'erreur et notification de succès.
 *
 * Remplace `useActionState` + `useEffect` : réagir au succès depuis un effet
 * déclenche une cascade de rendus (react-hooks/set-state-in-effect). Ici la
 * fermeture du dialogue se fait dans la continuation de l'action.
 */
export function useFormulaireAction(
  action: ActionServeur,
  auSucces?: () => void,
) {
  const [erreur, setErreur] = useState<string>();
  const [enAttente, demarrer] = useTransition();

  function soumettre(donnees: FormData) {
    demarrer(async () => {
      const resultat = await action(undefined, donnees);

      if (resultat?.erreur) {
        setErreur(resultat.erreur);
        return;
      }

      setErreur(undefined);
      if (resultat?.succes) toast.success(resultat.succes);
      auSucces?.();
    });
  }

  return { erreur, enAttente, soumettre };
}
