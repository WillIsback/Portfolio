# Admin — synchronisation GitHub et fiche éditoriale — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Synchronisation GitHub qui lit vraiment les dépôts (publics et privés, via le jeton OAuth de l'admin) avec écarts acceptés champ par champ, et fiche projet éditoriale (accroche, statut, période, capture du dépôt, rang phare, aperçu) ; affichage de l'accroche, du statut et de la stack ML sur le site.

**Architecture:**
- **Logique pure et testée** dans `lib/github/` : détection, écarts, statuts, client GET seul.
- **Actions serveur de l'admin** : chacune vérifie l'admin (`requireAdmin` existant).
- **Jeton OAuth GitHub** : conservé dans le JWT NextAuth, lu côté serveur par `getToken`, jamais dans la session envoyée au navigateur.
- **Base** : schéma additif appliqué par le contrôleur (`prisma db push`) ; client Prisma généré committé.

**Tech Stack:** Next.js 16.1.4, React 19.2, next-auth 5.0.0-beta.30, Prisma 7 (Neon), zod 4, Vitest 4, Biome 2.3, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-10-admin-github-sync-design.md` (binding — tables de détection, libellés, champs, règles exactes).

**Base :** `main` à `f9cec48`. Worktree `/home/will/dev-project/portfolio-admin`, branche `feat/admin-github-sync`.

## Global Constraints
- **Aucune nouvelle dépendance npm.** Les manifestes TOML sont lus par expressions régulières ciblées (pas de parseur TOML).
- **Ne jamais écrire dans la base de production depuis une tâche.** Pas de `prisma db push`, pas de script `--apply`. `prisma generate` est permis. Les écritures sont faites par le contrôleur.
- **Ne jamais journaliser ni afficher de secret** : jeton OAuth, `GITHUB_TOKEN`, URL de base.
- **Vis-à-vis de GitHub, uniquement des requêtes GET** (client testé).
- **Toute action serveur de l'admin appelle `requireAdmin()` en premier.**
- **Champs éditoriaux** (titre, `pitch`, `status`, `period`, `imagePath`, `featuredRank`) : jamais proposés par la synchronisation.
- **Site** :
  - HTML de l'accueil < 14 600 o gzip ;
  - aucun accès base au build ;
  - accessibilité AA ;
  - textes en français.
- **Avant chaque commit** : `pnpm test`, `pnpm exec biome check --write`, `pnpm lint`, `pnpm exec tsc --noEmit` vide. Trailer `Co-Authored-By: <modèle réel> <noreply@anthropic.com>`.
- **Serveurs** : tuer le wrapper `sh -c next start` **et** l'enfant `next-server` par PID, puis vérifier que le port ne répond plus. Jamais de `pkill` par motif. Les captures Playwright ne peuvent être écrites que sous `/home/will/infra` : les supprimer ensuite.

## Review Focus
1. **Session ancienne sans jeton OAuth** : l'admin fonctionne en mode public (`GITHUB_TOKEN`), avec un bandeau, sans planter.
2. **Dépôt sans manifeste, ou manifeste invalide** (JSON cassé) : détection partielle, aucune exception.
3. **Écart sur une liste** (technologies) : accepter n'écrit que cette liste. Les autres relations du projet restent intactes.
4. **Dépôt renommé** (même `githubRepoId`) : proposé comme « renommé », pas comme « nouveau » plus « disparu ».
5. **Dépôt privé** : jamais de galerie de captures. Côté site, le projet est privé (pas de lien, jamais phare).

---

### Task 1: Données — schéma additif, libellés, types, projets phares par rang
**Files:**
- `prisma/schema.prisma` et `prisma/generated/**`
- `lib/tech-labels.ts`
- create `lib/status.ts` (+ test)
- `schemas/index.ts`
- `lib/projects-data.ts`
- `app/actions/projects.action.ts`
- `app/actions/admin.action.ts`
- `lib/register.ts` (+ test)
- `components/register/ProjectRegister.tsx`
- delete `lib/featured.ts`
- create `scripts/catalogue/init-admin-fields.ts`
- `package.json`
- fabriques de test

**Étapes :**
- [ ] **Schéma** (spec §4) :
  - `enum MlStack { PyTorch Transformers ScikitLearn Pandas XGBoost HuggingFace VLLM WandB LlmSdk }` ;
  - `model ProjectMlStack`, même forme que `ProjectLanguage`, champ `ml MlStack` ;
  - `enum ProjectStatus { InProgress Done Archived }` ;
  - `TailwindCSS` dans `Frontend` ;
  - sur `Project` : `pitch String?`, `status ProjectStatus?`, `period String?`, `githubRepoId Int? @unique`, `featuredRank Int?`, `syncedAt DateTime?`, `mlStack ProjectMlStack[]`.
  - Changement uniquement additif. Lancer `prisma generate` et committer le client.
- [ ] **Libellés** :
  - `lib/tech-labels.ts` : `ML_STACK_LABELS` (libellés de la spec), `TailwindCSS: "Tailwind CSS"`, `Rust: "Rust"`, `SQLite: "SQLite"` ; inclure `ML_STACK_LABELS` dans `ALL_LABELS`.
  - `lib/status.ts` : `PROJECT_STATUSES`, `STATUS_LABELS` (« en cours », « terminé », « archivé ») ; test.
- [ ] **zod** :
  - `MlStackEnum`, `ProjectStatusEnum` ;
  - `AdminProjectSchema` gagne `mlStack` (défaut `[]`), `pitch: z.string().max(140).optional()`, `status` (optionnel), `period` (optionnel), `githubRepoId` (entier optionnel), `featuredRank` (entier ≥ 1, optionnel).
  - Le formulaire actuel doit continuer à compiler (valeurs par défaut).
- [ ] **`NormalizedProject`** gagne `mlStack: { ml: string }[]`, `pitch: string | null`, `status: string | null`, `period: string | null`, `featuredRank: number | null`, `githubRepoId: number | null`. Le JSON de secours remplit des valeurs vides.
- [ ] **`projects.action.ts`** : sélectionner et mapper ces champs, y compris dans `getProjectById`.
- [ ] **`admin.action.ts`** : `upsertProjectRelations` remplace aussi `mlStack` ; `createProject`/`updateProject` écrivent `pitch`, `status`, `period`, `githubRepoId`, `featuredRank`.
- [ ] **Projets phares** :
  - `selectFeatured(projects)` sans second argument : projets publics avec `featuredRank`, triés par rang croissant, 6 au plus ; sinon la règle automatique actuelle.
  - Supprimer `lib/featured.ts` et son import dans `ProjectRegister`.
  - Tests : un classement existe ; aucun classement ; privé classé exclu ; égalité de rang départagée par id.
- [ ] **`scripts/catalogue/init-admin-fields.ts`** (`"catalogue:init-admin": "tsx --env-file=.env.local scripts/catalogue/init-admin-fields.ts"`) :
  - pour chaque projet avec une URL GitHub, `GET /repos/{owner}/{repo}` avec `GITHUB_TOKEN`, puis `githubRepoId = id` ;
  - `featuredRank` : `{26:1, 18:2, 9:3, 20:4, 24:5, 13:6}` ; les autres projets sont mis à `null` ;
  - essai à blanc par défaut, `--apply` pour écrire, une transaction ;
  - aucun secret affiché.
  - **Ne pas le lancer.**
- [ ] Commit `feat(catalogue): stack ML, statut, accroche, période, rang phare — schéma et types`.

### Task 2: Détection et écarts — logique pure
**Files:** create `lib/github/manifests.ts`, `lib/github/detect.ts`, `lib/github/sync.ts`, `lib/github/__fixtures__/*`, tests.
- [ ] **`manifests.ts`** :
  - `parsePackageJson(text)` : noms des `dependencies` et `devDependencies` ; JSON invalide → `[]` ;
  - `parseRequirements(text)` : noms, en ignorant commentaires, options et versions ;
  - `parsePyproject(text)` : chaînes des tableaux `dependencies = [...]` et `optional-dependencies` / `dependency-groups`, par expressions régulières ; noms normalisés en minuscules ;
  - `parseComposeImages(text)` : derniers segments des `image:` sans tag.
  - Tests sur des fixtures réalistes : extraits des vrais manifestes de `WillIsback/*` (Next.js + Prisma ; FastAPI + torch ; pyproject avec optional-deps ; compose avec postgres et vllm), plus un JSON cassé.
- [ ] **`detect.ts`** :
  - `detectProject(input)`, où `input = { primaryLanguage, filePaths, npm, python, composeImages, hasCargo, readmeHead, topics }` ;
  - renvoie `{ languages, databases, backends, frontends, devops, mlStack, domains }` selon les tableaux de la spec §5. Valeurs = enums Prisma ; domaines passés par `normalizeDomains` ; listes dédoublonnées et dans l'ordre des enums.
  - Tests : une règle au moins par catégorie et par domaine, y compris pandas + seaborn → DataAnalysis, et « classif » dans le README → Classifier, plus ML.
- [ ] **`sync.ts`** :
  - `syncStatus({ repo, project })` → `"new" | "up-to-date" | "modified" | "archived" | "renamed" | "missing"`. Le renommage se repère par `githubRepoId` identique et `full_name` différent de l'URL en base. « missing » = projet en base dont le dépôt n'est pas dans la liste.
  - `computeDiff(project, remote)` → `FieldDiff[]` : `{ field, kind: "scalar", current, proposed }` ou `{ field, kind: "list", added, removed, proposedList }`, seulement pour les champs synchronisables de la spec (jamais les champs éditoriaux), et seulement quand il y a un écart.
  - `applyAccepted(project, diffs, acceptedFields)` → objet de mise à jour minimal (pur).
  - Tests : aucun écart → `[]` ; écart de liste → ajouts et retraits ; un champ éditorial n'apparaît jamais ; renommé ; archivé.
- [ ] Commit `feat(admin): détection des technologies et écarts de synchronisation (logique pure)`.

### Task 3: Accès GitHub — portée OAuth, jeton serveur, client GET seul
**Files:** `auth.ts`, create `lib/github/client.ts`, create `lib/github/token.ts`, `lib/github.ts` (remplacé ou réduit), tests.
- [ ] **`auth.ts`** :
  - `GitHub({ authorization: { params: { scope: "read:user repo" } } })` ;
  - callback `jwt({ token, account, profile })` : si `account?.access_token`, alors `token.githubAccessToken = account.access_token` ;
  - callback `session` : **ne pas** copier ce champ.
  - Test unitaire des callbacks : le jeton est dans le JWT, absent de la session.
- [ ] **`lib/github/token.ts`** : `getAdminGithubToken(): Promise<{ token: string; mode: "oauth" } | { token: string | undefined; mode: "public" }>`.
  - Lit le JWT via `getToken({ req: { headers: await headers() }, secret: process.env.AUTH_SECRET })`. Vérifier le nom de cookie NextAuth v5 (`authjs.session-token` / `__Secure-…`) ; passer `secureCookie` selon l'environnement si `getToken` l'exige.
  - Repli : `GITHUB_TOKEN`.
  - Serveur uniquement (`import "server-only"` si le paquet est déjà présent, sinon garde par commentaire et test d'import).
- [ ] **`lib/github/client.ts`** :
  - `githubGet(path, token)` : impose `method: "GET"`, refuse toute autre méthode (test) ; erreurs → messages sans jeton ;
  - `listRepos(auth)` : mode oauth → `/user/repos?affiliation=owner&per_page=100` paginé ; mode public → `/users/WillIsback/repos?type=public` ;
  - `getRepoBundle(fullName, token)` : métadonnées, arbre (`/git/trees/{default_branch}?recursive=1`), manifestes (contents raw, absents → null), 400 premiers caractères du README, images (spec §5, 40 au plus).
  - Tests avec `fetch` simulé : pagination, manifestes absents, GET seul, erreur 404 → « disparu ».
- [ ] Commit `feat(admin): accès GitHub par le jeton OAuth de l'admin (lecture seule)`.

### Task 4: Écran de synchronisation `/admin/github`
**Files:**
- `app/(admin)/admin/github/page.tsx`
- remplacer `GitHubReposBrowser.tsx` par `SyncBoard.tsx` (+ sous-composants)
- `app/actions/admin.action.ts` : nouvelles actions `analyzeRepo`, `importRepo`, `applySync` ; retirer `importFromGitHub` et `fetchRepoFilePathsAction` s'ils deviennent inutiles
- tests des parties pures

**Comportement de la page serveur :**
- Elle récupère la liste des dépôts (`listRepos`) et les projets en base (id, github, githubRepoId, champs synchronisables).
- Bandeau « Reconnecte-toi pour voir tes dépôts privés » en mode public.

**`SyncBoard` (client) :**
- Tableau des dépôts et des projets « disparus », avec un statut initial calculé par `syncStatus` à partir des métadonnées de la liste.
- Bouton « Analyser » par ligne et « Analyser tout ». Le second traite les dépôts **un par un**, appelle `analyzeRepo(fullName)` et affiche une progression.
- Pour un projet existant, l'analyse renvoie le diff (`computeDiff`).

**`analyzeRepo`** : `requireAdmin`, `getRepoBundle`, puis `detectProject`. Renvoie `{ remote, detected, diff, images }` sans aucun secret.

**Nouveau dépôt :**
- Formulaire de relecture pré-rempli : titre = nom du dépôt, description, listes détectées, domaines, `lastUpdate = pushed_at`, `isPrivate`, `githubRepoId`.
- `importRepo(data)` → `createProject`.

**Projet existant :**
- Liste des écarts, une case par champ, non cochée par défaut.
- Dépôt archivé → case « passer le statut à archivé ».
- `applySync(projectId, acceptedDiffs)` écrit uniquement les champs cochés (relations remplacées liste par liste), dans une transaction, et met à jour `syncedAt`.

**Accessibilité :** tableau avec en-têtes, cases étiquetées, progression annoncée (`aria-live`).

**Vérification navigateur :** impossible de se connecter en admin dans le test automatisé. Rendre les composants avec des données factices (tests SSR), et faire vérifier la page réelle par le contrôleur.

- [ ] Commit `feat(admin): écran de synchronisation GitHub — statuts, écarts, import`.

### Task 5: Fiche éditoriale et liste des projets
**Files:**
- `app/(admin)/admin/projects/[id]/page.tsx`
- `ProjectEditForm.tsx`
- create `ImagePicker.tsx` et `ProjectPreview.tsx`
- `app/(admin)/admin/projects/page.tsx`
- action `listRepoImages(projectId)`
- tests

**Champs du formulaire :**
- titre, accroche (compteur 140, `aria-describedby`), statut (select), période ;
- domaines (existant), technologies par catégorie, **dont ML & Data** ;
- privé ;
- « mettre en avant » (case) et rang (nombre ≥ 1, visible si la case est cochée).

**`ImagePicker` :**
- bouton « Choisir dans le dépôt » ;
- `listRepoImages` renvoie les URLs `https://raw.githubusercontent.com/<owner>/<repo>/<branche>/<chemin>` pour un dépôt public, et `[]` avec un motif pour un dépôt privé ;
- grille de vignettes (`<img loading="lazy">`), sélection au clavier ;
- bouton « Retirer » ;
- mention « Capture impossible pour un dépôt privé ».

**Articles qui citent le projet :** `projectEntries(getAllArticles())`, en lecture seule.

**`ProjectPreview` :** rend `FeaturedCard` et `IndexRow` à partir de l'état du formulaire (objet `NormalizedProject` construit côté client).

**Liste :**
- colonnes titre, statut, domaines, rang phare, `syncedAt` ;
- filtre « à compléter » (sans accroche ou sans domaine), par paramètre d'URL.

- [ ] Commit `feat(admin): fiche éditoriale — accroche, statut, période, capture du dépôt, projet phare, aperçu`.

### Task 6: Affichage sur le site et carte du carnet
**Files:**
- `components/register/FeaturedCard.tsx`, `IndexRow.tsx`, `TechBar.tsx`
- `lib/register.ts`
- `lib/carnet/corpus.ts`
- `scripts/carnet/load-corpus.ts`
- tests

**Textes :**
- `pitch` remplace la première phrase sur `FeaturedCard` et la description sur `IndexRow`, quand il existe ;
- statut « en cours » ou « archivé » en `font-mono text-[11px] text-ink-soft` à côté de l'année. « terminé » n'est pas affiché.

**Technologies :**
- `CATEGORIES` gagne `mlStack` (libellé « ML & Data ») après les langages ;
- `TechShare["key"]` étendu ;
- `TechBar` : teinte `var(--primary)` pour ML & Data ;
- tests de `techComposition` et `techNames`, ordre compris.

**`isCapture` :**
- accepte `raw.githubusercontent.com` ;
- refuse `opengraph.githubassets.com` et `avatars.githubusercontent.com` ;
- tests.

**Corpus de la carte :**
- mots-clés = technologies, plus stack ML, plus domaines ;
- `text` inchangé ;
- `load-corpus` sélectionne `mlStack`.

**Mesure :** HTML de l'accueil gzip, reporté dans le rapport.

- [ ] Commit `feat(registre): accroche, statut et stack ML sur le site ; captures GitHub`.

### Task 7 (contrôleur) — base, carte, vérification, PR, merge
1. Après la tâche 1 : `prisma db push` (additif) ; `pnpm catalogue:init-admin` à blanc, puis `--apply`.
2. Après la tâche 6 : `pnpm embeddings` (seuls `keywords` et `generatedAt` changent ; la carte ne bouge pas) ; commit.
3. Vérifications : tests, tsc, build, HTML de l'accueil, navigateur côté site.
4. PR, relecture finale, une vague de correctifs, merge, vérification de la production.
5. William se déconnecte puis se reconnecte à `/admin` (nouvelle portée), puis vérifie l'écran de synchronisation avec ses dépôts privés.
