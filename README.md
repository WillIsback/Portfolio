# Portfolio William Derue

[![Site Web](https://img.shields.io/badge/🌐_Site_Officiel-willisback.fr-blue?style=for-the-badge)](https://willisback.fr)

Un portfolio moderne et interactif showcase de mes projets fullstack, mes compétences et mon expertise en intelligence artificielle.

## À Propos

Je suis **William Derue**, développeur fullstack spécialisé en IA, basé dans le sud de la France. Après 7 ans en tant qu'automaticien dans le secteur de l'énergie, j'ai décidé de basculer vers l'informatique logiciel pour explorer les possibilités infinies qu'offre l'intelligence artificielle.

Mon parcours : **De la Data à la Décision**

- **2015-2022** : Automaticien dans le secteur de l'énergie, construisant des petites centrales électriques
- **2023-2024** : Développeur C++, exploration de diverses technologies
- **Nov 2024** : Administrateur Système au Ministère de l'Éducation nationale
- **2025-2026** : Formation Développeur FullStack IA - OpenClassrooms
- **Janv 2026** : Membre de la cellule IA - DSI Régionale

Ce portfolio est une vitrine de mes compétences techniques et de ma passion pour créer des architectures fullstack propulsées par l'intelligence artificielle.

## Fonctionnalités

- Portfolio dynamique avec showcase de projets et filtrage
- Visualisation interactive de la stack technologique (animation isométrique)
- Formulaire de contact avec validation en temps réel
- Design responsive avec composants modernes
- Optimisé SEO et prêt pour la production
- Support du mode sombre/clair
- Gestion de contenu basée sur base de données

## Stack Technologique

### Frontend

- Next.js 16 avec App Router & Turbopack
- React 19 avec Server/Client Components
- TypeScript pour la sécurité des types
- TailwindCSS pour le design utilitaire
- Framer Motion pour les animations fluides
- Composants Shadcn/ui

### Backend

- Node.js avec API Routes Next.js
- Prisma ORM pour la gestion de base de données
- TypeScript pour la cohérence du typage
- Zod pour la validation en temps réel

### Base de Données

- SQLite (Développement)
- PostgreSQL (Production-ready)

### DevOps & Outils

- Docker & Docker Compose
- GitHub Actions
- Biome pour la mise en forme du code
- ESLint pour la qualité du code
- Playwright pour les tests

### Gestionnaire de Paquets

- pnpm avec support des workspaces

## Démarrage Rapide

### Prérequis

- Node.js 18+
- pnpm installé globalement
- Docker (optionnel)

### Installation

```bash
# Cloner le repository
git clone <repository-url>
cd portfolio

# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp .env.example .env.local

# Initialiser la base de données
pnpm prisma migrate dev
pnpm prisma db seed
```

### Développement

```bash
# Lancer le serveur de développement
pnpm dev

# Ouvrir le navigateur
open http://localhost:3001

# Vérifier la qualité du code
pnpm run lint
pnpm run format

# Lancer les tests
pnpm test

# Lancer le build avec les datas JSON
USE_JSON_DATA=true pnpm build

```

### Gestion de la Base de Données

```bash
# Générer le client Prisma
pnpm prisma generate

# Exécuter les migrations
pnpm prisma migrate dev

# Ouvrir l'interface graphique Prisma
pnpm prisma studio

# Peupler la base de données
pnpm prisma db seed
```

## Structure du Projet

```
portfolio/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Page d'accueil avec hero et showcase
│   ├── layout.tsx           # Layout racine
│   ├── globals.css          # Styles globaux
│   ├── About/               # Page à propos avec timeline
│   ├── Contact/             # Formulaire de contact
│   ├── actions/             # Server actions
│   ├── assets/              # Assets statiques
│   └── data/                # Données statiques (projets)
├── components/              # Composants réutilisables
│   ├── Header/              # En-tête avec navigation
│   ├── Footer/              # Pied de page
│   ├── ProjectGrid/         # Showcase des projets
│   │   └── ProjectCard/     # Carte projet avec badge IA
│   ├── Skills/              # Section compétences
│   │   ├── SkillsStack.tsx  # Animation cube isométrique
│   │   ├── FrontEnd.tsx
│   │   ├── ApiBackend.tsx
│   │   ├── DataBase.tsx
│   │   └── DevOps.tsx
│   ├── animation/           # Composants animés
│   │   └── HeroPrompt.tsx   # Prompt interactif hero
│   ├── ui/                  # Primitives UI
│   └── ErrorBoundary.tsx    # Gestion des erreurs
├── hooks/                   # Hooks personnalisés
│   └── useFormValidation.ts # Validation de formulaires
├── lib/                     # Utilitaires et helpers
│   ├── db.ts               # Client Prisma
│   └── utils.ts            # Fonctions utilitaires
├── prisma/                 # Schéma et migrations
│   ├── schema.prisma       # Définition du schéma
│   ├── seed.ts             # Population de données
│   └── migrations/         # Historique des migrations
├── public/                 # Fichiers statiques
├── schemas/                # Schémas de validation Zod
├── package.json            # Dépendances et scripts
├── tsconfig.json          # Configuration TypeScript
├── next.config.ts         # Configuration Next.js
├── biome.json             # Configuration du formateur
└── README.md              # Ce fichier
```

## Variables d'Environnement

Créer un fichier `.env.local` contenant :

```env
# Base de données
DATABASE_URL="file:./dev.db"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3001"

# Endpoints API
NEXT_PUBLIC_API_URL="http://localhost:3001/api"

# Email (pour le formulaire de contact)
RESEND_API_KEY="votre_clé_api_resend"
```

## Scripts Disponibles

```bash
# Développement
pnpm dev                    # Lancer le serveur de dev
pnpm build                  # Builder pour la production
pnpm start                  # Démarrer le serveur de prod

# Qualité du code
pnpm lint                   # Lancer ESLint
pnpm format                 # Formater avec Biome
pnpm type-check             # Vérifier les types TypeScript

# Base de données
pnpm prisma migrate dev     # Créer des migrations
pnpm prisma studio         # Ouvrir Prisma Studio

# Tests
pnpm test                   # Lancer les tests
pnpm test:watch            # Mode watch
```

## Fonctionnalités Clés

### Stack Technologique Interactif

Le portfolio intègre une **animation cube isométrique** interactive qui se construit progressivement en scrollant, représentant les différentes couches technologiques :

```
DevOps (Foundation)
Frontend Framework
API Backend
Database
```

Chaque bloc s'empile avec fluidité pour créer une visualisation captivante de mon écosystème technique.

### Showcase Projets

Une grille dynamique affiche mes projets avec :

- **Badge IA** (violet-fuschia) pour les projets générés ou guidés par l'IA
- **Filtrage avancé** par langage, technologie, framework
- **Images optimisées** avec Next.js Image component
- **Description détaillée** de chaque projet

### Formulaire de Contact

Un formulaire complet avec :

- Validation en temps réel avec Zod
- Messages d'erreur contextuels
- Notifications toast (Sonner)
- Gestion côté serveur robuste

### Page À Propos

Une timeline interactive racontant mon parcours :

- Automaticien → Développeur C++ → Admin Système → Cellule IA

Avec des animations fluides et un design responsive.

## Schéma Base de Données

Prisma gère :

- **Projects** : Métadonnées et contenu des projets
- **Technologies** : Relations many-to-many avec les projets
- **Skills** : Compétences par domaine (Frontend, Backend, Database, DevOps)

### Exemple de Project

```json
{
  "id": 1,
  "name": "Cléa",
  "description": "Application RAG (Retrieval Augmented Generation)",
  "image": "/images/clea.png",
  "github": "https://github.com/WillIsback/clea",
  "isAiGenerated": true,
  "technologies": ["Python", "LangChain", "FastAPI"]
}
```

## Déploiement

### Vercel (Recommandé)

```bash
# Pousser sur GitHub
git push origin main

# Connecter le repository à Vercel
# Vercel détecte automatiquement Next.js et configure le build
```

### Docker

```bash
# Builder l'image
docker build -t portfolio .

# Lancer le container
docker run -p 3001:3001 portfolio
```

### Configuration pour la Production

Mettre à jour `.env.production` :

```env
DATABASE_URL="postgresql://user:password@host/portfolio"
NEXT_PUBLIC_APP_URL="https://votredomaine.com"
RESEND_API_KEY="votre_clé_production"
```

## Optimisations de Performance

- Optimisation d'images avec Next.js Image
- Code splitting et lazy loading automatiques
- Requêtes optimisées avec Prisma
- CSS-in-JS avec TailwindCSS
- Stratégies de caching intégrées
- Turbopack pour builds ultra-rapides

## Support des Navigateurs

- Chrome (dernière version)
- Firefox (dernière version)
- Safari (dernière version)
- Edge (dernière version)

## Contribution

1. Créer une branche feature
2. Faire vos modifications
3. Lancer les tests et la validation du code
4. Soumettre une pull request

## Licence

MIT

## Contact

Pour toute question ou proposition :

- Utilisez le formulaire de contact sur le portfolio
- Ouvrez une issue sur le repository GitHub
- Connectez-vous avec moi sur LinkedIn

---

**William Derue** | Développeur FullStack IA | Sud de la France
