import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Priorite, type TaskStatut } from "@prisma/client";
import { addDays, endOfDay, subDays } from "date-fns";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const MOT_DE_PASSE_DEMO = "demo1234";
const AUJOURDHUI = new Date();

const EQUIPE = [
  { nom: "Claire Dubois", email: "claire.dubois@demo.fr", poste: "Chargée de projet" },
  { nom: "Marc Lefèvre", email: "marc.lefevre@demo.fr", poste: "Analyste" },
  { nom: "Fatou Diallo", email: "fatou.diallo@demo.fr", poste: "Consultante" },
  { nom: "Thomas Bernard", email: "thomas.bernard@demo.fr", poste: "Développeur" },
  { nom: "Léa Moreau", email: "lea.moreau@demo.fr", poste: "Designer" },
  { nom: "Yanis Benali", email: "yanis.benali@demo.fr", poste: "Support client" },
];

const POIDS_KPI = [
  { critere: "tauxCompletion", libelle: "Taux de complétion", poids: 0.25 },
  { critere: "ponctualite", libelle: "Respect des délais", poids: 0.25 },
  { critere: "noteQualite", libelle: "Note qualité", poids: 0.25 },
  { critere: "volume", libelle: "Volume de travail", poids: 0.25 },
];

/** Profils de performance contrastés, pour que le classement ait du relief. */
const PROFILS: Record<
  string,
  { completion: number; ponctualite: number; qualite: number; volume: number }
> = {
  "claire.dubois@demo.fr": { completion: 0.92, ponctualite: 0.95, qualite: 5, volume: 14 },
  "marc.lefevre@demo.fr": { completion: 0.78, ponctualite: 0.8, qualite: 4, volume: 11 },
  "fatou.diallo@demo.fr": { completion: 0.85, ponctualite: 0.88, qualite: 4, volume: 13 },
  "thomas.bernard@demo.fr": { completion: 0.65, ponctualite: 0.6, qualite: 3, volume: 12 },
  "lea.moreau@demo.fr": { completion: 0.88, ponctualite: 0.7, qualite: 4, volume: 9 },
  "yanis.benali@demo.fr": { completion: 0.55, ponctualite: 0.5, qualite: 3, volume: 8 },
};

const TITRES_TACHES = [
  "Préparer le point hebdomadaire",
  "Mettre à jour le tableau de suivi",
  "Rédiger le compte rendu client",
  "Relancer les fournisseurs",
  "Analyser les retours utilisateurs",
  "Corriger les anomalies remontées",
  "Préparer la maquette de la page d'accueil",
  "Vérifier les indicateurs de la semaine",
  "Répondre aux tickets en attente",
  "Documenter la procédure interne",
  "Planifier les entretiens de suivi",
  "Consolider le budget prévisionnel",
  "Tester le parcours de commande",
  "Former un nouveau collaborateur",
  "Réviser le cahier des charges",
];

/**
 * Générateur déterministe (mulberry32) : deux seeds successifs produisent le
 * même jeu. Math.imul garde les calculs en 32 bits ; un LCG écrit en
 * arithmétique flottante perdrait ses bits de poids faible et sortirait des
 * valeurs corrélées.
 */
function creerAleatoire(graine: number) {
  let etat = graine >>> 0;
  return () => {
    etat = (etat + 0x6d2b79f5) | 0;
    let t = Math.imul(etat ^ (etat >>> 15), 1 | etat);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const alea = creerAleatoire(20260915);

function choisir<T>(liste: T[]): T {
  return liste[Math.floor(alea() * liste.length)];
}

async function main() {
  const hash = await bcrypt.hash(MOT_DE_PASSE_DEMO, 12);

  const manager = await prisma.user.upsert({
    where: { email: "manager@demo.fr" },
    update: {},
    create: {
      nom: "Sophie Martin",
      email: "manager@demo.fr",
      motDePasse: hash,
      role: "MANAGER",
      poste: "Manager d'équipe",
    },
  });

  const membres = [];
  for (const membre of EQUIPE) {
    membres.push(
      await prisma.user.upsert({
        where: { email: membre.email },
        update: {},
        create: { ...membre, motDePasse: hash, role: "MEMBER" },
      }),
    );
  }

  for (const p of POIDS_KPI) {
    await prisma.kpiWeightConfig.upsert({
      where: { critere: p.critere },
      update: {},
      create: p,
    });
  }

  // Jeu de démonstration rejouable : on repart des mêmes missions à chaque seed.
  await prisma.task.deleteMany({});
  await prisma.mission.deleteMany({});

  const missionRefonte = await prisma.mission.create({
    data: {
      nom: "Refonte du portail client",
      description:
        "Reprise complète de l'espace client : parcours, design et performance.",
      type: "PROJET",
      statut: "ACTIVE",
      dateDebut: subDays(AUJOURDHUI, 45),
      dateFinInitiale: endOfDay(addDays(AUJOURDHUI, 2)),
      dateFinActuelle: endOfDay(addDays(AUJOURDHUI, 2)),
      membres: {
        create: membres.slice(0, 4).map((m) => ({ userId: m.id })),
      },
    },
  });

  const missionAudit = await prisma.mission.create({
    data: {
      nom: "Audit qualité fournisseurs",
      description: "Revue des 12 fournisseurs principaux avant renégociation.",
      type: "PROJET",
      statut: "EN_ATTENTE_DECISION",
      dateDebut: subDays(AUJOURDHUI, 70),
      dateFinInitiale: endOfDay(subDays(AUJOURDHUI, 20)),
      dateFinActuelle: endOfDay(subDays(AUJOURDHUI, 4)),
      membres: {
        create: [membres[1], membres[2]].map((m) => ({ userId: m.id })),
      },
      prolongations: {
        create: {
          dateDemande: subDays(AUJOURDHUI, 22),
          ancienneEcheance: endOfDay(subDays(AUJOURDHUI, 20)),
          nouvelleEcheance: endOfDay(subDays(AUJOURDHUI, 4)),
          motif: "Deux fournisseurs ont répondu hors délai au questionnaire.",
          auteurId: manager.id,
        },
      },
    },
  });

  const missionCycle = await prisma.mission.create({
    data: {
      nom: "Activité courante — cycle mensuel",
      description:
        "Suivi continu de l'activité de l'équipe, hors projets ponctuels.",
      type: "CYCLE_RECURRENT",
      statut: "ACTIVE",
      dateDebut: subDays(AUJOURDHUI, 90),
      dateFinInitiale: endOfDay(addDays(AUJOURDHUI, 180)),
      dateFinActuelle: endOfDay(addDays(AUJOURDHUI, 180)),
      membres: { create: membres.map((m) => ({ userId: m.id })) },
    },
  });

  const missionCloturee = await prisma.mission.create({
    data: {
      nom: "Migration de l'outil de facturation",
      description: "Bascule vers le nouveau logiciel comptable.",
      type: "PROJET",
      statut: "CLOTUREE",
      dateDebut: subDays(AUJOURDHUI, 160),
      dateFinInitiale: endOfDay(subDays(AUJOURDHUI, 100)),
      dateFinActuelle: endOfDay(subDays(AUJOURDHUI, 80)),
      dateCloture: subDays(AUJOURDHUI, 78),
      membres: {
        create: [membres[0], membres[3], membres[5]].map((m) => ({
          userId: m.id,
        })),
      },
      prolongations: {
        create: {
          dateDemande: subDays(AUJOURDHUI, 103),
          ancienneEcheance: endOfDay(subDays(AUJOURDHUI, 100)),
          nouvelleEcheance: endOfDay(subDays(AUJOURDHUI, 80)),
          motif: "Reprise des historiques de facturation plus longue que prévu.",
          auteurId: manager.id,
        },
      },
    },
  });

  const missionsParMembre = new Map<string, string[]>();
  for (const m of membres) missionsParMembre.set(m.id, [missionCycle.id]);
  for (const m of membres.slice(0, 4)) {
    missionsParMembre.get(m.id)!.push(missionRefonte.id);
  }
  for (const m of [membres[1], membres[2]]) {
    missionsParMembre.get(m.id)!.push(missionAudit.id);
  }
  for (const m of [membres[0], membres[3], membres[5]]) {
    missionsParMembre.get(m.id)!.push(missionCloturee.id);
  }

  let total = 0;

  for (const membre of membres) {
    const profil = PROFILS[membre.email];
    const missionsPossibles = missionsParMembre.get(membre.id)!;

    for (let i = 0; i < profil.volume; i++) {
      // Les premières tâches tombent volontairement sur la semaine en cours :
      // sans cela, un tirage uniforme sur deux mois laisse les vues « Aujourd'hui »
      // et « Cette semaine » vides à l'ouverture de la démo.
      const decalage =
        i === 0
          ? 0
          : i === 1
            ? 1 + Math.floor(alea() * 3)
            : i === 2
              ? -1 - Math.floor(alea() * 3)
              : i === 3
                ? 4 + Math.floor(alea() * 7)
                : Math.floor(alea() * 56) - 35;
      const echeance = endOfDay(addDays(AUJOURDHUI, decalage));
      const passee = decalage < 0;

      const missionId =
        alea() < 0.75 ? choisir(missionsPossibles) : null;

      let statut: TaskStatut = "A_FAIRE";
      let dateFin: Date | null = null;
      let noteQualite: number | null = null;

      if (passee) {
        if (alea() < profil.completion) {
          statut = "TERMINEE";
          // Certaines livraisons tombent après l'échéance : c'est ce qui fait
          // varier le critère de ponctualité entre les membres.
          const enRetard = alea() > profil.ponctualite;
          dateFin = enRetard
            ? addDays(echeance, 1 + Math.floor(alea() * 4))
            : subDays(echeance, Math.floor(alea() * 3));
          noteQualite = Math.max(
            1,
            Math.min(5, profil.qualite + (alea() < 0.3 ? -1 : 0)),
          );
        } else {
          statut = alea() < 0.5 ? "EN_COURS" : "A_FAIRE";
        }
      } else {
        const tirage = alea();
        statut =
          tirage < 0.25 ? "EN_COURS" : tirage < 0.35 ? "EN_ATTENTE" : "A_FAIRE";
      }

      const priorite: Priorite =
        alea() < 0.2 ? "HAUTE" : alea() < 0.6 ? "MOYENNE" : "BASSE";

      const autoDeclaree = alea() < 0.3;

      await prisma.task.create({
        data: {
          titre: choisir(TITRES_TACHES),
          description: null,
          missionId,
          periodicite: alea() < 0.3 ? "HEBDOMADAIRE" : "PONCTUELLE",
          echeance,
          priorite,
          statut,
          dateFin,
          noteQualite,
          evaluateurId: noteQualite ? manager.id : null,
          dateEvaluation: noteQualite ? dateFin : null,
          origine: autoDeclaree ? "MEMBRE" : "MANAGER",
          createurId: autoDeclaree ? membre.id : manager.id,
          assignes: { create: { userId: membre.id } },
        },
      });
      total++;
    }
  }

  console.log("Seed terminé.");
  console.log(`Manager : ${manager.email} / ${MOT_DE_PASSE_DEMO}`);
  console.log(`${EQUIPE.length} membres (mot de passe : ${MOT_DE_PASSE_DEMO})`);
  console.log(`4 missions et ${total} tâches créées.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
