import { StyleSheet } from "@react-pdf/renderer";

export const ENCRE = "#0b0b0b";
export const ENCRE_DOUCE = "#52514e";
export const ENCRE_MUETTE = "#898781";
export const TRAIT = "#e1e0d9";
export const TRAIT_FORT = "#c3c2b7";
export const FOND_DOUX = "#f4f6f9";
export const ACCENT = "#2a78d6";
export const ALERTE = "#d03b3b";
export const SUCCES = "#0ca30c";

export const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontSize: 10,
    color: ENCRE,
    fontFamily: "Helvetica",
    lineHeight: 1.45,
  },

  // — En-tête courant et pied de page —
  entete: {
    fontSize: 8,
    color: ENCRE_MUETTE,
    marginBottom: 18,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: TRAIT,
  },
  pied: {
    position: "absolute",
    bottom: 28,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: ENCRE_MUETTE,
    borderTopWidth: 1,
    borderTopColor: TRAIT,
    paddingTop: 6,
  },

  // — Page de garde —
  garde: { paddingTop: 30 },
  titreGarde: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    // lineHeight explicite : celui de la page (1.45) ne suffit pas à dégager
    // les jambages d'un corps 26 et le sous-titre venait chevaucher le titre.
    lineHeight: 1.2,
    marginBottom: 10,
  },
  sousTitreGarde: {
    fontSize: 15,
    lineHeight: 1.3,
    color: ENCRE_DOUCE,
    marginBottom: 34,
  },
  tableauIdentite: {
    borderWidth: 1,
    borderColor: TRAIT_FORT,
    borderRadius: 4,
  },
  ligneIdentite: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: TRAIT,
    minHeight: 24,
    alignItems: "center",
  },
  libelleIdentite: {
    width: 165,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: ENCRE_DOUCE,
    backgroundColor: FOND_DOUX,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignSelf: "stretch",
  },
  valeurIdentite: {
    flex: 1,
    fontSize: 9.5,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  sommaire: { marginTop: 32 },
  titreSommaire: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: TRAIT,
  },
  ligneSommaire: { flexDirection: "row", marginBottom: 5 },
  numeroSommaire: { width: 20, fontSize: 9.5, color: ENCRE_DOUCE },
  libelleSommaire: { flex: 1, fontSize: 9.5 },
  pageSommaire: { fontSize: 9.5, color: ENCRE_MUETTE },

  mentionGarde: {
    marginTop: 34,
    fontSize: 8,
    color: ALERTE,
    fontFamily: "Helvetica-Bold",
  },

  // — Titres —
  surtitre: { fontSize: 9, color: ENCRE_MUETTE, marginBottom: 6 },
  titre: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  sousTitre: { fontSize: 11, color: ENCRE_DOUCE, marginBottom: 2 },

  section: { marginTop: 22 },
  titreSection: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1.5,
    borderBottomColor: ENCRE,
  },
  titreSousSection: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
  },

  paragraphe: { marginBottom: 6, color: ENCRE_DOUCE, textAlign: "justify" },
  gras: { fontFamily: "Helvetica-Bold", color: ENCRE },
  mention: { fontSize: 8.5, color: ENCRE_MUETTE, marginBottom: 8 },
  nonRenseigne: { fontSize: 9, color: ENCRE_MUETTE, fontStyle: "italic" },
  legendeGraphique: { fontSize: 8.5, color: ENCRE_DOUCE, marginBottom: 6 },

  // — Cartes de chiffres —
  rangee: { flexDirection: "row", gap: 8 },
  carte: {
    flex: 1,
    borderWidth: 1,
    borderColor: TRAIT,
    borderRadius: 4,
    padding: 9,
    backgroundColor: FOND_DOUX,
  },
  carteLibelle: { fontSize: 7.5, color: ENCRE_DOUCE, marginBottom: 3 },
  carteValeur: { fontSize: 16, fontFamily: "Helvetica-Bold" },

  // — Tableaux —
  tableau: { marginTop: 6 },
  enTete: {
    flexDirection: "row",
    backgroundColor: ENCRE,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  celluleEnTete: {
    fontSize: 7.5,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
  },
  celluleEnTeteDroite: {
    fontSize: 7.5,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  ligne: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: TRAIT,
  },
  ligneAlternee: { backgroundColor: FOND_DOUX },
  cellule: { fontSize: 8.5 },
  celluleDroite: { fontSize: 8.5, textAlign: "right" },

  prolongation: {
    marginBottom: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: ALERTE,
  },

  encadre: {
    borderWidth: 1,
    borderColor: TRAIT,
    borderRadius: 4,
    padding: 12,
    backgroundColor: FOND_DOUX,
  },

  confidentiel: { fontSize: 8, color: ALERTE, fontFamily: "Helvetica-Bold" },

  // — Matrice RACI —
  ligneLegende: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: TRAIT,
  },
  lettreRaci: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ENCRE,
    color: "#ffffff",
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 5,
  },
  activitePrioritaire: {
    marginBottom: 9,
    paddingLeft: 10,
    paddingVertical: 2,
    borderLeftWidth: 2,
    borderLeftColor: TRAIT_FORT,
  },
  caseSignature: {
    flex: 1,
    borderWidth: 1,
    borderColor: TRAIT_FORT,
    borderRadius: 4,
    padding: 9,
    minHeight: 76,
  },
});
