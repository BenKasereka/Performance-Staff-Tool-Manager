# Performance Staff Tool Manager

Outil de gestion et d'évaluation de la performance d'une équipe de 6 à 15 personnes.
Il remplace les to-do lists éparpillées par un véritable instrument managérial :
planification, suivi, mesure objective de la performance et production de documents
d'évaluation et de passation. Interface entièrement en français.

> Application de démonstration — les données visibles sont fictives.

## Ce que fait l'outil

**Planification et suivi**
- Missions-projets à échéance définie et cycles récurrents pour l'activité courante
- Tâches en attribution mixte : le manager assigne, le membre s'auto-déclare, et les
  deux origines restent distinguables au filtre
- Vues jour, semaine et mois, avec calendrier coloré par statut
- Report automatique : une tâche non clôturée remonte au planning du jour jusqu'à
  ce qu'elle soit terminée ou annulée
- Récurrence, fil de commentaires, priorités, périodicité

**Organisation**
- Organigramme à un supérieur par personne, avec service de rattachement
- Point de contact de chaque tâche déduit de l'organigramme
- Charge cumulée par encadrant, subordonnés inclus, pour objectiver la séparation
  des responsabilités

**Mesure de la performance**
- Score sur 100 combinant quatre critères pondérés : taux de complétion, respect
  des délais, note qualité et volume de travail
- Classement confidentiel, réservé aux managers
- Courbes d'évolution par membre et par équipe
- Espace membre sans aucune comparaison aux collègues

**Cycle de vie des missions**
- Alerte à J-3 de l'échéance, puis rappels quotidiens tant que la décision n'est
  pas prise
- Bascule automatique en « en attente de décision » : une mission ne se clôture ni
  ne se prolonge d'elle-même
- Prolongation par durée ou date précise, avec historique complet et motifs

**Documents produits**
- Rapport d'évaluation individuel, en PDF et Excel, utilisable en entretien
- Rapport de fin de mission : page de garde, sommaire, dix sections numérotées,
  bilan rédigé par le manager en six rubriques
- Matrice RACI de passation, limitée aux activités encore ouvertes, ordonnée selon
  l'urgence de reprise

**Notifications**
- Centre de notifications dans l'application
- Emails : récapitulatif quotidien, alerte de retard, échéance du lendemain, bilan
  hebdomadaire au manager, alertes de fin de mission

## Stack technique

| Domaine | Choix |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| Interface | Tailwind CSS v4 + shadcn/ui |
| Base de données | PostgreSQL (Neon) + Prisma 7 avec driver adapter `@prisma/adapter-pg` |
| Authentification | NextAuth v5 (Auth.js), rôles manager et membre |
| Graphiques | Recharts |
| Emails | Resend |
| Tâches planifiées | Vercel Cron |
| Exports | `@react-pdf/renderer` et `exceljs` |
| Hébergement | Vercel |

## Lancer le projet en local

### Prérequis

- Node.js 20 ou plus
- Un projet PostgreSQL gratuit sur [Neon](https://neon.tech)

> **Windows** : placez le projet dans un dossier dont le chemin ne contient ni `&`
> ni apostrophe. `npm run` et `npx` échouent sur ces caractères.

### Installation

```bash
npm install
cp .env.example .env
```

Renseignez ensuite `.env` :

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | URL Neon **avec** pooler — utilisée par l'application |
| `DIRECT_URL` | URL Neon **sans** pooler — utilisée par les migrations |
| `AUTH_SECRET` | Secret de session. Générer avec `npx auth secret` |
| `AUTH_URL` | `http://localhost:3000` en local, l'URL Vercel en production |
| `RESEND_API_KEY` | Clé Resend pour les emails. Sans elle, seules les notifications in-app fonctionnent |
| `EMAIL_FROM` | Expéditeur des emails |
| `CRON_SECRET` | Protège les routes de cron |

### Base de données et démarrage

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

### Comptes de démonstration

Mot de passe commun : `demo1234`

| Rôle | Email |
| --- | --- |
| Manager | `manager@demo.fr` |
| Membres | `claire.dubois@demo.fr`, `marc.lefevre@demo.fr`, `fatou.diallo@demo.fr`, `thomas.bernard@demo.fr`, `lea.moreau@demo.fr`, `yanis.benali@demo.fr` |

Sur une base vierge, `/inscription` permet de créer le premier compte manager. La
page se ferme dès qu'un compte existe : ensuite, seuls les managers créent les accès.

## Déploiement sur Vercel

1. Poussez le dépôt sur GitHub.
2. Sur [vercel.com](https://vercel.com), importez le dépôt.
3. Dans **Settings → Environment Variables**, ajoutez `DATABASE_URL`, `DIRECT_URL`,
   `AUTH_SECRET`, `AUTH_URL` (l'URL de production), `RESEND_API_KEY`, `EMAIL_FROM`
   et `CRON_SECRET`.
4. Déployez — le script de build lance `prisma generate` automatiquement.
5. Appliquez les migrations sur la base de production :

   ```bash
   npm run db:deploy
   ```

Les deux crons déclarés dans `vercel.json` s'activent automatiquement : quotidien à
6 h, hebdomadaire le lundi à 7 h.

## Scripts

| Script | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Crée et applique une migration |
| `npm run db:deploy` | Applique les migrations existantes (production) |
| `npm run db:seed` | Jeu de données de démonstration |
| `npm run db:studio` | Prisma Studio |

## Organisation du code

```
prisma/
  schema.prisma        modèle de données
  seed.ts              jeu de démonstration
src/
  auth.ts              configuration NextAuth (accès base)
  auth.config.ts       configuration compatible Edge, utilisée par le proxy
  proxy.ts             contrôle d'accès par rôle à chaque requête
  app/
    (app)/             espace authentifié, manager et membre
    api/cron/          tâches planifiées Vercel
    api/rapports/      génération des PDF et Excel
  components/
    graphiques/        visualisations Recharts
  lib/
    kpi.ts             moteur de calcul du score
    organigramme.ts    arbre hiérarchique et charges cumulées
    rapports/          construction des documents
```

## Décisions de conception

Quelques partis pris qui expliquent le comportement de l'outil.

**Le statut « en retard » n'est pas stocké.** Il se déduit de l'échéance et du
statut à chaque lecture, pour qu'il ne puisse jamais se désynchroniser quand une
échéance est prolongée.

**Le report quotidien ne réécrit jamais l'échéance.** Une tâche ouverte dont
l'échéance est passée remonte dans la vue du jour avec son nombre de jours de
report, mais garde sa date d'origine. Repousser la date en base ferait afficher
100 % de ponctualité à tout le monde et viderait de son sens le critère « respect
des délais ».

**Les tâches pas encore échues ne comptent pas comme non faites.** Elles entrent au
dénominateur du taux de complétion quand leur échéance arrive, ou plus tôt si elles
sont déjà terminées. Sans cela, au milieu d'un mois, les échéances de fin de mois
écrasent le score de toute l'équipe.

**Une qualité non notée sort du score au lieu de valoir zéro.** Les poids sont alors
renormalisés sur les trois autres critères : un membre ne doit pas être pénalisé
pour une évaluation que son manager n'a pas faite.

**Le volume vaut 50 points à la moyenne de l'équipe**, 100 au double. Le critère ne
récompense donc pas mécaniquement celui à qui l'on assigne le plus de travail.

**Le score se calcule toujours sur l'équipe entière**, même pour afficher une seule
fiche, puisque le volume se normalise sur la moyenne des collègues.

**L'espace membre calcule sa progression séparément du score global**, qui contient
une comparaison implicite à l'équipe.

**Le contrôle d'accès vit dans `proxy.ts`, sans Prisma**, que le runtime Edge de
Vercel n'exécute pas : le rôle transite par le JWT de session.

**Les rôles RACI sont déduits, jamais saisis.** R est la personne assignée, A son
supérieur hiérarchique, C les personnes ayant créé la tâche ou commenté dessus.
L'information reste juste quand quelqu'un change d'équipe.

## Licence

Projet personnel de démonstration.
