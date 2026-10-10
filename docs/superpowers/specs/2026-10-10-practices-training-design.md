# Pratiques Ops et badge « Projet de formation » — design

Date : 2026-10-10 · Statut : validé par Will

## Intention

Ce que Will a dit :

- Les pratiques d'ingénierie de ses projets ne se résument pas à « GitHub Actions + Docker ». Il applique des
  pratiques **DevOps, SecOps et MLOps** de différentes manières, et le portfolio doit les montrer.
- Les projets de ses parcours OpenClassrooms (**Développeur FullStack IA**, **AI Engineer**) doivent porter un
  badge qui dit clairement que ce sont des **projets de formation OpenClassrooms**. Sur GitHub, ce sont souvent les
  dépôts `P*` ou `OC-*`.
- Badge minimal : « Projet de formation · OpenClassrooms · <parcours> ». **Pas de numéro de projet, pas d'intitulé
  officiel, pas d'état du parcours** : seul Will a accès au contenu du parcours, qui est payant.
- **Pas de création manuelle** de projet. Un projet sans dépôt GitHub public n'est pas référencé, et l'import GitHub
  reste la seule porte d'entrée.
- Les mentions **RNCP** sortent du portfolio (« trop pointu »).

Critère de réussite : un recruteur voit d'un coup d'œil (1) qu'un projet vient d'une formation OpenClassrooms, et
de quel parcours, et (2) quelles pratiques Ops y sont réellement appliquées.

Hors périmètre (YAGNI) :

- niveau de maturité par famille ;
- étiquettes libres ;
- pratiques dans le corpus de recherche sémantique, qui demanderait de régénérer le modèle ;
- création de projet sans dépôt.

## 1. Données

### Pratiques : liste fermée en trois familles

Un nouvel enum Prisma `Practice` et une table de jonction `ProjectPractice (projectId, practice)` ne remplacent rien :
ils s'ajoutent à l'existant, sur le modèle de `ProjectDomain`. Les outils restent dans la stack : `DevOps`
(Docker, GithubActions) est inchangé. Les pratiques décrivent ce qu'on fait avec.

| Famille | Valeur enum | Libellé affiché |
|---|---|---|
| DevOps | `ContinuousIntegration` | Intégration continue |
| DevOps | `Containerization` | Conteneurisation |
| DevOps | `ContinuousDeployment` | Déploiement automatisé |
| DevOps | `AutomatedTesting` | Tests automatisés |
| DevOps | `Observability` | Observabilité |
| SecOps | `DependencyUpdates` | Veille des dépendances |
| SecOps | `StaticAnalysis` | Analyse de code (SAST) |
| SecOps | `SecretsManagement` | Gestion des secrets |
| SecOps | `Hardening` | Durcissement |
| MLOps | `ExperimentTracking` | Suivi d'expériences |
| MLOps | `ModelRegistry` | Registre de modèles |
| MLOps | `DataVersioning` | Versionnage des données |
| MLOps | `ModelServing` | Service de modèle |
| MLOps | `LlmEvaluation` | Évaluation / monitoring LLM |

La famille et le libellé de chaque valeur vivent dans un seul module, `lib/practices.ts` : `PRACTICES` (ordre
d'affichage), `PRACTICE_FAMILY`, `PRACTICE_LABELS`, `FAMILIES = ["DevOps", "SecOps", "MLOps"]`, et des helpers
`practicesByFamily()` et `familiesOf()`. Ce module ne dépend d'aucun composant.

### Formation : colonne nullable

Un enum `Training { FullstackAI, AIEngineer }` et une colonne `Project.training Training?`. Une valeur nulle veut dire
« pas un projet de formation ». Les libellés sont dans `lib/training.ts` : `FullstackAI` donne « Développeur
FullStack IA » et `AIEngineer` donne « AI Engineer ».

### Migration

Comme jusqu'ici, la migration est additive et appliquée avec `prisma db push` : nouveaux enums, nouvelle table,
colonne nullable. Le client généré est committé. Aucune donnée existante n'est modifiée.

### Étiquetage initial

Un script idempotent `pnpm catalogue:training` (essai à blanc par défaut, `--apply` pour écrire) lit une table
versionnée, `lib/catalogue/initial-training.ts`, comme pour les domaines, et renseigne `training` sur les projets
existants. Les pratiques ne passent pas par un script : elles arrivent par « Analyser tout » sur l'écran de
synchronisation, qui utilise le jeton OAuth admin. Un script sans jeton dépasserait le quota anonyme de l'API
GitHub (60 requêtes/heure pour environ 8 requêtes par dépôt). Le diff des pratiques est additif (§3).

Affectation des parcours (validée par Will le 2026-10-10) :

| Parcours | Projets (id · titre) |
|---|---|
| Développeur FullStack IA | 1 Abricot.co (P11) · 10 SportSee · 11 Les Petits Plats · 12 Fashion Trend Intelligence · 6 OC-P10 TechNova · 7 OC-P9 Fisheye · 8 P8 Bottleneck · 9 OC-P7 DataImmo · 16 p12-phase2-zenassist · 17 p12-phase1-zenassist · 18 p12-zenassist-training-modernbert-cls · 19 P14-NewsFoundry · 26 P13-Fashion-Insta |
| AI Engineer | 27 OC-P5 Déployez un modèle de ML · 28 OC-Ai-Engineer-P3 |
| Aucun (projet perso pédagogique) | 5 TypeScript REST API Vanilla, ainsi que tous les autres projets |

Les pratiques qu'aucun fichier ne trahit (durcissement, registre de modèles, souvent gestion des secrets) se
cochent à la main dans la fiche éditoriale.

## 2. Détection depuis GitHub (suggestions)

`detectProject` renvoie un champ de plus, `practices`, calculé à partir de données que le bundle récupère déjà, plus
quelques chemins de l'arbre. Le bundle conserve désormais, en plus des Dockerfile et des workflows, les chemins
« marqueurs » ci-dessous, sans requête supplémentaire puisque l'arbre récursif est déjà chargé.

| Pratique | Règle (suffit d'une) |
|---|---|
| Intégration continue | fichier sous `.github/workflows/`, `.forgejo/workflows/` ou `.gitlab-ci.yml` |
| Conteneurisation | Dockerfile, ou `docker-compose.yml` / `compose.yaml` |
| Déploiement automatisé | nom de workflow contenant `deploy`, `release` ou `cd` (mot entier) ; ou `vercel.json` |
| Tests automatisés | dépendance `vitest`, `jest`, `pytest`, `@playwright/test`, `playwright` ; ou dossier `tests/`, `__tests__/` |
| Observabilité | dépendance `opentelemetry-*`, `@opentelemetry/*`, `prometheus-client`, `prom-client` |
| Veille des dépendances | `renovate.json`, `renovate.json5`, `.github/renovate.json*`, `.github/dependabot.yml` |
| Analyse de code (SAST) | nom de workflow contenant `codeql`, `semgrep`, `bandit` ; `.semgrep.yml` ; dépendance `bandit`, `semgrep` |
| Gestion des secrets | `.gitleaks.toml`, `.secrets.baseline`, nom de workflow contenant `gitleaks` ou `trufflehog` |
| Durcissement | aucune règle (manuel) |
| Suivi d'expériences | dépendance `mlflow`, `wandb`, `comet-ml`, `neptune` |
| Registre de modèles | aucune règle (manuel) |
| Versionnage des données | `dvc.yaml`, chemin sous `.dvc/`, fichier `*.dvc`, dépendance `dvc` |
| Service de modèle | dépendance `vllm`, `bentoml`, `torchserve`, `ray` ; image compose `vllm*` ; ou `fastapi` avec `torch`, `transformers` ou `scikit-learn` |
| Évaluation / monitoring LLM | dépendance `langfuse`, `ragas`, `deepeval`, `promptfoo`, `arize-phoenix` |

La formation n'est **pas déduite** automatiquement, car le nom d'un dépôt ne dit pas de quel parcours il vient. Le
tableau de synchronisation affiche seulement un indice, « Ressemble à un projet OpenClassrooms », sur l'import d'un
dépôt dont le nom correspond à `^(oc[-_]|p\d+[-_])` (insensible à la casse), et dans la fiche si `training` est vide.

## 3. Synchronisation et admin

- **Diff des pratiques additif.** `practices` rejoint les champs de liste du diff, mais il ne propose **que des
  ajouts** : `proposedList = actuel ∪ détecté`, `removed = []`. Une pratique cochée à la main n'est jamais retirée
  par une synchronisation.
- **Import** (`ImportForm`) : les pratiques détectées sont pré-cochées et modifiables. Un sélecteur « Formation »
  (aucune / Développeur FullStack IA / AI Engineer) est vide par défaut, avec l'indice OpenClassrooms si le nom
  correspond.
- **Fiche éditoriale** (`ProjectEditForm`) :
  - une section « Pratiques » avec trois groupes de cases, DevOps, SecOps et MLOps (réutilise `ChipGroup`) ;
  - un sélecteur « Formation ».
- **Validation.** `AdminProjectSchema` gagne :
  - `practices: z.array(PracticeEnum).max(PRACTICES.length)`, dédoublonné ;
  - `training: TrainingEnum.nullable()`.

  `createProject` et `updateProject` écrivent la table de jonction dans la même transaction que les autres listes.

## 4. Site public

Le registre est chargé côté client par `getProjects`, donc la home HTML n'est pas touchée (budget 14,6 Ko gzip).

- **Badge formation**, composant `TrainingBadge` :
  - texte « Projet de formation · OpenClassrooms · AI Engineer », en petites capitales mono, style « tampon »
    discret du carnet, avec une bordure pointillée ;
  - affiché sur `FeaturedCard` et `IndexRow`. Sur `IndexRow`, il est abrégé en « Formation OC · AI Engineer », avec
    le texte complet dans le `title` et en `sr-only`.
- **Pratiques**, composant `PracticeMarks` :
  - sur `FeaturedCard` : une ligne par famille présente (« MLOps — Suivi d'expériences, Service de modèle ») ;
  - sur `IndexRow` : seulement les familles présentes (« DevOps · MLOps »), avec la liste complète en `title` et en
    `sr-only` ;
  - rien n'est affiché si le projet n'a aucune pratique.
- **Filtres** (`FilterBar`) :
  - « Pratiques » : une famille, avec un paramètre d'URL `practice=DevOps|SecOps|MLOps` ;
  - « Formation » : tous / projets de formation / hors formation, avec un paramètre d'URL `training=only|exclude`.
- **Données** : `projects-v2` devient `projects-v3` pour la clé de cache, et `withProjectDefaults` complète
  `practices: []` et `training: null` sur un ancien objet en cache.

## 5. Page À propos : retrait des mentions RNCP

Dans `lib/about.ts` :

- **Étape « Diplômé Développeur full stack » :** on garde le titre et le fait que le parcours est validé en juillet
  2026, car c'est acquis. On retire « (RNCP42641), niveau 6 (bac +3/4, EQF 6) ».
- **Étape « Parcours AI Engineer » :** on retire « qui prépare au titre … enregistré au RNCP, niveau 7 … ». L'étape
  reste « en cours » et sans mention d'obtention.

Le test `lib/about.test.ts` est ajusté pour vérifier qu'aucune description ne contient « RNCP », « EQF » ni
« niveau 6/7 », et que la dernière étape est toujours « en cours », sans « obtenu » ni « diplômé ».

## Tests

- **Unitaires :**
  - `lib/practices.ts` : familles complètes, chaque pratique a exactement une famille, ordre stable ;
  - règles de détection, une par ligne du tableau, plus les faux positifs (`cd` dans `abcd.yml`, `.md` ignorés) ;
  - diff additif : rien n'est retiré, et pas de diff si rien de nouveau ;
  - schéma : enum, doublons, `training` nul ;
  - indice OpenClassrooms : `P13-Fashion-Insta`, `OC-P7-DataImmo` et `p12-…` correspondent ; `portfolio` et `ops-tools`
    ne correspondent pas.
- **Rendu SSR :** badge et marques sur `FeaturedCard` et `IndexRow`, rien sans données, texte `sr-only` présent ;
  filtres par famille et par formation.
- **Vérifications de livraison :** `pnpm test`, biome, eslint, `tsc --noEmit`, `pnpm build`, home ≤ 14,6 Ko gzip,
  CI (Aikido compris) verte.

## Livraison

Une seule PR. La migration additive est appliquée en prod avant le merge, comme pour la PR #14. Le script
d'étiquetage est lancé en prod juste avant le merge.
