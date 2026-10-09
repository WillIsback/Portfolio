# Admin — synchronisation GitHub et fiche éditoriale — spec

Spécification · 2026-10-10 · conception validée par William en conversation (propositions A et C).

## 1. Intention
Permettre à William d'alimenter correctement son portfolio à partir de ses dépôts GitHub (73 dépôts, dont 16 privés) sans ressaisie ni écrasement de son travail éditorial :
- **A** : import et synchronisation qui lisent vraiment les dépôts ;
- **C** : fiche projet éditoriale.

**Critères de réussite :**
- Importer un nouveau dépôt pré-remplit technologies, domaines, dates et description ; William relit avant l'écriture.
- Une synchronisation signale ce qui a changé (dépôts nouveaux, modifiés, archivés, disparus, renommés) et ne modifie un champ qu'avec son accord explicite.
- La fiche porte une accroche française, un statut, une période, une capture choisie dans le dépôt et le rang de projet phare.
- Un aperçu montre la carte telle qu'elle apparaîtra sur le site.
- La stack ML réelle (PyTorch, Transformers…) apparaît sur le site.

## 2. Hors périmètre
- Catalogue de technologies ouvert (table `Technology`), proposition B.
- États brouillon/publié et régénération automatique de la carte du carnet (D) : après un import, `pnpm embeddings` reste manuel.
- Assistance IA à la rédaction (E).
- Correction de la réimportation des bases, back-ends et front-ends : remplacée par la synchronisation, qui ne remplace plus les relations en bloc.

## 3. Authentification et accès GitHub
- Le fournisseur NextAuth GitHub (`auth.ts`) demande la portée `read:user repo`, pour lister et lire les dépôts privés.
  - Pour une app OAuth, GitHub ne propose pas de portée « lecture seule » pour les dépôts privés : `repo` inclut l'écriture.
  - Le code de l'admin n'utilise ce jeton qu'en lecture (GET uniquement, testé).
- Le jeton d'accès OAuth (`account.access_token`) est stocké dans le JWT de session (cookie chiffré). Il n'est **jamais** recopié dans l'objet `session` renvoyé au navigateur (`/api/auth/session`).
- Les actions serveur de l'admin le lisent avec `getToken` (`next-auth/jwt`), après avoir vérifié que l'appelant est l'admin (`ADMIN_GITHUB_ID`).
- **Secours :** sans jeton OAuth (session ancienne), l'admin utilise `GITHUB_TOKEN` et ne voit que les dépôts publics, avec un bandeau « Reconnecte-toi pour voir tes dépôts privés ».
- **Action William après déploiement :** se déconnecter puis se reconnecter à `/admin` pour accepter la nouvelle portée. L'URL de rappel de l'app OAuth ne change pas.
- Toute action serveur de l'admin revérifie l'identité de l'admin côté serveur. On ne se fie pas au seul middleware.

## 4. Données (migration additive, `prisma db push`, client généré committé)
- **Nouvelle catégorie de technologies** `MlStack` (enum + table `ProjectMlStack`, même forme que `ProjectLanguage`) :
  - valeurs : `PyTorch`, `Transformers`, `ScikitLearn`, `Pandas`, `XGBoost`, `HuggingFace`, `VLLM`, `WandB`, `LlmSdk` ;
  - libellés : PyTorch, Transformers, scikit-learn, pandas, XGBoost, Hugging Face, vLLM, Weights & Biases, SDK LLM.
- **Enum `Frontend`** : ajouter `TailwindCSS` (libellé « Tailwind CSS »).
- **Libellés manquants** dans `lib/tech-labels.ts` : Rust, SQLite.
- **Champs ajoutés à `Project`, tous facultatifs** :
  - `pitch String?` : accroche FR, 140 caractères au plus (validation zod) ;
  - `status ProjectStatus?` : enum `InProgress`, `Done`, `Archived`, libellés « en cours », « terminé », « archivé » ;
  - `period String?` : texte libre ;
  - `githubRepoId Int? @unique` : identifiant stable du dépôt ;
  - `featuredRank Int?` : rang de projet phare, vide si le projet n'est pas mis en avant ;
  - `syncedAt DateTime?` : date de la dernière synchronisation acceptée.
- **Retrait de `lib/featured.ts`** : `selectFeatured` utilise `featuredRank` (projets classés, ordre croissant, privés exclus, 6 au plus). Si aucun projet n'est classé, la règle automatique actuelle s'applique (domaines, puis récence, complément jusqu'à 4).
- **Initialisation (contrôleur)** :
  - `githubRepoId` renseigné pour les 25 projets dont l'URL GitHub correspond à un dépôt ;
  - `featuredRank` initialisé à la proposition `[26, 18, 9, 20, 24, 13]` (rangs 1 à 6), modifiable ensuite dans l'admin.

## 5. Synchronisation GitHub (A)
- **Lecture d'un dépôt** (`lib/github/*`, fonctions pures + client) :
  - métadonnées : `description`, `topics`, `homepage`, `private`, `archived`, `pushed_at`, `full_name`, `id`, `default_branch` ;
  - manifestes à la racine : `package.json`, `pyproject.toml`, `requirements.txt`, `Cargo.toml`, `docker-compose.yml`/`compose.yaml` ;
  - les 400 premiers caractères du README (indices de domaines) ;
  - la liste des images de l'arbre (`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`), sans `node_modules`, au plus 40.
- **Détection** (`lib/github/detect.ts`, pure, testée sur des manifestes réels) :

  | Catégorie | Indice | Valeur proposée |
  |---|---|---|
  | Langages | langage principal GitHub ; `Cargo.toml` | Rust |
  | Back-end | `fastapi` | FastAPI |
  | Back-end | `fastify` | Fastify |
  | Back-end | `express` | ExpressJs |
  | Front-end | `next` | NextJs |
  | Front-end | `react` | React |
  | Front-end | `svelte` | Svelte |
  | Front-end | `@sveltejs/kit` | SvelteKit |
  | Front-end | `@tanstack/*` | Tanstack |
  | Front-end | `tailwindcss` | TailwindCSS |
  | Bases | `pg`, `psycopg*`, `asyncpg`, image `postgres`/`pgvector` | Postgresql |
  | Bases | `mongoose`, `mongodb`, `pymongo`, image `mongo` | MongoDB |
  | Bases | `better-sqlite3`, `sqlite3` | SQLite |
  | DevOps | `Dockerfile` | Docker |
  | DevOps | `.github/workflows/` | GithubActions |
  | ML & Data | `torch` | PyTorch |
  | ML & Data | `transformers` | Transformers |
  | ML & Data | `scikit-learn` | ScikitLearn |
  | ML & Data | `pandas` | Pandas |
  | ML & Data | `xgboost` | XGBoost |
  | ML & Data | `huggingface-hub`, `datasets` | HuggingFace |
  | ML & Data | `vllm`, image `vllm` | VLLM |
  | ML & Data | `wandb` | WandB |
  | ML & Data | `openai`, `ai`, `@ai-sdk/*`, `anthropic`, `mistralai` | LlmSdk |

  **Domaines :**
  - `torch`, `scikit-learn`, `xgboost` → ML ;
  - `transformers` → NLP ;
  - `torchvision`, `ultralytics`, `open-clip-torch`, `opencv-python` → Vision ;
  - `whisper*`, `pyannote.audio`, `faster-whisper` → Speech ;
  - `vllm`, `openai`, `ai`, `@ai-sdk/*`, `langchain*` → LLM ;
  - `pandas` avec `matplotlib` ou `seaborn` → DataAnalysis ;
  - « classif » dans le README ou les topics → Classifier ; « regress » → Regressor ;
  - « agent » dans les topics → Agents.
  - Le tout passe par `normalizeDomains`.
- **Écran `/admin/github`, qui remplace l'actuel** :
  - Liste de tous les dépôts (publics et privés), chacun avec un statut :
    - « nouveau » : non importé ;
    - « à jour » ;
    - « modifié » : écart sur au moins un champ synchronisable ;
    - « archivé sur GitHub » ;
    - « renommé » : même `githubRepoId`, autre `full_name` ;
    - « disparu » : projet en base dont le dépôt n'existe plus ou n'est plus accessible.
  - L'analyse se fait **dépôt par dépôt** : une action serveur par dépôt, avec une progression affichée, pour tenir dans le délai des fonctions Vercel et dans le quota GitHub.
  - **Nouveau dépôt** : pré-remplissage (titre = nom du dépôt, description, langages, technologies, domaines, `lastUpdate`, `isPrivate`, `githubRepoId`). Formulaire de relecture, puis création.
  - **Projet existant** : écart champ par champ entre la valeur GitHub et la valeur en base, une case par ligne, non cochée par défaut.
    - Champs synchronisables : `description`, `lastUpdate`, `isPrivate`, `github` (renommage), `languages`, `databases`, `backends`, `frontends`, `devops`, `mlStack`, `domains`.
    - Pour les listes, l'écart montre les ajouts et les retraits, et l'acceptation vaut liste par liste.
  - Les champs **éditoriaux** ne sont jamais proposés : titre, accroche, statut, période, capture, rang de projet phare.
  - Un dépôt **archivé** propose de passer `status` à « archivé » (case à cocher).
  - L'écriture ne concerne que les champs cochés, en une transaction. `syncedAt` est mis à jour.
- **Lecture seule vis-à-vis de GitHub** : seules des requêtes GET sont émises. Un test vérifie que le client n'utilise que GET.

## 6. Fiche éditoriale (C) — `/admin/projects/[id]`
- **Champs** :
  - titre, accroche (compteur 140), statut, période, description ;
  - domaines, technologies par catégorie (dont ML & Data) ;
  - privé ;
  - rang de projet phare : case « mettre en avant » et rang numérique.
- **Capture** : bouton « Choisir dans le dépôt », qui ouvre une galerie des images de l'arbre en vignettes servies par `raw.githubusercontent.com`.
  - Le choix enregistre `imagePath = https://raw.githubusercontent.com/<owner>/<repo>/<branche>/<chemin>`.
  - Les dépôts privés n'ont pas de galerie (leurs images ne sont pas publiques) : la mention « Capture impossible pour un dépôt privé » s'affiche à la place.
- **Articles** : liste, en lecture seule, des articles qui citent le projet (`projectEntries`).
- **Aperçu en direct** sous le formulaire : `FeaturedCard` et `IndexRow` du site, alimentés par l'état du formulaire.
- **Liste `/admin/projects`** : colonnes titre, statut, domaines, rang phare, date de synchronisation, et filtre « à compléter » (sans accroche ou sans domaine).

## 7. Affichage sur le site
- **`FeaturedCard`** : l'accroche (`pitch`) remplace la première phrase de la description quand elle existe.
- **`IndexRow`** : l'accroche s'affiche à la place de la description.
- **Statut** : « en cours » ou « archivé » en `font-mono text-[11px] text-ink-soft` à côté de l'année. « terminé » n'est pas affiché.
- **Technologies** : la catégorie ML & Data entre dans `techNames` et dans la barre de composition (`techComposition`, nouvelle teinte). L'ordre devient langages → ML & Data → bases → back → front → DevOps.
- **`isCapture`** : accepte `raw.githubusercontent.com` et refuse seulement les images GitHub par défaut (`opengraph.githubassets.com`, `avatars.githubusercontent.com`).
- La carte du carnet, les mots-clés et la recherche : la stack ML entre dans les mots-clés du corpus. Le texte des vecteurs ne change pas : la carte ne bouge pas.

## 8. Qualité
- Fonctions pures testées : détection, écarts, statuts de synchro, garde GET seul, `selectFeatured` par rang, `isCapture`.
- Accessibilité AA sur l'admin et les nouvelles mentions publiques.
- Aucun accès à la base au build.
- HTML de l'accueil < 14 600 o gzip.
- Aucun secret journalisé : ni jeton OAuth, ni URL de base.

## 9. Livraisons
1. **Données et détection** : migration additive, enums, libellés, `lib/github/detect.ts`, `selectFeatured` par rang, initialisation (contrôleur).
2. **Accès GitHub et synchronisation** : portée OAuth, jeton côté serveur, client GET, écran de synchro (statuts, écarts, import).
3. **Fiche éditoriale** : champs, galerie de captures, projet phare, articles, aperçu, liste.
4. **Site** : accroche, statut, stack ML, `isCapture`. Puis PR, relecture finale, merge, reconnexion de William.

Une seule branche et une seule PR (`feat/admin-github-sync`), plusieurs tâches relues chacune.

## 10. Risques
| Risque | Parade |
|---|---|
| La portée `repo` donne aussi l'écriture | Client GET uniquement (testé) ; jeton seulement dans le JWT chiffré, jamais exposé au navigateur ; app GitHub à droits fins plus tard si besoin |
| Délai des fonctions Vercel ou quota GitHub | Une action par dépôt, progression côté client ; environ 6 appels par dépôt, très en dessous des 5 000 appels par heure |
| Écrasement du travail éditorial | Champs éditoriaux exclus de la synchro ; écart avec acceptation explicite, cases non cochées par défaut |
| Dépôts privés sans capture | Mention explicite ; capture possible plus tard via la proposition B ou D |
