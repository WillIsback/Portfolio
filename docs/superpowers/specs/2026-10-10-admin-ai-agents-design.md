# Deux agents IA dans l'admin — Design

**Date** : 2026-10-10
**Statut** : validé (design), en attente de plan d'implémentation
**Contexte** : dashboard admin du portfolio (Next.js 16, React 19, Vercel Hobby)

## Objectif

Ajouter au dashboard admin deux assistants IA, consommant le modèle
MoE multimodal auto-hébergé (`Qwen3.8-Flash-Next`, vLLM) :

1. **Agent Projets** — assister la gestion des projets (lecture, analyse de
   dépôt GitHub, rédaction éditoriale, préparation d'écritures en base).
2. **Agent Articles** — assister la gestion des articles MDX (lecture,
   rédaction, révision, publication via Pull Request).

Les deux **préparent** les changements ; l'humain **valide** avant toute
écriture (human-in-the-loop).

## Décisions actées (issues du brainstorming)

| Sujet | Décision |
|---|---|
| Périmètre d'action | Assistant + écriture **avec validation** (jamais d'écriture autonome) |
| Agent Projets — capacités | (a) lire/rechercher projets, (b) analyser dépôt GitHub, (c) rédiger champs éditoriaux, (e) préparer create/update/delete |
| Agent Articles — capacités | (g) lire/rechercher articles, (h) générer un article MDX, (i) réviser, (j) lier aux projets, (k) préparer publication PR |
| Transverse | pièces jointes **multimodales** (images/schémas/graphes) uniquement |
| Écriture articles | **pas** de disque (Vercel read-only) → **branche + commit + PR GitHub** |
| Validation projets | **carte de proposition** dans le chat → bouton **Appliquer** → server action |
| Validation articles | **aperçu rendu** dans le chat **puis** PR (la PR est la revue) |
| Persistance conversations | **éphémère** (client uniquement, rien en base) |
| Pièces jointes | **inline base64** (data-URL), pas de fetch côté vLLM |
| Modèle | **auto-discover** via `GET /v1/models` (1er id), cache mémoire 5 min |
| Raisonnement | `enable_thinking=false` en chat ; contrôlé pour la génération ; masqué par défaut |
| Génération longue | **Vercel Workflows** (tâche de fond durable), génération **découpée en steps** |
| SDK | **AI SDK Vercel** (`ai`, `@ai-sdk/openai-compatible`) + `workflow` |
| Emplacement UI | deux pages dédiées `/admin/agents/projects` et `/admin/agents/articles` |

## Faits techniques vérifiés (2026-10-10)

### Accès au modèle
- Endpoint OpenAI-compatible : `https://vllm.willisback.fr/v1` (Cloudflare
  Tunnel `home-vllm` → `192.168.1.87:30000`).
- Protégé par **deux couches** :
  1. **Cloudflare Access** (app `vLLM (code-review)`, self_hosted) →
     en-têtes `CF-Access-Client-Id` / `CF-Access-Client-Secret` d'un
     **service token**.
  2. **vLLM `--api-key`** → en-tête `Authorization: Bearer <VLLM_API_KEY>`.
- Sans token, `GET /v1/models` renvoie **403** (donc joignable depuis Vercel).
- Tool-calling **natif** vérifié (retour `tool_calls`). Vision vérifiée
  (`multimodal_tokens.image`).
- Le runner `code-review` (self-hosted, LAN) appelle `http://192.168.1.87:30000`
  en direct — sans rapport avec le tunnel cloud.

### Modèle
- `Qwen3.8-Flash-Next` (vLLM 0.30.0), `max_model_len = 500000`.
- Modalités : **texte, image, vidéo** (pas d'audio, pas de PDF).
- **Thinking activé par défaut** (`enable_thinking=true`, `reasoning_effort=xhigh`).
- Paramètres de sampling conseillés — thinking : `temperature=1.0, top_p=0.95,
  top_k=20` ; non-thinking : `temperature=0.7, top_p=0.80, presence_penalty=1.5`.
- Débit observé : **~15 tok/s** (machine lourde).

### vLLM — entrées multimodales (online serving)
- `image_url` accepte une **URL distante** (fetch côté vLLM, timeout 5 s,
  `--allowed-media-domains`) **ou une data-URL base64**.
- `--limit-mm-per-prompt.image N` plafonne le nombre d'images par requête.
- → On choisit la **data-URL base64** (aucun fetch, aucun risque SSRF).

### Vercel
- Plan **Hobby** : `maxDuration` fonction = **300 s**.
- **Vercel Workflows dispo sur Hobby** : 50 000 events/mois, 1 Go écrit,
  rétention 1 jour, 50 000 req/min.
- **Contrainte clé** : « Max runtime of individual step = Vercel Functions
  limits » → **chaque step ≤ 300 s** sur Hobby. Donc génération **découpée**.

## Architecture

### 1. Socle commun (`lib/agents/`)
- **`provider.ts`** — `createOpenAICompatible({ baseURL: VLLM_BASE_URL,
  apiKey: VLLM_API_KEY, headers: { 'CF-Access-Client-Id', 'CF-Access-Client-Secret' } })`.
- **`model.ts`** — `resolveModelId()` : `GET {base}/models` → `data[0].id`,
  cache mémoire TTL 5 min ; fallback sur `VLLM_MODEL` si défini.
- **`reasoning.ts`** — construit les options de requête (`chat_template_kwargs.enable_thinking`,
  `reasoning_effort`, sampling) selon le mode (chat vs génération).
- **Secrets d'environnement (Vercel)** : `VLLM_BASE_URL`, `VLLM_API_KEY`,
  `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`, `GITHUB_TOKEN`.
  Le service token Access est **dédié au portfolio** (créé via l'API
  Cloudflare, distinct de `code-review-actions`).

### 2. Agent Projets — `/admin/agents/projects`
- **Route streaming** : `app/api/agents/projects/route.ts`
  `streamText({ model, messages, tools, stopWhen: stepCountIs(6) })`,
  `export const maxDuration = 300`.
- **Outils lecture (exécution directe)** :
  - `listProjects` / `searchProjects` / `getProject` / `getFilterOptions`
    → réutilisent `app/actions/projects.action.ts`.
  - `analyzeRepo` → réutilise `app/actions/admin.action.ts#analyzeRepo`.
- **Outil rédaction (aucune écriture)** :
  - `proposeProjectDraft` → renvoie une proposition structurée validée par
    `AdminProjectSchema` (champs, valeurs, diff pour un update).
- **Validation** : la proposition s'affiche dans une **carte** (champs
  modifiés + diff) avec bouton **Appliquer**. Le clic appelle la server
  action `applyProjectProposal` qui **re-vérifie `requireAdmin`** puis
  dispatche vers `createProject` / `updateProject` / `deleteProject`.
  → **Aucune mutation n'est déclenchée par un outil.**

### 3. Agent Articles — `/admin/agents/articles`
- **Outils lecture** : réutilisent `lib/articles/loader.ts` — `listArticles`,
  `getArticle`, détection des tags manquants, cohérence `projects: [ids]`
  avec la base Prisma.
- **Génération = Vercel Workflow** (`app/workflows/article.workflow.ts`) :
  1. `planArticle` (plan/sommaire) — **step**
  2. `writeSection` × N (une section par step) — **step**, chacun < 300 s
  3. `assembleArticle` → MDX complet (frontmatter + corps) — **step**
  4. **Pause (hook)** : le brouillon est renvoyé à l'UI → **aperçu rendu**
     (réutilise le rendu MDX existant `next-mdx-remote`)
  5. `openArticlePr` (après clic « Ouvrir la PR ») : branche
     `agent/article-<slug>`, commit `content/articles/<slug>.mdx`,
     ouverture de la **PR** via l'API GitHub.
- **Progression** : durable stream du Workflow consommé par l'UI ; le fil
  peut être quitté et repris (runs persistés, rétention 1 jour Hobby).
- **Token GitHub** : les steps s'exécutent hors contexte de requête (pas de
  `headers()`) → utiliser `GITHUB_TOKEN` (PAT, scope `repo`) plutôt que
  `getAdminGithubToken()`.

### 4. Transverse
- **Pièces jointes** : le client lit les fichiers → data-URLs
  (`png/jpeg/webp/gif`), **max 3 × ~2 Mo** ; la route les mappe en content
  parts `{ type: 'image_url', image_url: { url: dataUrl } }`. Fichiers texte
  (`.md`, `.csv`, code) envoyés en clair jusqu'à ~100 Ko.
- **Garde-fous** : max 6 steps de tool-calling, retry ×1 sur erreur réseau
  transitoire, messages d'erreur lisibles (jamais de secret), `requireAdmin`
  sur toute server action.

### 5. Arborescence (esquisse)
```
lib/agents/provider.ts
lib/agents/model.ts
lib/agents/reasoning.ts
lib/agents/attachments.ts
lib/agents/tools/projects.tools.ts
lib/agents/tools/articles.tools.ts
app/api/agents/projects/route.ts
app/api/agents/articles/route.ts
app/workflows/article.workflow.ts
app/(admin)/admin/agents/projects/page.tsx
app/(admin)/admin/agents/articles/page.tsx
components/agents/ChatPanel.tsx
components/agents/ProposalCard.tsx
components/agents/AttachmentPicker.tsx
components/agents/ArticlePreview.tsx
app/actions/agents.action.ts   # applyProjectProposal, startArticleWorkflow, resumeArticlePr
```

### 6. Tests (Vitest)
- `model.ts` : discover + cache TTL + fallback.
- `attachments.ts` : mapping data-URL, limites de taille/format.
- Schémas d'outils et sérialisation de la proposition.
- `article.workflow` : steps avec provider mocké + GitHub mocké.
- Garde `requireAdmin` sur `applyProjectProposal`.
- Tests SSR des composants (`ChatPanel`, `ProposalCard`) comme l'existant.

## Points ouverts

1. **Seuil 300 s / découpe** : le découpage des sections est dimensionné au
   ressenti ; à **ajuster après mesures réelles** (~4 500 tokens/step à
   15 tok/s). Cible : chaque step largement sous 300 s.
2. **Budget de raisonnement** : thinking ON pour la génération, mais l'effort
   exact (`low`/`medium`) et le nombre de sections seront calibrés aux mesures.
3. **Rétention workflow Hobby = 1 jour** : suffisant pour une reprise à court
   terme ; au-delà, le brouillon est perdu (acceptable, éphémère assumé).

## Hors périmètre (YAGNI)

- Pas de recherche web / conversion de documents / contrôle qualité externe.
- Pas de persistance des conversations en base.
- Pas de vidéo en entrée (supportée par le modèle, non nécessaire ici).
- Pas d'écriture disque des articles.
