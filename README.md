# Outil de Gestion & d'Évaluation de Performance d'Équipe

Application web de planification, de suivi et d'évaluation de la performance d'une
équipe de 6 à 15 personnes. Interface entièrement en français.

## Fonctionnalités

| Étape | Contenu | État |
| --- | --- | --- |
| 1 | Fondations : schéma de données, authentification, rôles | ✅ Terminée |
| 2 | Missions et tâches : CRUD, vues jour/semaine/mois, cycle de vie | 🚧 En cours |
| 3 | KPIs, score de performance, dashboard manager | ⏳ |
| 4 | Dashboard membre | ⏳ |
| 5 | Notifications email et in-app | ⏳ |
| 6 | Rapports PDF et Excel | ⏳ |
| 7 | Déploiement Vercel + jeu de démonstration | ⏳ |

## Stack technique

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (variante Radix)
- **PostgreSQL** (Neon, plan gratuit) + **Prisma 7** avec le driver adapter `@prisma/adapter-pg`
- **NextAuth v5 (Auth.js)** — authentification email/mot de passe, rôles `MANAGER` / `MEMBER`
- **Recharts** pour les graphiques
- **Resend** pour les emails, **Vercel Cron** pour les tâches planifiées (étape 5)
- **@react-pdf/renderer** et **exceljs** pour les exports (étape 6)

## Lancer le projet en local

### 1. Prérequis

- Node.js 20 ou plus
- Un projet PostgreSQL gratuit sur [Neon](https://neon.tech)

> **Windows** : placez le projet dans un dossier dont le chemin ne contient ni `&`
> ni apostrophe. `npm run` et `npx` échouent sur ces caractères.

### 2. Installation

```bash
npm install
```

### 3. Variables d'environnement

Copiez `.env.example` vers `.env` et renseignez les valeurs :

```bash
cp .env.example .env
```

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | URL Neon **avec** pooler (`-pooler` dans l'hôte) — utilisée par l'application |
| `DIRECT_URL` | URL Neon **sans** pooler — utilisée par les migrations Prisma |
| `AUTH_SECRET` | Secret de signature des sessions. Générer avec `npx auth secret` |
| `AUTH_URL` | `http://localhost:3000` en local, l'URL Vercel en production |
| `RESEND_API_KEY` | Clé API Resend pour les emails (étape 5) |
| `CRON_SECRET` | Protège les routes de cron Vercel (étape 5) |

### 4. Base de données

```bash
npm run db:migrate
npm run db:seed
```

### 5. Démarrage

```bash
npm run dev
```

L'application est disponible sur http://localhost:3000.

### Comptes de démonstration

Après le seed, le mot de passe est `demo1234` pour tous les comptes.

| Rôle | Email |
| --- | --- |
| Manager | `manager@demo.fr` |
| Membre | `claire.dubois@demo.fr`, `marc.lefevre@demo.fr`, `fatou.diallo@demo.fr`, `thomas.bernard@demo.fr`, `lea.moreau@demo.fr`, `yanis.benali@demo.fr` |

Sur une base vierge (sans seed), la page `/inscription` permet de créer le tout
premier compte manager. Elle se ferme automatiquement dès qu'un compte existe :
ensuite, seuls les managers créent les comptes des membres.

## Scripts disponibles

| Script | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production (génère aussi le client Prisma) |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Crée et applique une migration (développement) |
| `npm run db:deploy` | Applique les migrations existantes (production) |
| `npm run db:seed` | Insère le jeu de données de démonstration |
| `npm run db:studio` | Ouvre Prisma Studio |

## Déploiement gratuit sur Vercel

1. Poussez le dépôt sur GitHub.
2. Sur [vercel.com](https://vercel.com), importez le dépôt (plan Hobby, gratuit).
3. Dans **Settings → Environment Variables**, ajoutez `DATABASE_URL`, `DIRECT_URL`,
   `AUTH_SECRET`, `AUTH_URL` (l'URL de production), `RESEND_API_KEY` et `CRON_SECRET`.
4. Déployez. Le script de build lance `prisma generate` automatiquement.
5. Appliquez les migrations sur la base de production :

   ```bash
   npm run db:deploy
   ```

## Organisation du code

```
prisma/
  schema.prisma        modèle de données
  seed.ts              jeu de données de démonstration
src/
  auth.ts              configuration NextAuth complète (accès base)
  auth.config.ts       configuration compatible Edge, utilisée par le proxy
  proxy.ts             contrôle d'accès par rôle sur chaque requête
  app/
    (app)/             espace authentifié (manager et membre)
    connexion/         page de connexion
    inscription/       création du premier compte manager
  components/ui/       composants shadcn/ui
  lib/
    prisma.ts          client Prisma partagé
    actions/           server actions
```

## Choix de conception

- **Le statut « en retard » n'est pas stocké en base.** Il est déduit de l'échéance
  et du statut à chaque lecture, pour qu'il ne puisse jamais se désynchroniser
  quand une échéance est prolongée.
- **Le report quotidien ne réécrit jamais l'échéance.** Une tâche ouverte dont
  l'échéance est passée remonte automatiquement dans la vue « Aujourd'hui »
  jusqu'à ce qu'elle soit terminée ou annulée, avec le nombre de jours de report.
  Repousser la date en base ferait afficher 100 % de ponctualité à tout le monde
  en permanence et viderait le critère « respect des délais » de son sens.
- **Le point de contact d'une tâche est déduit de l'organigramme** (le N+1 de la
  personne assignée) plutôt que saisi sur la tâche : l'information reste juste
  quand quelqu'un change d'équipe.
- **Les rattachements hiérarchiques sont validés contre les cycles.** Le serveur
  remonte toute la chaîne avant d'accepter un N+1, car un organigramme cyclique
  ferait boucler indéfiniment le calcul des charges d'équipe.
- **Le contrôle d'accès vit dans `proxy.ts`, sans Prisma.** Le runtime Edge de Vercel
  n'exécute pas Prisma : le rôle transite donc par le JWT de session.
- **Les poids des 4 critères du score sont en base** (`KpiWeightConfig`) et non dans
  le code, pour être ajustables sans redéploiement.
