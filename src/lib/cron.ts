import { addDays, startOfDay } from "date-fns";

import { prisma } from "@/lib/prisma";
import { envoyerEmail } from "@/lib/email";
import { notifier, notifierPlusieurs, urlApplication } from "@/lib/notifications";
import { formaterDate, intervalle } from "@/lib/dates";
import { JOURS_ALERTE_FIN_MISSION } from "@/lib/missions";

/**
 * Vérifie qu'un appel provient bien de Vercel Cron.
 *
 * Les routes de cron sont publiques sur Vercel : sans ce contrôle, n'importe qui
 * pourrait déclencher des envois d'emails en masse.
 */
export function cronAutorise(requete: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return requete.headers.get("authorization") === `Bearer ${secret}`;
}

export async function alerterTachesEnRetard() {
  const maintenant = new Date();

  const taches = await prisma.task.findMany({
    where: {
      statut: { notIn: ["TERMINEE", "ANNULEE"] },
      echeance: { lt: maintenant, gte: startOfDay(addDays(maintenant, -1)) },
    },
    select: {
      id: true,
      titre: true,
      echeance: true,
      assignes: { select: { userId: true } },
    },
  });

  for (const tache of taches) {
    await notifierPlusieurs(
      tache.assignes.map((a) => a.userId),
      {
        type: "TACHE_EN_RETARD",
        titre: `Tâche en retard : ${tache.titre}`,
        contenu: `L'échéance du ${formaterDate(tache.echeance)} est dépassée. La tâche reste à votre planning du jour jusqu'à sa clôture.`,
        lien: `/mon-espace/taches/${tache.id}`,
        email: true,
      },
    );
  }

  return taches.length;
}

export async function alerterEcheancesProches() {
  const demain = addDays(new Date(), 1);
  const jour = intervalle("jour", demain);

  const taches = await prisma.task.findMany({
    where: {
      statut: { notIn: ["TERMINEE", "ANNULEE"] },
      echeance: { gte: jour.debut, lte: jour.fin },
    },
    select: {
      id: true,
      titre: true,
      assignes: { select: { userId: true } },
    },
  });

  for (const tache of taches) {
    await notifierPlusieurs(
      tache.assignes.map((a) => a.userId),
      {
        type: "ECHEANCE_PROCHE",
        titre: `À rendre demain : ${tache.titre}`,
        contenu: "Cette tâche arrive à échéance demain.",
        lien: `/mon-espace/taches/${tache.id}`,
        email: true,
      },
    );
  }

  return taches.length;
}

export async function recapQuotidienMembres() {
  const jour = intervalle("jour", new Date());
  const maintenant = new Date();

  const membres = await prisma.user.findMany({
    where: { actif: true, role: "MEMBER" },
    select: { id: true, nom: true, email: true },
  });

  let envois = 0;

  for (const membre of membres) {
    // Report compris : les tâches ouvertes non échues restent au planning.
    const taches = await prisma.task.findMany({
      where: {
        assignes: { some: { userId: membre.id } },
        OR: [
          { echeance: { gte: jour.debut, lte: jour.fin } },
          {
            echeance: { lt: jour.debut },
            statut: { notIn: ["TERMINEE", "ANNULEE"] },
          },
        ],
        statut: { notIn: ["TERMINEE", "ANNULEE"] },
      },
      select: { titre: true, echeance: true },
      orderBy: { echeance: "asc" },
    });

    if (taches.length === 0) continue;

    const lignes = taches.map((t) =>
      t.echeance < jour.debut
        ? `• ${t.titre} (reportée depuis le ${formaterDate(t.echeance)})`
        : `• ${t.titre}`,
    );

    await notifier({
      userId: membre.id,
      type: "RECAP_QUOTIDIEN",
      titre: `Vos ${taches.length} tâche${taches.length > 1 ? "s" : ""} du jour`,
      contenu: lignes.join("\n"),
      lien: "/mon-espace/taches?g=jour",
    });

    const resultat = await envoyerEmail({
      destinataire: membre.email,
      sujet: `Vos ${taches.length} tâche${taches.length > 1 ? "s" : ""} du jour`,
      titre: `Bonjour ${membre.nom}, voici votre journée`,
      corps: [
        `${taches.length} tâche${taches.length > 1 ? "s sont" : " est"} à traiter aujourd'hui :`,
        ...lignes,
      ],
      lien: {
        url: `${urlApplication()}/mon-espace/taches?g=jour`,
        libelle: "Ouvrir mon planning",
      },
    });
    if (resultat.envoye) envois++;
  }

  void maintenant;
  return envois;
}

/** Alerte J-3 puis rappels quotidiens tant que la décision n'est pas prise (§3.1). */
export async function alerterFinDeMission() {
  const maintenant = new Date();
  const limite = addDays(maintenant, JOURS_ALERTE_FIN_MISSION);

  const managers = await prisma.user.findMany({
    where: { role: "MANAGER", actif: true },
    select: { id: true, email: true },
  });
  if (managers.length === 0) return { alertes: 0, rappels: 0 };

  const proches = await prisma.mission.findMany({
    where: {
      statut: "ACTIVE",
      type: "PROJET",
      dateFinActuelle: { gte: maintenant, lte: limite },
      alerteJ3EnvoyeeLe: null,
    },
  });

  for (const mission of proches) {
    await notifierPlusieurs(
      managers.map((m) => m.id),
      {
        type: "MISSION_FIN_PROCHE",
        titre: `Fin de mission proche : ${mission.nom}`,
        contenu: `La mission se termine le ${formaterDate(mission.dateFinActuelle)}. Décidez de la clôturer — le rapport de fin de mission sera généré — ou de la prolonger avec une nouvelle échéance.`,
        lien: `/manager/missions/${mission.id}`,
        email: true,
      },
    );

    await prisma.mission.update({
      where: { id: mission.id },
      data: { alerteJ3EnvoyeeLe: maintenant },
    });
  }

  // Rappel une fois par jour, tant que la mission attend une décision.
  const enAttente = await prisma.mission.findMany({
    where: {
      statut: "EN_ATTENTE_DECISION",
      OR: [
        { dernierRappelDecisionLe: null },
        { dernierRappelDecisionLe: { lt: startOfDay(maintenant) } },
      ],
    },
  });

  for (const mission of enAttente) {
    await notifierPlusieurs(
      managers.map((m) => m.id),
      {
        type: "MISSION_EN_ATTENTE_DECISION",
        titre: `Décision attendue : ${mission.nom}`,
        contenu: `L'échéance du ${formaterDate(mission.dateFinActuelle)} est dépassée et la mission attend toujours votre arbitrage. Elle ne se clôturera ni ne se prolongera d'elle-même.`,
        lien: `/manager/missions/${mission.id}`,
        email: true,
      },
    );

    await prisma.mission.update({
      where: { id: mission.id },
      data: { dernierRappelDecisionLe: maintenant },
    });
  }

  return { alertes: proches.length, rappels: enAttente.length };
}

export async function recapHebdomadaireManager() {
  const semaine = intervalle("semaine", new Date());

  const managers = await prisma.user.findMany({
    where: { role: "MANAGER", actif: true },
    select: { id: true, nom: true, email: true },
  });
  if (managers.length === 0) return 0;

  const taches = await prisma.task.findMany({
    where: {
      echeance: { gte: semaine.debut, lte: semaine.fin },
      statut: { not: "ANNULEE" },
    },
    select: { statut: true, echeance: true },
  });

  const maintenant = new Date();
  const terminees = taches.filter((t) => t.statut === "TERMINEE").length;
  const enRetard = taches.filter(
    (t) => t.statut !== "TERMINEE" && t.echeance < maintenant,
  ).length;
  const taux =
    taches.length > 0 ? Math.round((terminees / taches.length) * 100) : 0;

  const missionsEnAttente = await prisma.mission.count({
    where: { statut: "EN_ATTENTE_DECISION" },
  });

  const corps = [
    `Sur la semaine écoulée : ${taches.length} tâche${taches.length > 1 ? "s" : ""}, ${terminees} terminée${terminees > 1 ? "s" : ""}, soit ${taux} % de complétion.`,
    enRetard > 0
      ? `${enRetard} tâche${enRetard > 1 ? "s sont" : " est"} en retard.`
      : "Aucune tâche en retard.",
    missionsEnAttente > 0
      ? `${missionsEnAttente} mission${missionsEnAttente > 1 ? "s attendent" : " attend"} votre décision.`
      : "Aucune mission en attente de décision.",
  ];

  let envois = 0;

  for (const manager of managers) {
    await notifier({
      userId: manager.id,
      type: "RECAP_HEBDO",
      titre: "Récapitulatif hebdomadaire de l'équipe",
      contenu: corps.join("\n"),
      lien: "/manager/performance?g=semaine",
    });

    const resultat = await envoyerEmail({
      destinataire: manager.email,
      sujet: "Récapitulatif hebdomadaire de l'équipe",
      titre: `Bonjour ${manager.nom}, le bilan de la semaine`,
      corps,
      lien: {
        url: `${urlApplication()}/manager/performance?g=semaine`,
        libelle: "Voir le classement",
      },
    });
    if (resultat.envoye) envois++;
  }

  return envois;
}
