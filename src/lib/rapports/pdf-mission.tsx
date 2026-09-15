import { Document, Page, Text, View } from "@react-pdf/renderer";

import { formaterDate, formaterDateHeure } from "@/lib/dates";
import type { RapportMission } from "./donnees";
import { CourbePdf } from "./graphique-pdf";
import { ALERTE, ENCRE_MUETTE, styles } from "./styles-pdf";

/** Synthèse écrite à partir des seuls chiffres, sans jugement inventé. */
function resumeExecutif(r: RapportMission) {
  const { chiffres, mission } = r;

  const appreciation =
    chiffres.tauxCompletion >= 90
      ? "La mission a été menée à son terme sur la quasi-totalité du périmètre prévu."
      : chiffres.tauxCompletion >= 70
        ? "La mission a couvert l'essentiel du périmètre prévu."
        : chiffres.tauxCompletion >= 50
          ? "La mission a couvert une partie du périmètre prévu ; une part notable des tâches n'a pas abouti."
          : "Une majorité des tâches planifiées n'a pas abouti sur la durée de la mission.";

  const delais =
    chiffres.ponctualiteMoyenne >= 90
      ? "Les livraisons ont respecté les échéances."
      : chiffres.ponctualiteMoyenne >= 70
        ? "Les échéances ont été globalement tenues, avec quelques dépassements."
        : "Le respect des échéances constitue le principal point faible de la mission.";

  const qualite =
    chiffres.qualiteMoyenne === null
      ? "Aucune note qualité n'a été attribuée, ce qui limite la lecture qualitative de ce bilan."
      : `La qualité moyenne des livrables évaluée par le manager s'établit à ${chiffres.qualiteMoyenne} sur 5.`;

  const prolongation =
    r.prolongations.length > 0
      ? ` La mission a fait l'objet de ${r.prolongations.length} prolongation${r.prolongations.length > 1 ? "s" : ""}, portant son échéance du ${formaterDate(mission.dateFinInitiale)} au ${formaterDate(mission.dateFinActuelle)}.`
      : " La mission s'est tenue dans l'échéance initialement fixée.";

  return `${appreciation} Sur ${chiffres.total} tâches planifiées, ${chiffres.terminees} ont été menées à bien, soit un taux de complétion de ${chiffres.tauxCompletion} %. ${delais} ${qualite}${prolongation}`;
}

export function PdfMission({ rapport }: { rapport: RapportMission }) {
  const { mission, chiffres } = rapport;

  const avecProlongations = rapport.prolongations.length > 0;
  const avecSuspens = rapport.enSuspens.length > 0;

  // La numérotation se construit dans l'ordre réel des sections : une section
  // absente ne doit pas laisser de trou dans le sommaire.
  const plan: { titre: string; page: number }[] = [
    { titre: "Contexte et objet de la mission", page: 2 },
    { titre: "Résumé exécutif", page: 2 },
    { titre: "Vue d'ensemble chiffrée", page: 2 },
    { titre: "Organisation de l'équipe", page: 3 },
    { titre: "Performance par membre", page: 3 },
    ...(avecSuspens
      ? [{ titre: "Activités en suspens à la clôture", page: 4 }]
      : []),
    ...(avecProlongations
      ? [{ titre: "Historique des prolongations", page: 4 }]
      : []),
    { titre: "Bilan qualitatif du manager", page: 5 },
    { titre: "Conclusion et remerciements", page: 5 },
    { titre: "Annexe — liste exhaustive des tâches", page: 6 },
  ];

  const num = (titre: string) =>
    plan.findIndex((s) => s.titre === titre) + 1;

  const entete = `Rapport de fin de mission · ${mission.nom}`;

  return (
    <Document
      title={`Rapport de fin de mission — ${mission.nom}`}
      author="Suivi de Performance d'Équipe"
      subject={`Bilan de la mission ${mission.nom}`}
    >
      {/* ——— Page de garde ——— */}
      <Page size="A4" style={styles.page}>
        <View style={styles.garde}>
          <Text style={styles.surtitre}>Document de bilan</Text>
          <Text style={styles.titreGarde}>RAPPORT DE FIN DE MISSION</Text>
          <Text style={styles.sousTitreGarde}>{mission.nom}</Text>

          <View style={styles.tableauIdentite}>
            <LigneIdentite libelle="MISSION" valeur={mission.nom} />
            <LigneIdentite
              libelle="OBJET"
              valeur={mission.description ?? "Non renseigné"}
            />
            <LigneIdentite
              libelle="ÉQUIPE"
              valeur={rapport.membres.join(", ") || "Aucun membre assigné"}
            />
            <LigneIdentite
              libelle="DATE DE DÉBUT"
              valeur={formaterDate(mission.dateDebut)}
            />
            <LigneIdentite
              libelle="FIN INITIALEMENT PRÉVUE"
              valeur={formaterDate(mission.dateFinInitiale)}
            />
            <LigneIdentite
              libelle="FIN EFFECTIVE"
              valeur={formaterDate(
                mission.dateCloture ?? mission.dateFinActuelle,
              )}
            />
            <LigneIdentite
              libelle="DURÉE TOTALE"
              valeur={`${mission.dureeJours} jours`}
            />
            <LigneIdentite
              libelle="PROLONGATIONS"
              valeur={
                avecProlongations
                  ? `${rapport.prolongations.length}`
                  : "Aucune"
              }
              dernier
            />
          </View>

          <View style={styles.sommaire}>
            <Text style={styles.titreSommaire}>Sommaire</Text>
            {plan.map((s, i) => (
              <View key={s.titre} style={styles.ligneSommaire}>
                <Text style={styles.numeroSommaire}>{i + 1}.</Text>
                <Text style={styles.libelleSommaire}>{s.titre}</Text>
                <Text style={styles.pageSommaire}>{s.page}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.mentionGarde}>
            Document confidentiel. La section « Performance par membre »
            comporte un classement nominatif réservé à l&apos;encadrement.
          </Text>
        </View>

        <PiedDePage entete={entete} genereLe={rapport.genereLe} />
      </Page>

      {/* ——— Sections 1 et 2 ——— */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.entete} fixed>
          {entete}
        </Text>

        <View>
          <Text style={styles.titreSection}>
            {num("Contexte et objet de la mission")}. Contexte et objet de la
            mission
          </Text>
          {mission.description && (
            <Text style={styles.paragraphe}>{mission.description}</Text>
          )}
          <Text style={styles.paragraphe}>
            Ouverte le {formaterDate(mission.dateDebut)} pour une échéance
            initiale au {formaterDate(mission.dateFinInitiale)}, la mission a
            mobilisé {rapport.membres.length} collaborateur
            {rapport.membres.length > 1 ? "s" : ""} sur {mission.dureeJours}
            {" "}jours et {chiffres.total} activité
            {chiffres.total > 1 ? "s" : ""} planifiée
            {chiffres.total > 1 ? "s" : ""}.
          </Text>
          {mission.bilanContexte ? (
            <Text style={styles.paragraphe}>{mission.bilanContexte}</Text>
          ) : (
            <Text style={styles.nonRenseigne}>
              Le contexte détaillé n&apos;a pas été renseigné. Il se complète
              depuis la fiche de la mission avant de régénérer le rapport.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.titreSection}>
            {num("Résumé exécutif")}. Résumé exécutif
          </Text>
          <Text style={styles.paragraphe}>{resumeExecutif(rapport)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.titreSection}>
            {num("Vue d'ensemble chiffrée")}. Vue d&apos;ensemble chiffrée
          </Text>
          <View style={styles.rangee}>
            <Carte libelle="Tâches planifiées" valeur={String(chiffres.total)} />
            <Carte libelle="Réalisées" valeur={String(chiffres.terminees)} />
            <Carte libelle="Non abouties" valeur={String(chiffres.manquees)} />
            <Carte libelle="Complétion" valeur={`${chiffres.tauxCompletion} %`} />
          </View>
          <View style={[styles.rangee, { marginTop: 10 }]}>
            <Carte
              libelle="Ponctualité moyenne"
              valeur={`${chiffres.ponctualiteMoyenne} %`}
            />
            <Carte
              libelle="Qualité moyenne"
              valeur={
                chiffres.qualiteMoyenne === null
                  ? "non évaluée"
                  : `${chiffres.qualiteMoyenne} / 5`
              }
            />
            <Carte libelle="Encore en retard" valeur={String(chiffres.enRetard)} />
            <Carte
              libelle="Prolongations"
              valeur={String(rapport.prolongations.length)}
            />
          </View>

          {rapport.avancement.length > 1 && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.legendeGraphique}>
                Avancement au fil de la mission — part des tâches échues
                effectivement réalisées
              </Text>
              <CourbePdf
                points={rapport.avancement.map((p) => ({
                  periode: p.periode,
                  valeur: p.completion,
                }))}
              />
            </View>
          )}
        </View>

        <PiedDePage entete={entete} genereLe={rapport.genereLe} />
      </Page>

      {/* ——— Sections 3 et 4 ——— */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.entete} fixed>
          {entete}
        </Text>

        <View>
          <Text style={styles.titreSection}>
            {num("Organisation de l'équipe")}. Organisation de l&apos;équipe
          </Text>
          <Text style={styles.mention}>
            Composition de l&apos;équipe engagée et rattachement hiérarchique de
            chacun, tels qu&apos;enregistrés dans l&apos;organigramme.
          </Text>

          {rapport.equipe.length === 0 ? (
            <Text style={styles.nonRenseigne}>Aucun membre assigné.</Text>
          ) : (
            <View style={styles.tableau}>
              <View style={styles.enTete}>
                <Text style={[styles.celluleEnTete, { flex: 2 }]}>Membre</Text>
                <Text style={[styles.celluleEnTete, { flex: 2 }]}>
                  Poste / fonction
                </Text>
                <Text style={[styles.celluleEnTete, { flex: 1.3 }]}>
                  Service
                </Text>
                <Text style={[styles.celluleEnTete, { flex: 1.7 }]}>
                  Rattaché à
                </Text>
                <Text style={[styles.celluleEnTeteDroite, { flex: 0.8 }]}>
                  Tâches
                </Text>
              </View>
              {rapport.equipe.map((m, i) => (
                <View
                  key={m.nom}
                  style={[styles.ligne, i % 2 === 1 ? styles.ligneAlternee : {}]}
                  wrap={false}
                >
                  <Text style={[styles.cellule, { flex: 2 }]}>{m.nom}</Text>
                  <Text style={[styles.cellule, { flex: 2 }]}>
                    {m.poste ?? "—"}
                  </Text>
                  <Text
                    style={[styles.cellule, { flex: 1.3, color: ENCRE_MUETTE }]}
                  >
                    {m.service ?? "—"}
                  </Text>
                  <Text
                    style={[styles.cellule, { flex: 1.7, color: ENCRE_MUETTE }]}
                  >
                    {m.superieur ?? "Non défini"}
                  </Text>
                  <Text style={[styles.celluleDroite, { flex: 0.8 }]}>
                    {m.nbTaches}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.titreSection}>
            {num("Performance par membre")}. Performance par membre
          </Text>
          <Text style={styles.mention}>
            Section réservée à l&apos;encadrement. Classement de la plus à la
            moins performante sur le périmètre de cette mission.
          </Text>

          {rapport.parMembre.length === 0 ? (
            <Text style={styles.paragraphe}>Aucun membre assigné.</Text>
          ) : (
            <View style={styles.tableau}>
              <View style={styles.enTete}>
                <Text style={[styles.celluleEnTete, { flex: 0.4 }]}>#</Text>
                <Text style={[styles.celluleEnTete, { flex: 2.4 }]}>Membre</Text>
                <Text style={[styles.celluleEnTeteDroite, { flex: 0.9 }]}>
                  Score
                </Text>
                <Text style={[styles.celluleEnTeteDroite, { flex: 1.1 }]}>
                  Complétion
                </Text>
                <Text style={[styles.celluleEnTeteDroite, { flex: 0.9 }]}>
                  Délais
                </Text>
                <Text style={[styles.celluleEnTeteDroite, { flex: 0.9 }]}>
                  Qualité
                </Text>
                <Text style={[styles.celluleEnTeteDroite, { flex: 0.9 }]}>
                  Tâches
                </Text>
              </View>

              {rapport.parMembre.map((m, i) => (
                <View
                  key={m.userId}
                  style={[styles.ligne, i % 2 === 1 ? styles.ligneAlternee : {}]}
                  wrap={false}
                >
                  <Text style={[styles.cellule, { flex: 0.4, color: ENCRE_MUETTE }]}>
                    {i + 1}
                  </Text>
                  <Text style={[styles.cellule, { flex: 2.4 }]}>
                    {m.nom}
                    {m.poste ? ` — ${m.poste}` : ""}
                  </Text>
                  <Text
                    style={[
                      styles.celluleDroite,
                      { flex: 0.9, fontFamily: "Helvetica-Bold" },
                    ]}
                  >
                    {m.scoreGlobal}
                  </Text>
                  <Text style={[styles.celluleDroite, { flex: 1.1 }]}>
                    {m.tauxCompletion} %
                  </Text>
                  <Text style={[styles.celluleDroite, { flex: 0.9 }]}>
                    {m.ponctualite} %
                  </Text>
                  <Text style={[styles.celluleDroite, { flex: 0.9 }]}>
                    {m.qualiteNonEvaluee ? "—" : `${m.noteMoyenneSur5}/5`}
                  </Text>
                  <Text style={[styles.celluleDroite, { flex: 0.9 }]}>
                    {m.nbTachesTerminees}/{m.nbTachesExigibles}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {avecSuspens && (
          <View style={styles.section} break>
            <Text style={styles.titreSection}>
              {num("Activités en suspens à la clôture")}. Activités en suspens à
              la clôture
            </Text>
            <Text style={styles.mention}>
              {rapport.enSuspens.length} activité
              {rapport.enSuspens.length > 1 ? "s" : ""} non aboutie
              {rapport.enSuspens.length > 1 ? "s" : ""} au moment de la clôture.
              La matrice RACI de passation en détaille les responsabilités.
            </Text>

            <View style={styles.tableau}>
              <View style={styles.enTete}>
                <Text style={[styles.celluleEnTete, { flex: 3 }]}>
                  Activité
                </Text>
                <Text style={[styles.celluleEnTete, { flex: 1.8 }]}>
                  Responsable
                </Text>
                <Text style={[styles.celluleEnTete, { flex: 1.1 }]}>
                  Échéance
                </Text>
                <Text style={[styles.celluleEnTete, { flex: 1 }]}>
                  Priorité
                </Text>
                <Text style={[styles.celluleEnTeteDroite, { flex: 1 }]}>
                  Statut
                </Text>
              </View>
              {rapport.enSuspens.map((a, i) => (
                <View
                  key={`${a.titre}-${i}`}
                  style={[styles.ligne, i % 2 === 1 ? styles.ligneAlternee : {}]}
                  wrap={false}
                >
                  <Text style={[styles.cellule, { flex: 3 }]}>{a.titre}</Text>
                  <Text style={[styles.cellule, { flex: 1.8 }]}>
                    {a.responsable}
                  </Text>
                  <Text
                    style={[
                      styles.cellule,
                      { flex: 1.1 },
                      a.enRetard ? { color: ALERTE } : {},
                    ]}
                  >
                    {a.echeance}
                  </Text>
                  <Text style={[styles.cellule, { flex: 1 }]}>{a.priorite}</Text>
                  <Text
                    style={[
                      styles.celluleDroite,
                      { flex: 1 },
                      a.enRetard ? { color: ALERTE } : {},
                    ]}
                  >
                    {a.statut}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {avecProlongations && (
          <View style={styles.section}>
            <Text style={styles.titreSection}>
              {num("Historique des prolongations")}. Historique des prolongations
            </Text>
            <Text style={styles.mention}>
              Chaque décalage d&apos;échéance et son motif, pour expliquer
              l&apos;écart entre la durée prévue et la durée réelle.
            </Text>

            {rapport.prolongations.map((p, i) => (
              <View key={i} style={styles.prolongation} wrap={false}>
                <Text style={styles.gras}>
                  {p.ancienne} → {p.nouvelle} (+{p.joursAjoutes} jours)
                </Text>
                <Text style={styles.mention}>
                  Décidée le {p.date}
                  {p.auteur ? ` par ${p.auteur}` : ""}
                </Text>
                {p.motif && (
                  <Text style={{ fontSize: 9, marginTop: 2 }}>
                    Motif : {p.motif}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        <PiedDePage entete={entete} genereLe={rapport.genereLe} />
      </Page>

      {/* ——— Bilan qualitatif ——— */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.entete} fixed>
          {entete}
        </Text>

        <Text style={styles.titreSection}>
          {num("Bilan qualitatif du manager")}. Bilan qualitatif du manager
        </Text>

        <BlocBilan
          numero={`${num("Bilan qualitatif du manager")}.1`}
          titre="Synthèse générale"
          texte={mission.bilanQualitatif}
        />
        <BlocBilan
          numero={`${num("Bilan qualitatif du manager")}.2`}
          titre="Points forts de l'équipe"
          texte={mission.bilanPointsForts}
        />
        <BlocBilan
          numero={`${num("Bilan qualitatif du manager")}.3`}
          titre="Défis rencontrés et points d'amélioration"
          texte={mission.bilanDefis}
        />
        <BlocBilan
          numero={`${num("Bilan qualitatif du manager")}.4`}
          titre="Recommandations pour la suite"
          texte={mission.bilanRecommandations}
        />

        <View style={styles.section}>
          <Text style={styles.titreSection}>
            {num("Conclusion et remerciements")}. Conclusion et remerciements
          </Text>
          {mission.bilanConclusion ? (
            <Text style={styles.paragraphe}>{mission.bilanConclusion}</Text>
          ) : (
            <Text style={styles.nonRenseigne}>
              Non renseigné. Cette partie se complète depuis la fiche de la
              mission, avant de régénérer le rapport.
            </Text>
          )}
        </View>

        <PiedDePage entete={entete} genereLe={rapport.genereLe} />
      </Page>

      {/* ——— Annexe ——— */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.entete} fixed>
          {entete}
        </Text>

        <Text style={styles.titreSection}>
          {num("Annexe — liste exhaustive des tâches")}. Annexe — liste
          exhaustive des tâches
        </Text>
        <Text style={styles.mention}>
          {rapport.taches.length} tâche
          {rapport.taches.length > 1 ? "s" : ""} rattachée
          {rapport.taches.length > 1 ? "s" : ""} à la mission, statut final au{" "}
          {formaterDate(rapport.genereLe)}.
        </Text>

        <View style={styles.tableau}>
          <View style={styles.enTete} fixed>
            <Text style={[styles.celluleEnTete, { flex: 3 }]}>Tâche</Text>
            <Text style={[styles.celluleEnTete, { flex: 1.6 }]}>Assignée à</Text>
            <Text style={[styles.celluleEnTete, { flex: 1.1 }]}>Échéance</Text>
            <Text style={[styles.celluleEnTete, { flex: 1.1 }]}>Statut</Text>
            <Text style={[styles.celluleEnTeteDroite, { flex: 0.6 }]}>Note</Text>
          </View>

          {rapport.taches.map((t, i) => (
            <View
              key={`${t.titre}-${i}`}
              style={[styles.ligne, i % 2 === 1 ? styles.ligneAlternee : {}]}
              wrap={false}
            >
              <Text style={[styles.cellule, { flex: 3 }]}>{t.titre}</Text>
              <Text style={[styles.cellule, { flex: 1.6, color: ENCRE_MUETTE }]}>
                {t.assignes}
              </Text>
              <Text style={[styles.cellule, { flex: 1.1 }]}>{t.echeance}</Text>
              <Text
                style={[
                  styles.cellule,
                  { flex: 1.1 },
                  t.enRetard ? { color: ALERTE } : {},
                ]}
              >
                {t.statut}
              </Text>
              <Text style={[styles.celluleDroite, { flex: 0.6 }]}>
                {t.noteQualite ? `${t.noteQualite}/5` : "—"}
              </Text>
            </View>
          ))}
        </View>

        <PiedDePage entete={entete} genereLe={rapport.genereLe} />
      </Page>
    </Document>
  );
}

function BlocBilan({
  numero,
  titre,
  texte,
}: {
  numero: string;
  titre: string;
  texte: string | null;
}) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.titreSousSection}>
        {numero} {titre}
      </Text>
      {texte ? (
        <Text style={styles.paragraphe}>{texte}</Text>
      ) : (
        <Text style={styles.nonRenseigne}>
          Non renseigné. Cette partie se complète depuis la fiche de la mission,
          avant de régénérer le rapport.
        </Text>
      )}
    </View>
  );
}

function Carte({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <View style={styles.carte}>
      <Text style={styles.carteLibelle}>{libelle}</Text>
      <Text style={styles.carteValeur}>{valeur}</Text>
    </View>
  );
}

function LigneIdentite({
  libelle,
  valeur,
  dernier = false,
}: {
  libelle: string;
  valeur: string;
  dernier?: boolean;
}) {
  return (
    <View style={[styles.ligneIdentite, dernier ? { borderBottomWidth: 0 } : {}]}>
      <Text style={styles.libelleIdentite}>{libelle}</Text>
      <Text style={styles.valeurIdentite}>{valeur}</Text>
    </View>
  );
}

export function PiedDePage({
  entete,
  genereLe,
}: {
  entete: string;
  genereLe: Date;
}) {
  return (
    <View style={styles.pied} fixed>
      <Text>{entete}</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `${formaterDateHeure(genereLe)} · Page ${pageNumber} sur ${totalPages}`
        }
      />
    </View>
  );
}
