import { Document, Page, Text, View } from "@react-pdf/renderer";

import { formaterDate } from "@/lib/dates";
import type { RapportMandat } from "./donnees";
import { CourbePdf } from "./graphique-pdf";
import { ALERTE, ENCRE_MUETTE, styles } from "./styles-pdf";
import { BlocBilan, Carte, LigneIdentite, PiedDePage } from "./pdf-mission";
import { LIBELLES_SECTION_MANDAT, type CleSectionMandat } from "./sections-mandat";

/** Synthèse écrite à partir des seuls chiffres, sans jugement inventé. */
function resumeExecutif(r: RapportMandat) {
  const { chiffres } = r;

  const appreciation =
    chiffres.tauxCompletion >= 90
      ? "Le mandat s'est traduit par l'exécution de la quasi-totalité des activités planifiées."
      : chiffres.tauxCompletion >= 70
        ? "Le mandat a couvert l'essentiel des activités planifiées."
        : chiffres.tauxCompletion >= 50
          ? "Le mandat a couvert une partie des activités planifiées ; une part notable n'a pas abouti."
          : "Une majorité des activités planifiées n'a pas abouti sur la durée du mandat.";

  const delais =
    chiffres.ponctualiteMoyenne >= 90
      ? "Les livraisons ont respecté les échéances."
      : chiffres.ponctualiteMoyenne >= 70
        ? "Les échéances ont été globalement tenues, avec quelques dépassements."
        : "Le respect des échéances constitue le principal point faible du mandat.";

  const qualite =
    chiffres.qualiteMoyenne === null
      ? "Aucune note qualité n'a été attribuée, ce qui limite la lecture qualitative de ce bilan."
      : `La qualité moyenne des livrables évaluée par le manager s'établit à ${chiffres.qualiteMoyenne} sur 5.`;

  return `${appreciation} Sur ${chiffres.total} tâches réparties sur ${r.activites.length} activité${r.activites.length > 1 ? "s" : ""}, ${chiffres.terminees} ont été menées à bien, soit un taux de complétion de ${chiffres.tauxCompletion} %. ${delais} ${qualite}`;
}

/** Court paragraphe placé tôt dans le rapport : l'essentiel de la passation, avant le détail. */
function recapSuspens(r: RapportMandat) {
  if (r.enSuspens.length === 0) {
    return "Aucune activité n'était en suspens à la clôture du mandat : l'ensemble des tâches planifiées sur la période a été mené à son terme.";
  }
  const prioritaires = r.enSuspens.filter((a) => a.priorite === "HAUTE").length;
  const enRetard = r.enSuspens.filter((a) => a.enRetard).length;
  return `${r.enSuspens.length} activité${r.enSuspens.length > 1 ? "s" : ""} reste${r.enSuspens.length > 1 ? "nt" : ""} en suspens à la clôture du mandat, dont ${prioritaires} de priorité haute et ${enRetard} déjà en retard. Le détail, avec responsables et échéances, figure dans la checklist de passation ci-après.`;
}

type PropsSection = { rapport: RapportMandat; numero: number };

function SectionIntro({ rapport, numero }: PropsSection) {
  const { manager, periode } = rapport;
  return (
    <View style={styles.section} key="intro">
      <Text style={styles.titreSection}>
        {numero}. {LIBELLES_SECTION_MANDAT.intro}
      </Text>
      <Text style={styles.paragraphe}>
        Du {formaterDate(periode.debut)} au {formaterDate(periode.fin)},{" "}
        {manager.nom} a exercé la fonction de {manager.poste ?? "manager"}, à
        la tête d&apos;une équipe de {rapport.equipe.length} collaborateur
        {rapport.equipe.length > 1 ? "s" : ""}
        {rapport.activites.length > 0
          ? ` sur ${rapport.activites.length} activité${rapport.activites.length > 1 ? "s" : ""} (${rapport.activites.map((a) => a.nom).join(", ")})`
          : ""}
        .
      </Text>
      {rapport.bilan.contexte ? (
        <Text style={styles.paragraphe}>{rapport.bilan.contexte}</Text>
      ) : (
        <Text style={styles.nonRenseigne}>
          Le contexte détaillé n&apos;a pas été renseigné. Il se complète
          depuis l&apos;écran de génération du rapport avant de le régénérer.
        </Text>
      )}
    </View>
  );
}

function SectionRealisations({ rapport, numero }: PropsSection) {
  if (rapport.realisations.length === 0) return null;
  return (
    <View style={styles.section} key="realisations">
      <Text style={styles.titreSection}>
        {numero}. {LIBELLES_SECTION_MANDAT.realisations}
      </Text>
      <Text style={styles.mention}>
        Meilleures tâches de la période — livrées à temps et notées 4/5 ou
        plus par le manager.
      </Text>
      <View style={styles.tableau}>
        <View style={styles.enTete}>
          <Text style={[styles.celluleEnTete, { flex: 2.6 }]}>Tâche</Text>
          <Text style={[styles.celluleEnTete, { flex: 1.6 }]}>Activité</Text>
          <Text style={[styles.celluleEnTete, { flex: 1.6 }]}>
            Réalisée par
          </Text>
          <Text style={[styles.celluleEnTeteDroite, { flex: 0.8 }]}>
            Note
          </Text>
        </View>
        {rapport.realisations.map((t, i) => (
          <View
            key={`${t.titre}-${i}`}
            style={[styles.ligne, i % 2 === 1 ? styles.ligneAlternee : {}]}
            wrap={false}
          >
            <Text style={[styles.cellule, { flex: 2.6 }]}>{t.titre}</Text>
            <Text style={[styles.cellule, { flex: 1.6, color: ENCRE_MUETTE }]}>
              {t.mission}
            </Text>
            <Text style={[styles.cellule, { flex: 1.6 }]}>{t.assignes}</Text>
            <Text
              style={[
                styles.celluleDroite,
                { flex: 0.8, fontFamily: "Helvetica-Bold" },
              ]}
            >
              {t.noteQualite}/5
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SectionSuspens({ rapport, numero }: PropsSection) {
  return (
    <View style={styles.section} key="suspens">
      <Text style={styles.titreSection}>
        {numero}. {LIBELLES_SECTION_MANDAT.suspens}
      </Text>
      <Text style={styles.paragraphe}>{recapSuspens(rapport)}</Text>
    </View>
  );
}

function SectionRH({ rapport, numero }: PropsSection) {
  return (
    <View style={styles.section} key="rh">
      <Text style={styles.titreSection}>
        {numero}. {LIBELLES_SECTION_MANDAT.rh}
      </Text>
      <Text style={styles.mention}>
        Composition de l&apos;équipe rattachée au manager et rattachement
        hiérarchique de chacun, tels qu&apos;enregistrés dans
        l&apos;organigramme.
      </Text>

      {rapport.equipe.length === 0 ? (
        <Text style={styles.nonRenseigne}>Aucun membre rattaché.</Text>
      ) : (
        <View style={styles.tableau}>
          <View style={styles.enTete}>
            <Text style={[styles.celluleEnTete, { flex: 2 }]}>Membre</Text>
            <Text style={[styles.celluleEnTete, { flex: 2 }]}>
              Poste / fonction
            </Text>
            <Text style={[styles.celluleEnTete, { flex: 1.3 }]}>Service</Text>
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
              <Text style={[styles.cellule, { flex: 1.3, color: ENCRE_MUETTE }]}>
                {m.service ?? "—"}
              </Text>
              <Text style={[styles.cellule, { flex: 1.7, color: ENCRE_MUETTE }]}>
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
  );
}

function SectionPerformance({ rapport, numero }: PropsSection) {
  const { chiffres } = rapport;
  return (
    <View style={styles.section} key="performance">
      <Text style={styles.titreSection}>
        {numero}. {LIBELLES_SECTION_MANDAT.performance}
      </Text>
      <Text style={styles.mention}>
        Section réservée à l&apos;encadrement. Chiffres calculés sur
        l&apos;ensemble de la période du mandat.
      </Text>
      <Text style={styles.paragraphe}>{resumeExecutif(rapport)}</Text>

      <View style={[styles.rangee, { marginTop: 10 }]}>
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
          libelle="Activités couvertes"
          valeur={String(rapport.activites.length)}
        />
      </View>

      {rapport.avancement.length > 1 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.legendeGraphique}>
            Avancement au fil du mandat — part des tâches échues effectivement
            réalisées
          </Text>
          <CourbePdf
            points={rapport.avancement.map((p) => ({
              periode: p.periode,
              valeur: p.completion,
            }))}
          />
        </View>
      )}

      {rapport.parMembre.length === 0 ? (
        <Text style={[styles.paragraphe, { marginTop: 12 }]}>
          Aucun membre évalué sur la période.
        </Text>
      ) : (
        <View style={[styles.tableau, { marginTop: 12 }]}>
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
  );
}

function SectionRubriques({ rapport, numero }: PropsSection) {
  if (rapport.rubriques.length === 0) return null;
  return (
    <View key="rubriques">
      <Text style={styles.titreSection}>
        {numero}. {LIBELLES_SECTION_MANDAT.rubriques}
      </Text>
      {rapport.rubriques.map((r, i) => (
        <View key={i} style={styles.section} wrap={false}>
          <Text style={styles.titreSousSection}>{r.titre}</Text>
          {r.contenu ? (
            <Text style={styles.paragraphe}>{r.contenu}</Text>
          ) : (
            <Text style={styles.nonRenseigne}>Non renseigné.</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function SectionChecklist({ rapport, numero }: PropsSection) {
  return (
    <View style={styles.section} key="checklist">
      <Text style={styles.titreSection}>
        {numero}. {LIBELLES_SECTION_MANDAT.checklist}
      </Text>
      <Text style={styles.mention}>
        {rapport.enSuspens.length} activité
        {rapport.enSuspens.length > 1 ? "s" : ""} non aboutie
        {rapport.enSuspens.length > 1 ? "s" : ""} au moment de la clôture. La
        matrice RACI de passation en détaille les responsabilités.
      </Text>

      {rapport.enSuspens.length === 0 ? (
        <Text style={styles.nonRenseigne}>Aucune activité en suspens.</Text>
      ) : (
        <View style={styles.tableau}>
          <View style={styles.enTete}>
            <Text style={[styles.celluleEnTete, { flex: 2.4 }]}>
              Activité
            </Text>
            <Text style={[styles.celluleEnTete, { flex: 1.6 }]}>
              Rattachée à
            </Text>
            <Text style={[styles.celluleEnTete, { flex: 1.6 }]}>
              Responsable
            </Text>
            <Text style={[styles.celluleEnTete, { flex: 1.1 }]}>
              Échéance
            </Text>
            <Text style={[styles.celluleEnTete, { flex: 1 }]}>Priorité</Text>
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
              <Text style={[styles.cellule, { flex: 2.4 }]}>{a.titre}</Text>
              <Text style={[styles.cellule, { flex: 1.6, color: ENCRE_MUETTE }]}>
                {a.activite}
              </Text>
              <Text style={[styles.cellule, { flex: 1.6 }]}>
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
      )}
    </View>
  );
}

function SectionProlongations({ rapport, numero }: PropsSection) {
  if (rapport.prolongations.length === 0) return null;
  return (
    <View style={styles.section} key="prolongations">
      <Text style={styles.titreSection}>
        {numero}. {LIBELLES_SECTION_MANDAT.prolongations}
      </Text>
      <Text style={styles.mention}>
        Chaque décalage d&apos;échéance et son motif, toutes activités
        confondues sur la période du mandat.
      </Text>

      {rapport.prolongations.map((p, i) => (
        <View key={i} style={styles.prolongation} wrap={false}>
          <Text style={styles.gras}>
            {p.activite} — {p.ancienne} → {p.nouvelle} (+{p.joursAjoutes}{" "}
            jours)
          </Text>
          <Text style={styles.mention}>
            Décidée le {p.date}
            {p.auteur ? ` par ${p.auteur}` : ""}
          </Text>
          {p.motif && (
            <Text style={{ fontSize: 9, marginTop: 2 }}>Motif : {p.motif}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function SectionInfosPratiques({ rapport, numero }: PropsSection) {
  return (
    <View style={styles.section} wrap={false} key="informations_pratiques">
      <Text style={styles.titreSection}>
        {numero}. {LIBELLES_SECTION_MANDAT.informations_pratiques}
      </Text>
      {rapport.bilan.informationsPratiques ? (
        <Text style={styles.paragraphe}>
          {rapport.bilan.informationsPratiques}
        </Text>
      ) : (
        <Text style={styles.nonRenseigne}>
          Non renseigné. Cette partie se complète depuis l&apos;écran de
          génération du rapport, avant de le régénérer.
        </Text>
      )}
    </View>
  );
}

function SectionBilanQualitatif({ rapport, numero }: PropsSection) {
  return (
    <View key="bilan_qualitatif">
      <Text style={styles.titreSection}>
        {numero}. {LIBELLES_SECTION_MANDAT.bilan_qualitatif}
      </Text>
      <BlocBilan
        numero={`${numero}.1`}
        titre="Synthèse générale"
        texte={rapport.bilan.qualitatif}
      />
      <BlocBilan
        numero={`${numero}.2`}
        titre="Points forts de l'équipe"
        texte={rapport.bilan.pointsForts}
      />
      <BlocBilan
        numero={`${numero}.3`}
        titre="Défis rencontrés et points d'amélioration"
        texte={rapport.bilan.defis}
      />
      <BlocBilan
        numero={`${numero}.4`}
        titre="Recommandations pour la suite"
        texte={rapport.bilan.recommandations}
      />
    </View>
  );
}

function SectionConclusion({ rapport, numero }: PropsSection) {
  return (
    <View style={styles.section} key="conclusion">
      <Text style={styles.titreSection}>
        {numero}. {LIBELLES_SECTION_MANDAT.conclusion}
      </Text>
      {rapport.bilan.conclusion ? (
        <Text style={styles.paragraphe}>{rapport.bilan.conclusion}</Text>
      ) : (
        <Text style={styles.nonRenseigne}>
          Non renseigné. Cette partie se complète depuis l&apos;écran de
          génération du rapport, avant de le régénérer.
        </Text>
      )}
    </View>
  );
}

const RENDERERS: Record<CleSectionMandat, (props: PropsSection) => React.ReactNode> = {
  intro: SectionIntro,
  realisations: SectionRealisations,
  suspens: SectionSuspens,
  rh: SectionRH,
  performance: SectionPerformance,
  rubriques: SectionRubriques,
  checklist: SectionChecklist,
  prolongations: SectionProlongations,
  informations_pratiques: SectionInfosPratiques,
  bilan_qualitatif: SectionBilanQualitatif,
  conclusion: SectionConclusion,
};

export function PdfMandat({ rapport }: { rapport: RapportMandat }) {
  const { manager, periode } = rapport;

  // Seules les sections dont les données existent réellement comptent dans
  // le plan — une section vide ne doit pas laisser de trou de numérotation.
  const sections = rapport.sectionsIncluses.filter((cle) => {
    if (cle === "rubriques") return rapport.rubriques.length > 0;
    if (cle === "prolongations") return rapport.prolongations.length > 0;
    if (cle === "realisations") return rapport.realisations.length > 0;
    return true;
  });

  const plan = [
    ...sections.map((cle) => ({ cle, titre: LIBELLES_SECTION_MANDAT[cle] })),
    { cle: "annexe" as const, titre: "Annexe — liste exhaustive des tâches" },
  ];

  const entete = `Rapport de fin de mission · ${manager.nom}`;

  return (
    <Document
      title={`Rapport de fin de mission — ${manager.nom}`}
      author="Suivi de Performance d'Équipe"
      subject={`Bilan de mandat de ${manager.nom}`}
    >
      {/* ——— Page de garde ——— */}
      <Page size="A4" style={styles.page}>
        <View style={styles.garde}>
          <Text style={styles.surtitre}>Document de bilan</Text>
          <Text style={styles.titreGarde}>RAPPORT DE FIN DE MISSION</Text>
          <Text style={styles.sousTitreGarde}>{manager.nom}</Text>

          <View style={styles.tableauIdentite}>
            <LigneIdentite libelle="MANAGER" valeur={manager.nom} />
            <LigneIdentite
              libelle="FONCTION"
              valeur={manager.poste ?? "Non renseignée"}
            />
            <LigneIdentite
              libelle="ÉQUIPE"
              valeur={
                rapport.equipe.map((m) => m.nom).join(", ") ||
                "Aucun membre rattaché"
              }
            />
            <LigneIdentite
              libelle="PÉRIODE DU MANDAT"
              valeur={`${formaterDate(periode.debut)} au ${formaterDate(periode.fin)}`}
            />
            <LigneIdentite
              libelle="ACTIVITÉS COUVERTES"
              valeur={
                rapport.activites.length > 0
                  ? rapport.activites.map((a) => a.nom).join(", ")
                  : "Aucune activité rattachée sur la période"
              }
              dernier
            />
          </View>

          <View style={styles.sommaire}>
            <Text style={styles.titreSommaire}>Sommaire</Text>
            {plan.map((s, i) => (
              <View key={s.cle} style={styles.ligneSommaire}>
                <Text style={styles.numeroSommaire}>{i + 1}.</Text>
                <Text style={styles.libelleSommaire}>{s.titre}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.mentionGarde}>
            Document confidentiel. La section « Performance de l&apos;équipe »
            comporte un classement nominatif réservé à l&apos;encadrement.
          </Text>
        </View>

        <PiedDePage entete={entete} genereLe={rapport.genereLe} />
      </Page>

      {/* ——— Sections narratives, dans l'ordre choisi par le manager ——— */}
      {/* Une seule Page qui se pagine automatiquement : l'ordre étant
          configurable, découper le contenu à la main en pages fixes n'aurait
          plus de sens. */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.entete} fixed>
          {entete}
        </Text>

        {sections.map((cle, i) => {
          const Rendu = RENDERERS[cle];
          return <Rendu key={cle} rapport={rapport} numero={i + 1} />;
        })}

        <PiedDePage entete={entete} genereLe={rapport.genereLe} />
      </Page>

      {/* ——— Annexe ——— */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.entete} fixed>
          {entete}
        </Text>

        <Text style={styles.titreSection}>
          {plan.length}. Annexe — liste exhaustive des tâches
        </Text>
        <Text style={styles.mention}>
          {rapport.taches.length} tâche
          {rapport.taches.length > 1 ? "s" : ""} sur la période, statut final
          au {formaterDate(rapport.genereLe)}.
        </Text>

        <View style={styles.tableau}>
          <View style={styles.enTete} fixed>
            <Text style={[styles.celluleEnTete, { flex: 2.4 }]}>Tâche</Text>
            <Text style={[styles.celluleEnTete, { flex: 1.4 }]}>Activité</Text>
            <Text style={[styles.celluleEnTete, { flex: 1.4 }]}>
              Assignée à
            </Text>
            <Text style={[styles.celluleEnTete, { flex: 1 }]}>Échéance</Text>
            <Text style={[styles.celluleEnTete, { flex: 1 }]}>Statut</Text>
            <Text style={[styles.celluleEnTeteDroite, { flex: 0.6 }]}>
              Note
            </Text>
          </View>

          {rapport.taches.map((t, i) => (
            <View
              key={`${t.titre}-${i}`}
              style={[styles.ligne, i % 2 === 1 ? styles.ligneAlternee : {}]}
              wrap={false}
            >
              <Text style={[styles.cellule, { flex: 2.4 }]}>{t.titre}</Text>
              <Text style={[styles.cellule, { flex: 1.4, color: ENCRE_MUETTE }]}>
                {t.mission}
              </Text>
              <Text style={[styles.cellule, { flex: 1.4, color: ENCRE_MUETTE }]}>
                {t.assignes}
              </Text>
              <Text style={[styles.cellule, { flex: 1 }]}>{t.echeance}</Text>
              <Text
                style={[
                  styles.cellule,
                  { flex: 1 },
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
