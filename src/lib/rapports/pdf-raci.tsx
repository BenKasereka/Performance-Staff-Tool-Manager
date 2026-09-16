import { Document, Page, Text, View } from "@react-pdf/renderer";

import { formaterDate, formaterDateHeure } from "@/lib/dates";
import type { LigneRaci, RapportRaci } from "./raci";
import { ALERTE, ENCRE_MUETTE, styles } from "./styles-pdf";

const COL = {
  activite: 3.4,
  mission: 1.5,
  r: 1.7,
  a: 1.7,
  c: 1.3,
  echeance: 1.1,
  criticite: 1,
} as const;

export function PdfRaci({ rapport }: { rapport: RapportRaci }) {
  const { chiffres } = rapport;
  const entete = `Matrice RACI de passation · ${rapport.perimetre}`;

  const immediates = rapport.lignes.filter((l) => l.criticite === "Immédiate");
  const hautes = rapport.lignes.filter((l) => l.criticite === "Haute");
  const normales = rapport.lignes.filter((l) => l.criticite === "Normale");

  return (
    <Document
      title={`Matrice RACI de passation — ${rapport.perimetre}`}
      author="Suivi de Performance d'Équipe"
      subject="Activités en cours et répartition des responsabilités"
    >
      {/* ——— Page de garde ——— */}
      <Page size="A4" style={styles.page}>
        <View style={styles.garde}>
          <Text style={styles.surtitre}>Document de passation</Text>
          <Text style={styles.titreGarde}>MATRICE RACI</Text>
          <Text style={styles.sousTitreGarde}>
            Activités en cours au {formaterDate(rapport.genereLe)}
          </Text>

          <View style={styles.tableauIdentite}>
            <LigneIdentite libelle="PÉRIMÈTRE" valeur={rapport.perimetre} />
            <LigneIdentite
              libelle="ACTIVITÉS OUVERTES"
              valeur={`${chiffres.total}`}
            />
            <LigneIdentite
              libelle="DONT EN RETARD"
              valeur={`${chiffres.enRetard}`}
            />
            <LigneIdentite
              libelle="À REPRENDRE IMMÉDIATEMENT"
              valeur={`${chiffres.immediates}`}
            />
            <LigneIdentite
              libelle="ÉCHÉANCE SOUS 7 JOURS"
              valeur={`${chiffres.sousSeptJours}`}
            />
            <LigneIdentite
              libelle="INTERVENANTS"
              valeur={`${rapport.repartition.length}`}
            />
            <LigneIdentite
              libelle="ÉTABLI LE"
              valeur={formaterDateHeure(rapport.genereLe)}
              dernier
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.titreSousSection}>
              Convention de lecture des rôles
            </Text>
            <Legende
              lettre="R"
              nom="Responsable"
              texte="Exécute l'activité. C'est la personne à qui la tâche est assignée."
            />
            <Legende
              lettre="A"
              nom="Approbateur"
              texte="Rend des comptes sur le résultat et valide. Déduit de l'organigramme : c'est le supérieur hiérarchique du responsable."
            />
            <Legende
              lettre="C"
              nom="Consulté"
              texte="A créé l'activité ou est intervenu dans sa discussion. Son avis est à recueillir avant toute décision."
            />
            <Legende
              lettre="I"
              nom="Informé"
              texte="Tenu au courant de l'avancement : encadrement et autres membres de l'équipe engagée."
              dernier
            />
          </View>

          <Text style={styles.mentionGarde}>
            Ce document ne recense que les activités encore ouvertes. Les
            activités terminées ou annulées figurent dans le rapport de fin de
            mission.
          </Text>
        </View>

        <PiedRaci entete={entete} genereLe={rapport.genereLe} />
      </Page>

      {/* ——— Priorités de reprise ——— */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.entete} fixed>
          {entete}
        </Text>

        <Text style={styles.titreSection}>1. Priorités à la prise de poste</Text>
        <Text style={styles.mention}>
          Ordre de reprise conseillé : les activités en retard d&apos;abord, puis
          les priorités hautes, puis les échéances les plus proches.
        </Text>

        {chiffres.total === 0 ? (
          <Text style={styles.paragraphe}>
            Aucune activité ouverte sur ce périmètre. La passation ne comporte
            aucun encours.
          </Text>
        ) : (
          <>
            <BlocPriorite
              numero="1.1"
              titre="À reprendre immédiatement"
              soustitre="Échéance déjà dépassée"
              lignes={immediates}
              couleur={ALERTE}
            />
            <BlocPriorite
              numero="1.2"
              titre="À traiter en priorité"
              soustitre="Priorité haute ou échéance sous sept jours"
              lignes={hautes}
            />
            <BlocPriorite
              numero="1.3"
              titre="À planifier"
              soustitre="Échéance au-delà de sept jours"
              lignes={normales}
            />
          </>
        )}

        <PiedRaci entete={entete} genereLe={rapport.genereLe} />
      </Page>

      {/* ——— Matrice RACI ——— */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.entete} fixed>
          {entete}
        </Text>

        <Text style={styles.titreSection}>2. Matrice RACI détaillée</Text>
        <Text style={styles.mention}>
          {chiffres.total} activité{chiffres.total > 1 ? "s" : ""} ouverte
          {chiffres.total > 1 ? "s" : ""}
          {chiffres.sansApprobateur > 0
            ? ` · ${chiffres.sansApprobateur} sans approbateur défini, faute de rattachement hiérarchique renseigné`
            : ""}
          .
        </Text>

        <View style={styles.tableau}>
          <View style={styles.enTete} fixed>
            <Text style={[styles.celluleEnTete, { flex: COL.activite }]}>
              Activité
            </Text>
            <Text style={[styles.celluleEnTete, { flex: COL.mission }]}>
              Rattachée à
            </Text>
            <Text style={[styles.celluleEnTete, { flex: COL.r }]}>
              R — Responsable
            </Text>
            <Text style={[styles.celluleEnTete, { flex: COL.a }]}>
              A — Approbateur
            </Text>
            <Text style={[styles.celluleEnTete, { flex: COL.c }]}>
              C — Consulté
            </Text>
            <Text style={[styles.celluleEnTete, { flex: COL.echeance }]}>
              Échéance
            </Text>
            <Text style={[styles.celluleEnTeteDroite, { flex: COL.criticite }]}>
              Criticité
            </Text>
          </View>

          {rapport.lignes.map((l, i) => (
            <View
              key={l.id}
              style={[styles.ligne, i % 2 === 1 ? styles.ligneAlternee : {}]}
              wrap={false}
            >
              <Text style={[styles.cellule, { flex: COL.activite }]}>
                {l.activite}
              </Text>
              <Text
                style={[styles.cellule, { flex: COL.mission, color: ENCRE_MUETTE }]}
              >
                {l.mission}
              </Text>
              <Text style={[styles.cellule, { flex: COL.r }]}>{l.responsable}</Text>
              <Text
                style={[
                  styles.cellule,
                  { flex: COL.a },
                  l.approbateur === "Non défini" ? { color: ALERTE } : {},
                ]}
              >
                {l.approbateur}
              </Text>
              <Text
                style={[styles.cellule, { flex: COL.c, color: ENCRE_MUETTE }]}
              >
                {l.consultes}
              </Text>
              <Text
                style={[
                  styles.cellule,
                  { flex: COL.echeance },
                  l.enRetard ? { color: ALERTE } : {},
                ]}
              >
                {l.echeance}
              </Text>
              <Text
                style={[
                  styles.celluleDroite,
                  { flex: COL.criticite },
                  l.criticite === "Immédiate"
                    ? { color: ALERTE, fontFamily: "Helvetica-Bold" }
                    : {},
                ]}
              >
                {l.criticite}
              </Text>
            </View>
          ))}
        </View>

        <PiedRaci entete={entete} genereLe={rapport.genereLe} paysage />
      </Page>

      {/* ——— Charge par intervenant ——— */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.entete} fixed>
          {entete}
        </Text>

        <Text style={styles.titreSection}>3. Charge par intervenant</Text>
        <Text style={styles.mention}>
          Volume d&apos;activités ouvertes portées par chaque responsable, pour
          repérer les déséquilibres au moment de la reprise.
        </Text>

        <View style={styles.tableau}>
          <View style={styles.enTete}>
            <Text style={[styles.celluleEnTete, { flex: 3 }]}>Responsable</Text>
            <Text style={[styles.celluleEnTeteDroite, { flex: 1 }]}>
              Activités ouvertes
            </Text>
            <Text style={[styles.celluleEnTeteDroite, { flex: 1 }]}>
              Dont en retard
            </Text>
          </View>

          {rapport.repartition.map((r, i) => (
            <View
              key={r.responsable}
              style={[styles.ligne, i % 2 === 1 ? styles.ligneAlternee : {}]}
              wrap={false}
            >
              <Text style={[styles.cellule, { flex: 3 }]}>{r.responsable}</Text>
              <Text style={[styles.celluleDroite, { flex: 1 }]}>{r.total}</Text>
              <Text
                style={[
                  styles.celluleDroite,
                  { flex: 1 },
                  r.enRetard > 0
                    ? { color: ALERTE, fontFamily: "Helvetica-Bold" }
                    : {},
                ]}
              >
                {r.enRetard}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.titreSousSection}>Signatures</Text>
          <View style={[styles.rangee, { marginTop: 14 }]}>
            <CaseSignature titre="Agent sortant" />
            <CaseSignature titre="Agent entrant" />
            <CaseSignature titre="Responsable hiérarchique" />
          </View>
        </View>

        <PiedRaci entete={entete} genereLe={rapport.genereLe} />
      </Page>
    </Document>
  );
}

function BlocPriorite({
  numero,
  titre,
  soustitre,
  lignes,
  couleur,
}: {
  numero: string;
  titre: string;
  soustitre: string;
  lignes: LigneRaci[];
  couleur?: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.titreSousSection, couleur ? { color: couleur } : {}]}>
        {numero} {titre} ({lignes.length})
      </Text>
      <Text style={styles.mention}>{soustitre}</Text>

      {lignes.length === 0 ? (
        <Text style={styles.nonRenseigne}>Aucune activité dans cette catégorie.</Text>
      ) : (
        lignes.map((l) => (
          <View key={l.id} style={styles.activitePrioritaire} wrap={false}>
            <Text style={styles.gras}>{l.activite}</Text>
            <Text style={styles.mention}>
              {l.responsable} · {l.mission} · échéance {l.echeance}
              {l.enRetard
                ? ` · en retard de ${l.joursDeReport} jour${l.joursDeReport > 1 ? "s" : ""}`
                : ` · dans ${l.joursRestants} jour${l.joursRestants > 1 ? "s" : ""}`}
            </Text>
            {l.description && (
              <Text style={{ fontSize: 8.5, marginTop: 1 }}>{l.description}</Text>
            )}
            {l.dernierCommentaire && (
              <Text style={{ fontSize: 8, color: ENCRE_MUETTE, marginTop: 2 }}>
                Dernier échange — {l.dernierCommentaire}
              </Text>
            )}
          </View>
        ))
      )}
    </View>
  );
}

function Legende({
  lettre,
  nom,
  texte,
  dernier = false,
}: {
  lettre: string;
  nom: string;
  texte: string;
  dernier?: boolean;
}) {
  return (
    <View
      style={[styles.ligneLegende, dernier ? { borderBottomWidth: 0 } : {}]}
    >
      <Text style={styles.lettreRaci}>{lettre}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold" }}>{nom}</Text>
        <Text style={{ fontSize: 8.5, color: ENCRE_MUETTE }}>{texte}</Text>
      </View>
    </View>
  );
}

function CaseSignature({ titre }: { titre: string }) {
  return (
    <View style={styles.caseSignature}>
      <Text style={{ fontSize: 8, color: ENCRE_MUETTE }}>{titre}</Text>
      <Text style={{ fontSize: 7.5, color: ENCRE_MUETTE, marginTop: 34 }}>
        Nom, date et signature
      </Text>
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

function PiedRaci({
  entete,
  genereLe,
  paysage = false,
}: {
  entete: string;
  genereLe: Date;
  paysage?: boolean;
}) {
  return (
    <View style={[styles.pied, paysage ? { bottom: 20 } : {}]} fixed>
      <Text>{entete}</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `${formaterDateHeure(genereLe)} · Page ${pageNumber} sur ${totalPages}`
        }
      />
    </View>
  );
}
