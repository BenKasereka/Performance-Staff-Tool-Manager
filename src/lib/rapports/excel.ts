import ExcelJS from "exceljs";

import { LIBELLES_CRITERE } from "@/lib/kpi";
import { formaterDate } from "@/lib/dates";
import type { RapportIndividuel, RapportMission } from "./donnees";
import type { RapportRaci } from "./raci";

const ENTETE_FOND = "FF0B0B0B";
const ENTETE_TEXTE = "FFFFFFFF";

function styliserEntete(ligne: ExcelJS.Row) {
  ligne.font = { bold: true, color: { argb: ENTETE_TEXTE }, size: 10 };
  ligne.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: ENTETE_FOND },
  };
  ligne.alignment = { vertical: "middle" };
  ligne.height = 20;
}

function ajusterColonnes(feuille: ExcelJS.Worksheet, largeurs: number[]) {
  largeurs.forEach((l, i) => {
    feuille.getColumn(i + 1).width = l;
  });
}

function creerClasseur() {
  const classeur = new ExcelJS.Workbook();
  classeur.creator = "Suivi de Performance d'Équipe";
  classeur.created = new Date();
  return classeur;
}

export async function excelIndividuel(
  rapport: RapportIndividuel,
): Promise<Buffer> {
  const classeur = creerClasseur();

  const synthese = classeur.addWorksheet("Synthèse");
  ajusterColonnes(synthese, [34, 22]);

  synthese.addRow(["Rapport d'évaluation individuel"]).font = {
    bold: true,
    size: 14,
  };
  synthese.addRow([]);
  synthese.addRow(["Membre", rapport.membre.nom]);
  synthese.addRow(["Poste", rapport.membre.poste ?? "—"]);
  synthese.addRow(["Service", rapport.membre.service ?? "—"]);
  synthese.addRow(["Supérieur hiérarchique", rapport.membre.superieur ?? "—"]);
  synthese.addRow(["Période", rapport.periode.libelle]);
  synthese.addRow([
    "Du",
    formaterDate(rapport.periode.debut),
  ]);
  synthese.addRow(["Au", formaterDate(rapport.periode.fin)]);
  synthese.addRow([]);

  if (rapport.score) {
    const s = rapport.score;
    synthese.addRow(["Score global sur 100", s.scoreGlobal]).font = {
      bold: true,
    };
    synthese.addRow([LIBELLES_CRITERE.tauxCompletion, `${s.tauxCompletion} %`]);
    synthese.addRow([LIBELLES_CRITERE.ponctualite, `${s.ponctualite} %`]);
    synthese.addRow([
      LIBELLES_CRITERE.noteQualite,
      s.qualiteNonEvaluee ? "non évalué" : `${s.noteMoyenneSur5} / 5`,
    ]);
    synthese.addRow([LIBELLES_CRITERE.volume, s.volume]);
    synthese.addRow([]);
    synthese.addRow(["Tâches assignées", s.nbTachesTotal]);
    synthese.addRow(["Dont déjà échues ou terminées", s.nbTachesExigibles]);
    synthese.addRow(["Terminées", s.nbTachesTerminees]);
    synthese.addRow(["Encore en retard", s.nbTachesEnRetard]);
  } else {
    synthese.addRow(["Aucune donnée de performance sur la période"]);
  }

  const evolution = classeur.addWorksheet("Évolution");
  ajusterColonnes(evolution, [20, 14]);
  styliserEntete(evolution.addRow(["Période", "Score global"]));
  for (const p of rapport.evolution) {
    evolution.addRow([p.periode, p.score ?? "—"]);
  }

  ajouterFeuilleTaches(classeur, rapport.taches);

  const buffer = await classeur.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function excelMission(rapport: RapportMission): Promise<Buffer> {
  const classeur = creerClasseur();

  const synthese = classeur.addWorksheet("Synthèse");
  ajusterColonnes(synthese, [34, 30]);

  synthese.addRow(["Rapport de fin de mission"]).font = { bold: true, size: 14 };
  synthese.addRow([]);
  synthese.addRow(["Mission", rapport.mission.nom]);
  synthese.addRow(["Description", rapport.mission.description ?? "—"]);
  synthese.addRow(["Début", formaterDate(rapport.mission.dateDebut)]);
  synthese.addRow([
    "Fin initialement prévue",
    formaterDate(rapport.mission.dateFinInitiale),
  ]);
  synthese.addRow([
    "Fin effective",
    formaterDate(
      rapport.mission.dateCloture ?? rapport.mission.dateFinActuelle,
    ),
  ]);
  synthese.addRow(["Durée (jours)", rapport.mission.dureeJours]);
  synthese.addRow(["Membres", rapport.membres.join(", ")]);
  synthese.addRow([]);
  synthese.addRow(["Tâches planifiées", rapport.chiffres.total]);
  synthese.addRow(["Réalisées", rapport.chiffres.terminees]);
  synthese.addRow(["Non abouties", rapport.chiffres.manquees]);
  synthese.addRow(["Encore en retard", rapport.chiffres.enRetard]);
  synthese.addRow(["Taux de complétion", `${rapport.chiffres.tauxCompletion} %`]);
  synthese.addRow([
    "Ponctualité moyenne",
    `${rapport.chiffres.ponctualiteMoyenne} %`,
  ]);
  synthese.addRow([
    "Qualité moyenne",
    rapport.chiffres.qualiteMoyenne === null
      ? "non évaluée"
      : `${rapport.chiffres.qualiteMoyenne} / 5`,
  ]);
  synthese.addRow([]);
  synthese.addRow(["Bilan qualitatif du manager"]).font = { bold: true };
  const bilan = synthese.addRow([rapport.mission.bilanQualitatif ?? "—"]);
  bilan.alignment = { wrapText: true, vertical: "top" };

  const membres = classeur.addWorksheet("Performance par membre");
  ajusterColonnes(membres, [6, 26, 20, 10, 12, 10, 10, 10, 10]);
  styliserEntete(
    membres.addRow([
      "Rang",
      "Membre",
      "Poste",
      "Score",
      "Complétion",
      "Délais",
      "Qualité",
      "Terminées",
      "Exigibles",
    ]),
  );
  rapport.parMembre.forEach((m, i) => {
    membres.addRow([
      i + 1,
      m.nom,
      m.poste ?? "—",
      m.scoreGlobal,
      m.tauxCompletion,
      m.ponctualite,
      m.qualiteNonEvaluee ? "—" : m.noteMoyenneSur5,
      m.nbTachesTerminees,
      m.nbTachesExigibles,
    ]);
  });

  if (rapport.prolongations.length > 0) {
    const prolongations = classeur.addWorksheet("Prolongations");
    ajusterColonnes(prolongations, [16, 16, 16, 14, 22, 44]);
    styliserEntete(
      prolongations.addRow([
        "Décidée le",
        "Ancienne échéance",
        "Nouvelle échéance",
        "Jours ajoutés",
        "Auteur",
        "Motif",
      ]),
    );
    for (const p of rapport.prolongations) {
      prolongations.addRow([
        p.date,
        p.ancienne,
        p.nouvelle,
        p.joursAjoutes,
        p.auteur ?? "—",
        p.motif ?? "—",
      ]);
    }
  }

  const avancement = classeur.addWorksheet("Avancement");
  ajusterColonnes(avancement, [20, 18]);
  styliserEntete(avancement.addRow(["Période", "Complétion (%)"]));
  for (const p of rapport.avancement) {
    avancement.addRow([p.periode, p.completion]);
  }

  ajouterFeuilleTaches(classeur, rapport.taches);

  const buffer = await classeur.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function ajouterFeuilleTaches(
  classeur: ExcelJS.Workbook,
  taches: RapportIndividuel["taches"],
) {
  const feuille = classeur.addWorksheet("Tâches");
  ajusterColonnes(feuille, [42, 24, 24, 14, 14, 14, 10, 10, 14]);

  styliserEntete(
    feuille.addRow([
      "Tâche",
      "Assignée à",
      "Mission",
      "Échéance",
      "Statut",
      "Terminée le",
      "Note",
      "Priorité",
      "Origine",
    ]),
  );

  for (const t of taches) {
    const ligne = feuille.addRow([
      t.titre,
      t.assignes,
      t.mission,
      t.echeance,
      t.statut,
      t.dateFin || "—",
      t.noteQualite ?? "—",
      t.priorite,
      t.origine,
    ]);

    if (t.enRetard) {
      ligne.getCell(5).font = { color: { argb: "FFD03B3B" }, bold: true };
    }
  }

  // Filtres sur l'en-tête : la feuille sert aussi d'outil d'analyse.
  feuille.autoFilter = { from: "A1", to: "I1" };
  feuille.views = [{ state: "frozen", ySplit: 1 }];
}

export async function excelRaci(rapport: RapportRaci): Promise<Buffer> {
  const classeur = creerClasseur();

  const synthese = classeur.addWorksheet("Synthèse");
  ajusterColonnes(synthese, [38, 30]);
  synthese.addRow(["Matrice RACI de passation"]).font = { bold: true, size: 14 };
  synthese.addRow([]);
  synthese.addRow(["Périmètre", rapport.perimetre]);
  synthese.addRow(["Établi le", formaterDate(rapport.genereLe)]);
  synthese.addRow([]);
  synthese.addRow(["Activités ouvertes", rapport.chiffres.total]);
  synthese.addRow(["Dont en retard", rapport.chiffres.enRetard]);
  synthese.addRow(["À reprendre immédiatement", rapport.chiffres.immediates]);
  synthese.addRow(["Échéance sous 7 jours", rapport.chiffres.sousSeptJours]);
  synthese.addRow(["Sans approbateur défini", rapport.chiffres.sansApprobateur]);
  synthese.addRow([]);
  synthese.addRow(["Convention de lecture"]).font = { bold: true };
  synthese.addRow(["R — Responsable", "Exécute l'activité"]);
  synthese.addRow(["A — Approbateur", "Valide et rend des comptes (N+1 du responsable)"]);
  synthese.addRow(["C — Consulté", "A créé l'activité ou est intervenu dans sa discussion"]);
  synthese.addRow(["I — Informé", "Encadrement et autres membres de la mission"]);

  const matrice = classeur.addWorksheet("Matrice RACI");
  ajusterColonnes(matrice, [44, 22, 26, 26, 24, 30, 12, 14, 12, 12, 12]);
  styliserEntete(
    matrice.addRow([
      "Activité",
      "Mission",
      "R — Responsable",
      "A — Approbateur",
      "C — Consulté",
      "I — Informé",
      "Priorité",
      "Échéance",
      "Statut",
      "Criticité",
      "Jours restants",
    ]),
  );

  for (const l of rapport.lignes) {
    const ligne = matrice.addRow([
      l.activite,
      l.mission,
      l.responsable,
      l.approbateur,
      l.consultes,
      l.informes,
      l.priorite,
      l.echeance,
      l.statut,
      l.criticite,
      l.enRetard ? -l.joursDeReport : l.joursRestants,
    ]);

    if (l.criticite === "Immédiate") {
      ligne.getCell(10).font = { color: { argb: "FFD03B3B" }, bold: true };
      ligne.getCell(8).font = { color: { argb: "FFD03B3B" }, bold: true };
    }
    if (l.approbateur === "Non défini") {
      ligne.getCell(4).font = { color: { argb: "FFD03B3B" } };
    }
    ligne.alignment = { vertical: "top", wrapText: true };
  }

  matrice.autoFilter = { from: "A1", to: "K1" };
  matrice.views = [{ state: "frozen", ySplit: 1 }];

  const charge = classeur.addWorksheet("Charge par intervenant");
  ajusterColonnes(charge, [34, 20, 18]);
  styliserEntete(
    charge.addRow(["Responsable", "Activités ouvertes", "Dont en retard"]),
  );
  for (const r of rapport.repartition) {
    charge.addRow([r.responsable, r.total, r.enRetard]);
  }

  const buffer = await classeur.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
