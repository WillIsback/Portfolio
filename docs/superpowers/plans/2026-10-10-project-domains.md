# Domaines IA/Data des projets — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Ajouter une liste fermée de domaines IA/Data aux projets (schéma, admin, registre, filtres, recherche du carnet), étiqueter les 26 projets et retirer `isML` / `isIAG`.

**Architecture:** Enum Prisma `AiDomain` + table `ProjectDomain` (forme de `ProjectLanguage`). Logique pure dans `lib/domains.ts` (libellés, normalisation Classifier/Regressor ⇒ ML). Le type `NormalizedProject` gagne `domains: { domain: string }[]` comme les autres relations. Les écritures en base de production (db push, étiquetage) sont faites par le contrôleur, pas par les tâches.

**Tech Stack:** Next.js 16.1.4, React 19.2, Prisma 7 (client généré committé dans `prisma/generated/prisma`, `prisma db push`, Neon), zod 4, Vitest 4, Biome 2.3, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-10-project-domains-design.md`

**Base :** `main` à `1e0a3df`. Worktree `/home/will/dev-project/portfolio-domains`, branche `feat/project-domains`.

## Global Constraints
- Aucune nouvelle dépendance. Pas d'accès base au build. HTML de l'accueil < 14 600 o gzip.
- **Ne jamais écrire dans la base de production depuis une tâche** (pas de `prisma db push`, pas de script `--apply`) : `prisma generate` seulement (lit le schéma, n'écrit rien en base).
- Libellés (affichage) : DataAnalysis → « Data analyse », ML → « ML », Classifier → « Classification », Regressor → « Régression », LLM → « LLM », Vision → « Vision », NLP → « NLP », Agents → « Agents », Speech → « Parole ». Ordre d'affichage = cet ordre.
- Règle : `Classifier` ou `Regressor` ⇒ `ML`.
- Accessibilité AA ; textes en français ; avant chaque commit : `pnpm test`, `pnpm exec biome check --write`, `pnpm lint`, `pnpm exec tsc --noEmit` vide ; trailer `Co-Authored-By: <modèle réel> <noreply@anthropic.com>`.

## Review Focus
1. Projet sans domaine → aucune puce, pas de séparateur orphelin ; filtres sans domaine sélectionné → comportement actuel.
2. Admin : cocher Classifier sans ML → enregistré avec ML ; décocher tout → table vidée pour le projet.
3. Données JSON de secours (`USE_JSON_DATA`) → `domains: []`, rien ne casse.
4. Filtre « Domaine » combiné à un autre filtre → intersection (comme les filtres existants).
5. Mots-clés de la carte : libellés de domaines pliés (`normalizeKeyword`), texte des vecteurs inchangé.

---

### Task 1: Schéma (additif), client généré, `lib/domains.ts`, types et lecture
**Files:** `prisma/schema.prisma`, `prisma/generated/prisma/**` (régénéré par `pnpm exec prisma generate`), create `lib/domains.ts` + `lib/domains.test.ts`, `schemas/index.ts`, `lib/projects-data.ts`, `app/actions/projects.action.ts`.
- [ ] Schéma : ajouter `enum AiDomain { DataAnalysis ML Classifier Regressor LLM Vision NLP Agents Speech }`, `model ProjectDomain { id Int @id @default(autoincrement()) projectId Int domain AiDomain project Project @relation(fields: [projectId], references: [id], onDelete: Cascade) @@unique([projectId, domain]) }` (copier exactement la forme de `ProjectLanguage`, y compris un éventuel `@@index`) et `domains ProjectDomain[]` sur `Project`. **Garder `isML` / `isIAG` dans cette tâche** (retrait en tâche 5).
- [ ] `pnpm exec prisma generate` (la config lit `DIRECT_URL` mais `generate` n'en a pas besoin ; si elle l'exige, exporter une valeur factice `DIRECT_URL=postgresql://x@localhost/x` pour la commande — jamais la vraie). Committer le client régénéré.
- [ ] `lib/domains.ts` : `export const AI_DOMAINS = ["DataAnalysis","ML","Classifier","Regressor","LLM","Vision","NLP","Agents","Speech"] as const; export type AiDomain = (typeof AI_DOMAINS)[number]; export const DOMAIN_LABELS: Record<AiDomain, string> = {…libellés…}; export function normalizeDomains(input: readonly string[]): AiDomain[]` (filtre les valeurs inconnues, dédoublonne, ajoute ML si Classifier ou Regressor, trie dans l'ordre de `AI_DOMAINS`); `export function domainLabels(domains: { domain: string }[]): string[]`.
- [ ] Tests (`lib/domains.test.ts`) : normalisation (Classifier ⇒ ML ; Regressor ⇒ ML ; doublons ; valeur inconnue ignorée ; ordre) ; libellés dans l'ordre ; tableau vide.
- [ ] `schemas/index.ts` : `AiDomainEnum = z.enum(AI_DOMAINS)` ; `ProjectFiltersSchema` gagne `domain: z.array(AiDomainEnum).optional()` ; `AdminProjectSchema` gagne `domains: z.array(AiDomainEnum).default([])` (garder `isML`/`isIAG` pour l'instant).
- [ ] `lib/projects-data.ts` : `NormalizedProject.domains: { domain: string }[]` ; JSON → `domains: []`.
- [ ] `app/actions/projects.action.ts` : sélectionner `domains: true`, mapper `domains: p.domains.map((d) => ({ domain: d.domain }))`, filtre `filters.domain` → `where.domains = { some: { domain: { in: filters.domain } } }` (même forme que les autres) ; idem pour `getProjectById` si elle sélectionne les relations.
- [ ] Mettre à jour les fabriques de test qui construisent un `NormalizedProject` (`lib/register.test.ts`, `components/register/*.test.tsx`, …) avec `domains: []`.
- [ ] Commit `feat(catalogue): domaines IA/Data — schéma, client, lecture`.

### Task 2: Admin — cases de domaines
**Files:** `app/(admin)/admin/projects/[id]/ProjectEditForm.tsx`, `app/(admin)/admin/projects/[id]/page.tsx`, `app/actions/admin.action.ts`, `app/(admin)/admin/github/GitHubReposBrowser.tsx` (+ tests si un module pur est extrait).
- [ ] Formulaire : une fieldset « Domaines IA/Data » avec neuf cases (libellés `DOMAIN_LABELS`, ordre `AI_DOMAINS`), à la place des cases `isML` / `isIAG` (les retirer du formulaire ; le schéma admin les garde encore en défaut `false` jusqu'à la tâche 5).
- [ ] Action : dans la transaction qui remplace les relations, `tx.projectDomain.deleteMany({ where: { projectId } })` puis `createMany` avec `normalizeDomains(data.domains)` — même motif que les langages, en création et en mise à jour.
- [ ] Page d'édition : passer `domains` au formulaire. Import GitHub : `domains: []`.
- [ ] Test pur si possible (extraire `buildDomainRows(projectId, domains)` qui applique `normalizeDomains`) ; sinon test de source minimal.
- [ ] Commit `feat(admin): domaines IA/Data des projets`.

### Task 3: Registre — puces, filtre, projets phares
**Files:** `lib/register.ts` (+ test), `components/register/FeaturedCard.tsx`, `components/register/IndexRow.tsx`, `components/register/FilterBar.tsx`, `components/register/ProjectRegister.tsx` (parseFilters), tests associés.
- [ ] `selectFeatured` : « étiqueté » = `p.domains.length > 0` (au lieu de `isML || isIAG`). Tests mis à jour (un projet avec domaines passe devant un projet récent sans domaine ; complément jusqu'à 4 conservé).
- [ ] Puces : petit composant `DomainChips` (`components/register/DomainChips.tsx`) rendant `domainLabels` en `<ul aria-label="Domaines">` de puces `font-mono text-[11px]` bordées `border-primary/40 text-primary` ; rien si vide. Sur `FeaturedCard` (sous le titre) et `IndexRow` (dans la ligne des technologies, avant elles). Contraste AA du texte des puces (primary sur background : 7,5 / 5,7).
- [ ] `FilterBar` : liste « Domaine » (mêmes composants et motif que « Langage », paramètre d'URL `domain`, options `DOMAIN_LABELS`) ; `ProjectRegister.parseFilters` lit `domain` ; `filtersActive` en tient compte ; `NO_FILTERS` inchangé ou complété de façon stable.
- [ ] Tests : `DomainChips` (vide → rien ; libellés dans l'ordre) ; `IndexRow`/`FeaturedCard` montrent les puces ; parse du filtre.
- [ ] Commit `feat(registre): domaines IA/Data — puces, filtre, projets phares`.

### Task 4: Carte du carnet (mots-clés) et script d'étiquetage
**Files:** `lib/carnet/corpus.ts` (+ test), `scripts/carnet/load-corpus.ts`, create `scripts/catalogue/apply-domains.ts`, create `lib/catalogue/initial-domains.ts` (+ test), `package.json`.
- [ ] `ProjectForCorpus.domains: { domain: string }[]` ; `projectToCorpusItem` : `keywords` = technologies **+ libellés de domaines** (via `DOMAIN_LABELS`, passés à `normalizeKeyword`), **`text` inchangé**. Test : mots-clés contiennent « classification », texte identique à avant.
- [ ] `load-corpus.ts` sélectionne `domains`.
- [ ] `lib/catalogue/initial-domains.ts` : `INITIAL_DOMAINS: Record<number, AiDomain[]>` = tableau de la spec (ids → domaines), et test : chaque entrée est normalisée (Classifier/Regressor ⇒ ML présent), ids attendus présents, aucun id hors tableau.
- [ ] `scripts/catalogue/apply-domains.ts` : lit `INITIAL_DOMAINS`, charge les projets (id, titre) ; **par défaut essai à blanc** : affiche pour chaque projet titre, domaines actuels → domaines cibles ; avec `--apply` : pour chaque id du tableau (et seulement eux), transaction `deleteMany` + `createMany` (normalisés). Refuse si un id du tableau n'existe pas en base. Ne touche à rien d'autre. Script `"catalogue:domains": "tsx --env-file=.env.local scripts/catalogue/apply-domains.ts"`.
- [ ] **Ne pas lancer `--apply`** ; l'essai à blanc nécessite la colonne en base : ne pas le lancer non plus (le contrôleur le fera après le db push).
- [ ] Commit `feat(catalogue): mots-clés de domaines pour la carte, script d'étiquetage initial`.

### Task 5: Retrait de `isML` / `isIAG`
**Files:** `prisma/schema.prisma`, `prisma/generated/**`, `schemas/index.ts`, `lib/projects-data.ts`, `app/actions/*.ts`, admin, tests.
- [ ] Retirer les deux champs du schéma, `prisma generate`, et toutes leurs références (`grep -rn "isML\|isIAG" app components lib hooks schemas prisma/seed.ts` doit être vide hors plans/specs).
- [ ] Commit `refactor(catalogue): retirer isML et isIAG, remplacés par les domaines`.

### Task 6 (contrôleur): base de production, carte, vérification, PR, merge
1. `prisma db push` du schéma **de la tâche 1** (additif) sur la base de production — fait avant la tâche 5 ou depuis le commit de la tâche 4.
2. `pnpm catalogue:domains` (essai à blanc) puis `--apply`.
3. `pnpm embeddings` → `content/map.json` + `content/search-items.json` (seuls `keywords`/`generatedAt` doivent changer) ; commit.
4. Vérifications (tests, tsc, build, HTML accueil, navigateur : puces, filtre Domaine, admin non testé en écriture), PR, relecture finale, merge.
5. Après le déploiement de production : `prisma db push --accept-data-loss` du schéma final (suppression des colonnes `isML`/`isIAG`, toutes à `false`).
