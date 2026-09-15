import { Document, Page, Text, View } from "@react-pdf/renderer";

import { formaterDate, formaterDateHeure } from "@/lib/dates";
import { LIBELLES_CRITERE } from "@/lib/kpi";
import type { RapportIndividuel } from "./donnees";
import { CourbePdf } from "./graphique-pdf";
import { ALERTE, ENCRE_MUETTE, styles } from "./styles-pdf";

const COLONNES = [3.2, 1.6, 1.1, 1.1, 0.7] as const;

export function PdfIndividuel({ rapport }: { rapport: RapportIndividuel }) {
  const { membre, periode, score, taches } = rapport;

  const realisees = taches.filter((t) => t.statut === "Terminée");
  const manquees = taches.filter((t) => t.statut === "En retard");

  const criteres = score
    ? [
        { cle: "tauxCompletion", valeur: `${score.tauxCompletion} %` },
        { cle: "ponctualite", valeur: `${score.ponctualite} %` },
        {
          cle: "noteQualite",
          valeur: score.qualiteNonEvaluee
            ? "non évalué"
            : `${score.noteMoyenneSur5} / 5`,
        },
        { cle: "volume", valeur: String(score.volume) },
      ]
    : [];

  return (
    <Document
      title={`Évaluation ${membre.nom} — ${periode.libelle}`}
      author="Suivi de Performance d'Équipe"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.surtitre}>Rapport d&apos;évaluation individuel</Text>
        <Text style={styles.titre}>{membre.nom}</Text>
        <Text style={styles.sousTitre}>
          {[membre.poste, membre.service].filter(Boolean).join(" · ") ||
            "Poste non renseigné"}
          {membre.superieur ? ` · rattaché à ${membre.superieur}` : ""}
        </Text>
        <Text style={styles.sousTitre}>
          Période : {periode.libelle} ({formaterDate(periode.debut)} –{" "}
          {formaterDate(periode.fin)})
        </Text>

        {score ? (
          <>
            <View style={styles.section}>
              <Text style={styles.titreSection}>Score global</Text>
              <View style={styles.rangee}>
                <View style={styles.carte}>
                  <Text style={styles.carteLibelle}>Score sur 100</Text>
                  <Text style={styles.carteValeur}>{score.scoreGlobal}</Text>
                </View>
                {criteres.map((c) => (
                  <View key={c.cle} style={styles.carte}>
                    <Text style={styles.carteLibelle}>
                      {LIBELLES_CRITERE[c.cle as keyof typeof LIBELLES_CRITERE]}
                    </Text>
                    <Text style={styles.carteValeur}>{c.valeur}</Text>
                  </View>
                ))}
              </View>

              {score.qualiteNonEvaluee && (
                <Text style={[styles.paragraphe, { marginTop: 8, fontSize: 9 }]}>
                  Aucune tâche terminée n&apos;a été notée sur la période. Le
                  critère qualité est donc retiré du score et les poids sont
                  répartis sur les trois autres critères.
                </Text>
              )}

              <Text style={[styles.paragraphe, { marginTop: 8 }]}>
                {score.nbTachesTerminees} tâche
                {score.nbTachesTerminees > 1 ? "s" : ""} terminée
                {score.nbTachesTerminees > 1 ? "s" : ""} sur{" "}
                {score.nbTachesExigibles} déjà échue
                {score.nbTachesExigibles > 1 ? "s" : ""} ·{" "}
                {score.nbTachesTotal} assignée
                {score.nbTachesTotal > 1 ? "s" : ""} au total
                {score.nbTachesEnRetard > 0
                  ? ` · ${score.nbTachesEnRetard} encore en retard`
                  : ""}
                .
              </Text>
            </View>

            {rapport.evolution.length > 1 && (
              <View style={styles.section}>
                <Text style={styles.titreSection}>Évolution du score</Text>
                <CourbePdf
                  points={rapport.evolution.map((p) => ({
                    periode: p.periode,
                    valeur: p.score,
                  }))}
                />
              </View>
            )}
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.paragraphe}>
              Aucune donnée de performance sur cette période.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.titreSection}>
            Tâches réalisées ({realisees.length})
          </Text>
          {realisees.length === 0 ? (
            <Text style={styles.paragraphe}>
              Aucune tâche terminée sur la période.
            </Text>
          ) : (
            <Tableau lignes={realisees} />
          )}
        </View>

        {manquees.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.titreSection}>
              Tâches non abouties ({manquees.length})
            </Text>
            <Tableau lignes={manquees} />
          </View>
        )}

        <PiedDePage genereLe={rapport.genereLe} />
      </Page>
    </Document>
  );
}

function Tableau({
  lignes,
}: {
  lignes: RapportIndividuel["taches"];
}) {
  return (
    <View style={styles.tableau}>
      <View style={styles.enTete}>
        <Text style={[styles.celluleEnTete, { flex: COLONNES[0] }]}>Tâche</Text>
        <Text style={[styles.celluleEnTete, { flex: COLONNES[1] }]}>Mission</Text>
        <Text style={[styles.celluleEnTete, { flex: COLONNES[2] }]}>Échéance</Text>
        <Text style={[styles.celluleEnTete, { flex: COLONNES[3] }]}>Statut</Text>
        <Text
          style={[styles.celluleEnTete, { flex: COLONNES[4], textAlign: "right" }]}
        >
          Note
        </Text>
      </View>

      {lignes.map((t, i) => (
        <View key={`${t.titre}-${i}`} style={styles.ligne} wrap={false}>
          <Text style={[styles.cellule, { flex: COLONNES[0] }]}>{t.titre}</Text>
          <Text
            style={[styles.cellule, { flex: COLONNES[1], color: ENCRE_MUETTE }]}
          >
            {t.mission}
          </Text>
          <Text style={[styles.cellule, { flex: COLONNES[2] }]}>
            {t.echeance}
          </Text>
          <Text
            style={[
              styles.cellule,
              { flex: COLONNES[3] },
              t.enRetard ? { color: ALERTE } : {},
            ]}
          >
            {t.statut}
          </Text>
          <Text style={[styles.celluleDroite, { flex: COLONNES[4] }]}>
            {t.noteQualite ? `${t.noteQualite}/5` : "—"}
          </Text>
        </View>
      ))}
    </View>
  );
}

function PiedDePage({ genereLe }: { genereLe: Date }) {
  return (
    <View style={styles.pied} fixed>
      <Text style={styles.confidentiel}>
        Document confidentiel — usage managérial
      </Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `${formaterDateHeure(genereLe)} · Page ${pageNumber} sur ${totalPages}`
        }
      />
    </View>
  );
}
