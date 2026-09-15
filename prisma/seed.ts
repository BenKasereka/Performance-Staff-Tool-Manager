import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const MOT_DE_PASSE_DEMO = "demo1234";

const EQUIPE = [
  { nom: "Claire Dubois", email: "claire.dubois@demo.fr", poste: "Chargée de projet" },
  { nom: "Marc Lefèvre", email: "marc.lefevre@demo.fr", poste: "Analyste" },
  { nom: "Fatou Diallo", email: "fatou.diallo@demo.fr", poste: "Consultante" },
  { nom: "Thomas Bernard", email: "thomas.bernard@demo.fr", poste: "Développeur" },
  { nom: "Léa Moreau", email: "lea.moreau@demo.fr", poste: "Designer" },
  { nom: "Yanis Benali", email: "yanis.benali@demo.fr", poste: "Support client" },
];

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

  for (const membre of EQUIPE) {
    await prisma.user.upsert({
      where: { email: membre.email },
      update: {},
      create: { ...membre, motDePasse: hash, role: "MEMBER" },
    });
  }

  const poids = [
    { critere: "tauxCompletion", libelle: "Taux de complétion", poids: 0.25 },
    { critere: "ponctualite", libelle: "Respect des délais", poids: 0.25 },
    { critere: "noteQualite", libelle: "Note qualité", poids: 0.25 },
    { critere: "volume", libelle: "Volume de travail", poids: 0.25 },
  ];

  for (const p of poids) {
    await prisma.kpiWeightConfig.upsert({
      where: { critere: p.critere },
      update: {},
      create: p,
    });
  }

  console.log(`Seed terminé.`);
  console.log(`Manager : ${manager.email} / ${MOT_DE_PASSE_DEMO}`);
  console.log(`${EQUIPE.length} membres créés (mot de passe : ${MOT_DE_PASSE_DEMO})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
