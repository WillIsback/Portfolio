# Agents IA de l'admin — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter au dashboard admin deux assistants IA (gestion des projets, gestion des articles) branchés sur le vLLM auto-hébergé, écriture uniquement après validation humaine.

**Architecture:** Socle mutualisé `lib/agents/*` (provider OpenAI-compatible, auto-discover du modèle, options de raisonnement, pièces jointes). Agent Projets = chat en streaming (`streamText` + outils lecture seule + carte de proposition validée puis server action). Agent Articles = lecture par outils + génération en **Vercel Workflow** (steps ≤ 300 s) produisant un brouillon MDX, publié par **Pull Request** GitHub après aperçu.

**Tech Stack:** Next.js 16.3, React 19.2, AI SDK v7 (`ai` 7.x, `@ai-sdk/openai-compatible` 3.x, `@ai-sdk/react` 4.x), Workflow SDK (`workflow` 5.x, `@ai-sdk/workflow`), Zod 4, Prisma, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-10-admin-ai-agents-design.md`

---

## Conventions du dépôt (à respecter)

- **Style** : Biome, tabs, guillemets doubles, pas de commentaires inutiles.
- **Tests** : `pnpm test` (Vitest, `environment: node`), alias `@` → racine. Les composants se testent via `renderToStaticMarkup` (`*.ssr.test.tsx`).
- **Server actions** : `"use server"`, protégées par `auth()` + `ADMIN_GITHUB_ID` (voir `app/actions/admin.action.ts`).
- **Jamais** de secret dans un message d'erreur ou un log.

---

## Structure des fichiers

**Créés**
- `lib/agents/provider.ts` — provider OpenAI-compatible (baseURL + clé + en-têtes Cloudflare Access).
- `lib/agents/model.ts` — découverte du modèle (`GET /v1/models`) + cache TTL.
- `lib/agents/model.test.ts`
- `lib/agents/reasoning.ts` — paramètres de requête selon le mode (chat / génération).
- `lib/agents/reasoning.test.ts`
- `lib/agents/attachments.ts` — validation pièces jointes.
- `lib/agents/attachments.test.ts`
- `lib/agents/tools/projects.tools.ts` — outils lecture/proposition projets.
- `lib/agents/tools/projects.tools.test.ts`
- `lib/agents/proposals.ts` — schéma de proposition projet + sérialisation.
- `lib/agents/proposals.test.ts`
- `lib/agents/tools/articles.tools.ts` — outils lecture articles.
- `lib/agents/tools/articles.tools.test.ts`
- `lib/agents/articles.ts` — schéma brouillon article + rendu MDX.
- `lib/agents/articles.test.ts`
- `lib/agents/github-pr.ts` — création branche + commit + PR (écriture GitHub).
- `lib/agents/github-pr.test.ts`
- `lib/admin/load-project.ts` — chargement d'un projet au format `AdminProject`.
- `lib/admin/load-project.test.ts`
- `app/actions/agents.action.ts` — `applyProjectProposal`, `startArticleWorkflow`, `getArticleRun`, `openArticlePr`.
- `app/actions/agents.action.test.ts`
- `app/api/agents/projects/route.ts` — route de chat streaming de l'agent projets.
- `app/api/agents/articles/route.ts` — route de chat streaming de l'agent articles.
- `app/workflows/article.workflow.ts` — workflow de génération d'article.
- `app/workflows/article.workflow.test.ts`
- `components/agents/ChatPanel.tsx`
- `components/agents/ArticleDraftTool.tsx`
- `components/agents/ProposalCard.tsx`
- `components/agents/AttachmentPicker.tsx`
- `components/agents/ArticlePreview.tsx`
- `components/agents/agents.ssr.test.tsx`
- `app/(admin)/admin/agents/projects/page.tsx`
- `app/(admin)/admin/agents/articles/page.tsx`

**Modifiés**
- `package.json` — dépendances.
- `next.config.ts` — plugin `withWorkflow`.
- `next.config.test.ts` — import de la config de base (named export).
- `app/(admin)/admin/layout.tsx` — liens de navigation.
- `app/(admin)/admin/dashboard/page.tsx` — liens vers les agents.

---

## Phase A — Socle + Agent Projets

### Task 1: Dépendances et variables d'environnement

**Files:**
- Modify: `package.json`
- Create/Modify: `.env.local` (local, non versionné) — ajout des variables.

- [ ] **Step 1: Installer les dépendances**

Run:
```bash
pnpm add ai@^7 @ai-sdk/react@^4 @ai-sdk/openai-compatible@^3 workflow@^5 @ai-sdk/workflow
```
Expected: `package.json` mis à jour, `pnpm-lock.yaml` régénéré.

- [ ] **Step 2: Ajouter les variables locales**

Ajouter dans `.env.local` (valeurs réelles à récupérer côté Cloudflare/Infra) :
```bash
VLLM_BASE_URL=https://vllm.willisback.fr/v1
VLLM_API_KEY=<vLLM --api-key>
CF_ACCESS_CLIENT_ID=<service token client id>
CF_ACCESS_CLIENT_SECRET=<service token secret>
# Déjà présent : GITHUB_TOKEN, AUTH_SECRET, etc.
```
`GITHUB_TOKEN` doit avoir le scope `repo` (écriture `content/articles/*`) sur le dépôt du portfolio.

- [ ] **Step 3: Pousser les variables sur Vercel (production/preview)**

Run (le CLI est déjà loggé, projet `portfolio` lié) :
```bash
printf '%s' "$VLLM_BASE_URL" | vercel env add VLLM_BASE_URL production
printf '%s' "$VLLM_API_KEY" | vercel env add VLLM_API_KEY production
printf '%s' "$CF_ACCESS_CLIENT_ID" | vercel env add CF_ACCESS_CLIENT_ID production
printf '%s' "$CF_ACCESS_CLIENT_SECRET" | vercel env add CF_ACCESS_CLIENT_SECRET production
```
Expected: chaque commande répond `Added … to production`.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(agents): dépendances AI SDK v7 et Workflow SDK"
```

---

### Task 2: Provider OpenAI-compatible + découverte du modèle

**Files:**
- Create: `lib/agents/provider.ts`
- Create: `lib/agents/model.ts`
- Test: `lib/agents/model.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

```ts
// lib/agents/model.test.ts
import { describe, expect, it, vi } from "vitest";
import { createModelResolver } from "./model";

function fakeFetch(ids: string[], status = 200) {
	const calls = { n: 0 };
	const fetchImpl = vi.fn(async () => {
		calls.n++;
		return new Response(JSON.stringify({ data: ids.map((id) => ({ id })) }), {
			status,
		});
	});
	return { fetchImpl, calls };
}

describe("createModelResolver", () => {
	it("prend le premier id de /v1/models", async () => {
		const { fetchImpl } = fakeFetch(["qwen3.8-flash-next", "autre"]);
		const resolve = createModelResolver({
			baseUrl: "https://x/v1",
			headers: { "CF-Access-Client-Id": "a" },
			fetchImpl,
		});
		expect(await resolve()).toBe("qwen3.8-flash-next");
	});

	it("met en cache pendant le TTL", async () => {
		const { fetchImpl, calls } = fakeFetch(["m"]);
		let now = 1000;
		const resolve = createModelResolver({
			baseUrl: "https://x/v1",
			headers: {},
			fetchImpl,
			ttlMs: 1000,
			now: () => now,
		});
		await resolve();
		now = 1500;
		await resolve();
		expect(calls.n).toBe(1);
		now = 5000;
		await resolve();
		expect(calls.n).toBe(2);
	});

	it("lève une erreur si la réponse HTTP n'est pas ok", async () => {
		const { fetchImpl } = fakeFetch([], 403);
		const resolve = createModelResolver({
			baseUrl: "https://x/v1",
			headers: {},
			fetchImpl,
		});
		await expect(resolve()).rejects.toThrow(/403/);
	});

	it("lève une erreur si aucun modèle n'est servi", async () => {
		const { fetchImpl } = fakeFetch([]);
		const resolve = createModelResolver({
			baseUrl: "https://x/v1",
			headers: {},
			fetchImpl,
		});
		await expect(resolve()).rejects.toThrow(/Aucun modèle/);
	});
});
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run: `pnpm test lib/agents/model.test.ts`
Expected: FAIL — `createModelResolver` introuvable.

- [ ] **Step 3: Écrire l'implémentation**

```ts
// lib/agents/provider.ts
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export type AgentFetch = (
	input: RequestInfo | URL,
	init?: RequestInit,
) => Promise<Response>;

export function vllmHeaders(): Record<string, string> {
	const headers: Record<string, string> = {};
	const id = process.env.CF_ACCESS_CLIENT_ID;
	const secret = process.env.CF_ACCESS_CLIENT_SECRET;
	if (id) headers["CF-Access-Client-Id"] = id;
	if (secret) headers["CF-Access-Client-Secret"] = secret;
	return headers;
}

export function vllmBaseUrl(): string {
	const url = process.env.VLLM_BASE_URL;
	if (!url) throw new Error("VLLM_BASE_URL manquant.");
	return url.replace(/\/$/, "");
}

export function vllmProvider() {
	return createOpenAICompatible({
		name: "vllm",
		baseURL: vllmBaseUrl(),
		apiKey: process.env.VLLM_API_KEY,
		headers: vllmHeaders(),
	});
}
```

```ts
// lib/agents/model.ts
import { vllmBaseUrl, vllmHeaders, type AgentFetch } from "./provider";

export const MODEL_TTL_MS = 5 * 60 * 1000;

export interface ModelResolverOptions {
	baseUrl: string;
	headers: Record<string, string>;
	fetchImpl?: AgentFetch;
	ttlMs?: number;
	now?: () => number;
}

export function createModelResolver({
	baseUrl,
	headers,
	fetchImpl = fetch,
	ttlMs = MODEL_TTL_MS,
	now = Date.now,
}: ModelResolverOptions): () => Promise<string> {
	let cache: { id: string; at: number } | null = null;
	return async () => {
		const t = now();
		if (cache && t - cache.at < ttlMs) return cache.id;
		const res = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/models`, {
			headers,
		});
		if (!res.ok)
			throw new Error(`Découverte du modèle impossible (${res.status}).`);
		const body = (await res.json()) as { data?: { id?: string }[] };
		const id = body.data?.[0]?.id;
		if (!id) throw new Error("Aucun modèle servi par le serveur.");
		cache = { id, at: t };
		return id;
	};
}

let singleton: (() => Promise<string>) | null = null;

/** Modèle courant : pin `VLLM_MODEL` si défini, sinon auto-discover. */
export async function resolveModelId(): Promise<string> {
	const pinned = process.env.VLLM_MODEL;
	if (pinned) return pinned;
	singleton ??= createModelResolver({
		baseUrl: vllmBaseUrl(),
		headers: vllmHeaders(),
	});
	return singleton();
}
```

- [ ] **Step 4: Lancer le test (succès attendu)**

Run: `pnpm test lib/agents/model.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/agents/provider.ts lib/agents/model.ts lib/agents/model.test.ts
git commit -m "feat(agents): provider OpenAI-compatible et auto-discover du modèle"
```

---

### Task 3: Options de raisonnement / requête

**Files:**
- Create: `lib/agents/reasoning.ts`
- Test: `lib/agents/reasoning.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

```ts
// lib/agents/reasoning.test.ts
import { describe, expect, it } from "vitest";
import { requestOptions } from "./reasoning";

describe("requestOptions", () => {
	it("chat : thinking désactivé, sampling non-thinking", () => {
		const o = requestOptions("chat");
		expect(o.temperature).toBe(0.7);
		expect(o.providerOptions?.vllm).toMatchObject({
			chat_template_kwargs: { enable_thinking: false },
		});
	});

	it("génération : thinking activé, top_k transmis", () => {
		const o = requestOptions("generation");
		expect(o.temperature).toBe(1.0);
		expect(o.providerOptions?.vllm).toMatchObject({
			chat_template_kwargs: { enable_thinking: true },
			top_k: 20,
		});
	});
});
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run: `pnpm test lib/agents/reasoning.test.ts`
Expected: FAIL — `requestOptions` introuvable.

- [ ] **Step 3: Écrire l'implémentation**

```ts
// lib/agents/reasoning.ts
export type AgentMode = "chat" | "generation";

export interface RequestOptions {
	temperature: number;
	topP: number;
	presencePenalty: number;
	providerOptions: {
		vllm: Record<string, unknown>;
	};
}

/**
 * Paramètres Qwen3.8-Flash-Next (cf. model card) : thinking désactivé en chat
 * (réponses directes), activé pour la génération (qualité rédactionnelle).
 * `top_k` est non standard → transmis via providerOptions (ajouté au corps).
 */
export function requestOptions(mode: AgentMode): RequestOptions {
	if (mode === "chat") {
		return {
			temperature: 0.7,
			topP: 0.8,
			presencePenalty: 1.5,
			providerOptions: {
				vllm: { chat_template_kwargs: { enable_thinking: false } },
			},
		};
	}
	return {
		temperature: 1.0,
		topP: 0.95,
		presencePenalty: 0,
		providerOptions: {
			vllm: { chat_template_kwargs: { enable_thinking: true }, top_k: 20 },
		},
	};
}
```

- [ ] **Step 4: Lancer le test (succès attendu)**

Run: `pnpm test lib/agents/reasoning.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/agents/reasoning.ts lib/agents/reasoning.test.ts
git commit -m "feat(agents): paramètres de raisonnement chat/génération"
```

---

### Task 4: Validation des pièces jointes

**Files:**
- Create: `lib/agents/attachments.ts`
- Test: `lib/agents/attachments.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

```ts
// lib/agents/attachments.test.ts
import { describe, expect, it } from "vitest";
import {
	MAX_IMAGE_BYTES,
	validateAttachment,
	validateAttachmentSet,
} from "./attachments";

describe("validateAttachment", () => {
	it("accepte une image autorisée sous la limite", () => {
		expect(
			validateAttachment({ mediaType: "image/png", size: 10 }),
		).toEqual({ ok: true });
	});
	it("refuse un type non autorisé", () => {
		const r = validateAttachment({ mediaType: "application/pdf", size: 10 });
		expect(r.ok).toBe(false);
	});
	it("refuse une image trop lourde", () => {
		const r = validateAttachment({
			mediaType: "image/jpeg",
			size: MAX_IMAGE_BYTES + 1,
		});
		expect(r.ok).toBe(false);
	});
});

describe("validateAttachmentSet", () => {
	it("refuse plus de 3 images", () => {
		const files = Array.from({ length: 4 }, () => ({
			mediaType: "image/png",
			size: 10,
		}));
		expect(validateAttachmentSet(files).ok).toBe(false);
	});
	it("accepte 3 images valides", () => {
		const files = Array.from({ length: 3 }, () => ({
			mediaType: "image/png",
			size: 10,
		}));
		expect(validateAttachmentSet(files)).toEqual({ ok: true });
	});
});
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run: `pnpm test lib/agents/attachments.test.ts`
Expected: FAIL.

- [ ] **Step 3: Écrire l'implémentation**

```ts
// lib/agents/attachments.ts
export const ALLOWED_IMAGE_TYPES = [
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
];
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_IMAGES = 3;
export const MAX_TEXT_BYTES = 100 * 1024;

export type AttachmentCheck = { ok: true } | { ok: false; reason: string };

export interface AttachmentMeta {
	mediaType: string;
	size: number;
}

export function validateAttachment(meta: AttachmentMeta): AttachmentCheck {
	if (ALLOWED_IMAGE_TYPES.includes(meta.mediaType)) {
		if (meta.size > MAX_IMAGE_BYTES)
			return { ok: false, reason: "Image trop lourde (max 2 Mo)." };
		return { ok: true };
	}
	if (meta.mediaType.startsWith("text/") || meta.mediaType === "application/json") {
		if (meta.size > MAX_TEXT_BYTES)
			return { ok: false, reason: "Fichier texte trop lourd (max 100 Ko)." };
		return { ok: true };
	}
	return { ok: false, reason: `Type non pris en charge : ${meta.mediaType}.` };
}

export function validateAttachmentSet(files: AttachmentMeta[]): AttachmentCheck {
	const images = files.filter((f) => f.mediaType.startsWith("image/"));
	if (images.length > MAX_IMAGES)
		return { ok: false, reason: `Maximum ${MAX_IMAGES} images.` };
	for (const f of files) {
		const check = validateAttachment(f);
		if (!check.ok) return check;
	}
	return { ok: true };
}
```

- [ ] **Step 4: Lancer le test (succès attendu)**

Run: `pnpm test lib/agents/attachments.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/agents/attachments.ts lib/agents/attachments.test.ts
git commit -m "feat(agents): validation des pièces jointes"
```

---

### Task 5: Chargement d'un projet au format `AdminProject`

**Files:**
- Create: `lib/admin/load-project.ts`
- Test: `lib/admin/load-project.test.ts`
- Modify: `app/(admin)/admin/projects/[id]/page.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

```ts
// lib/admin/load-project.test.ts
import { describe, expect, it } from "vitest";
import { toAdminProject } from "./load-project";

describe("toAdminProject", () => {
	it("convertit les relations en tableaux de valeurs", () => {
		const row = {
			id: 1,
			title: "Alpha",
			description: "Desc.",
			imagePath: null,
			github: "https://github.com/a/b",
			lastUpdate: new Date("2026-01-02T00:00:00.000Z"),
			isPrivate: false,
			isAiGenerated: false,
			pitch: null,
			status: "Done",
			period: null,
			githubRepoId: 42,
			featuredRank: null,
			training: null,
			languages: [{ language: "Python" }],
			databases: [],
			backends: [],
			frontends: [],
			devops: [],
			domains: [{ domain: "LLM" }],
			mlStack: [{ ml: "PyTorch" }],
			practices: [{ practice: "Hardening" }],
		};
		const a = toAdminProject(row as never);
		expect(a.languages).toEqual(["Python"]);
		expect(a.domains).toEqual(["LLM"]);
		expect(a.githubRepoId).toBe(42);
		expect(a.lastUpdate).toBe("2026-01-02T00:00:00.000Z");
		expect(a.imagePath).toBe("");
	});
});
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run: `pnpm test lib/admin/load-project.test.ts`
Expected: FAIL.

- [ ] **Step 3: Écrire l'implémentation**

```ts
// lib/admin/load-project.ts
import prisma from "@/lib/db";
import type { AdminProject } from "@/schemas";

type Row = {
	title: string;
	description: string;
	imagePath: string | null;
	github: string | null;
	lastUpdate: Date | null;
	isPrivate: boolean;
	isAiGenerated: boolean;
	pitch: string | null;
	status: AdminProject["status"] | null;
	period: string | null;
	githubRepoId: number | null;
	featuredRank: number | null;
	training: AdminProject["training"] | null;
	languages: { language: AdminProject["languages"][number] }[];
	databases: { database: AdminProject["databases"][number] }[];
	backends: { backend: AdminProject["backends"][number] }[];
	frontends: { frontend: AdminProject["frontends"][number] }[];
	devops: { devops: AdminProject["devops"][number] }[];
	domains: { domain: AdminProject["domains"][number] }[];
	mlStack: { ml: AdminProject["mlStack"][number] }[];
	practices: { practice: AdminProject["practices"][number] }[];
};

export function toAdminProject(row: Row): AdminProject {
	return {
		title: row.title,
		description: row.description,
		imagePath: row.imagePath ?? "",
		github: row.github ?? "",
		lastUpdate: row.lastUpdate?.toISOString() ?? "",
		isPrivate: row.isPrivate,
		isAiGenerated: row.isAiGenerated,
		languages: row.languages.map((l) => l.language),
		databases: row.databases.map((d) => d.database),
		backends: row.backends.map((b) => b.backend),
		frontends: row.frontends.map((f) => f.frontend),
		devops: row.devops.map((d) => d.devops),
		domains: row.domains.map((d) => d.domain),
		mlStack: row.mlStack.map((m) => m.ml),
		pitch: row.pitch ?? undefined,
		status: row.status ?? undefined,
		period: row.period ?? undefined,
		githubRepoId: row.githubRepoId ?? undefined,
		featuredRank: row.featuredRank ?? undefined,
		practices: row.practices.map((p) => p.practice),
		training: row.training ?? null,
	};
}

const INCLUDE = {
	languages: true,
	databases: true,
	backends: true,
	frontends: true,
	devops: true,
	domains: true,
	mlStack: true,
	practices: true,
} as const;

/** Projet de la base au format formulaire, ou `null`. */
export async function loadAdminProject(id: number): Promise<AdminProject | null> {
	const row = await prisma.project.findUnique({ where: { id }, include: INCLUDE });
	return row ? toAdminProject(row) : null;
}
```

- [ ] **Step 4: Lancer le test (succès attendu)**

Run: `pnpm test lib/admin/load-project.test.ts`
Expected: PASS.

- [ ] **Step 5: Réutiliser le mapping dans la page d'édition**

Dans `app/(admin)/admin/projects/[id]/page.tsx`, remplacer le bloc `const initial: AdminProject = { … }` (lignes 36-58) par :

```ts
	const initial = toAdminProject(project);
```

et ajouter l'import :
```ts
import { toAdminProject } from "@/lib/admin/load-project";
```

- [ ] **Step 6: Vérifier la page et le typecheck**

Run: `pnpm test lib/admin/project-form.test.ts && pnpm exec tsc --noEmit`
Expected: PASS, aucune erreur de type.

- [ ] **Step 7: Commit**

```bash
git add lib/admin/load-project.ts lib/admin/load-project.test.ts "app/(admin)/admin/projects/[id]/page.tsx"
git commit -m "refactor(admin): extracteur toAdminProject/loadAdminProject réutilisable"
```

---

### Task 6: Outils lecture de l'agent Projets

**Files:**
- Create: `lib/agents/tools/projects.tools.ts`
- Test: `lib/agents/tools/projects.tools.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

```ts
// lib/agents/tools/projects.tools.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const getProjects = vi.fn(async () => [
	{
		id: 1,
		title: "Alpha",
		description: "Desc.",
		pitch: null,
		status: "Done",
		domains: [{ domain: "LLM" }],
		languages: [{ language: "Python" }],
	} as never,
]);
const getProjectById = vi.fn(async () => ({ id: 1, title: "Alpha" }));
const analyzeRepo = vi.fn(async () => ({ ok: true, remote: { fullName: "a/b" } }));

vi.mock("@/app/actions/projects.action", () => ({ getProjects, getProjectById }));
vi.mock("@/app/actions/admin.action", () => ({ analyzeRepo }));

import { projectTools } from "./projects.tools";

describe("projectTools", () => {
	beforeEach(() => vi.clearAllMocks());

	it("listProjects résume les projets", async () => {
		const out = (await projectTools.listProjects.execute?.(
			{ search: "alpha" },
			{} as never,
		)) as unknown[];
		expect(getProjects).toHaveBeenCalledWith({ search: "alpha" });
		expect(out).toEqual([
			{ id: 1, title: "Alpha", status: "Done", domains: ["LLM"], languages: ["Python"] },
		]);
	});

	it("getProject délègue", async () => {
		await projectTools.getProject.execute?.({ id: 1 }, {} as never);
		expect(getProjectById).toHaveBeenCalledWith(1);
	});

	it("analyzeRepo délègue", async () => {
		await projectTools.analyzeRepo.execute?.({ fullName: "a/b" }, {} as never);
		expect(analyzeRepo).toHaveBeenCalledWith("a/b");
	});
});
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run: `pnpm test lib/agents/tools/projects.tools.test.ts`
Expected: FAIL.

- [ ] **Step 3: Écrire l'implémentation**

```ts
// lib/agents/tools/projects.tools.ts
import { tool } from "ai";
import { z } from "zod";
import { analyzeRepo } from "@/app/actions/admin.action";
import { getProjectById, getProjects } from "@/app/actions/projects.action";

function summarize(p: {
	id: number;
	title: string;
	description: string;
	pitch: string | null;
	status: string | null;
	domains: { domain: string }[];
	languages: { language: string }[];
}) {
	return {
		id: p.id,
		title: p.title,
		status: p.status,
		pitch: p.pitch,
		domains: p.domains.map((d) => d.domain),
		languages: p.languages.map((l) => l.language),
	};
}

export const projectTools = {
	listProjects: tool({
		description:
			"Liste/résume les projets (filtre texte optionnel sur le titre/description).",
		inputSchema: z.object({ search: z.string().optional() }),
		execute: async ({ search }) => {
			const rows = await getProjects(search ? { search } : {});
			return rows.slice(0, 50).map(summarize);
		},
	}),
	getProject: tool({
		description: "Détail complet d'un projet par son id.",
		inputSchema: z.object({ id: z.number().int().positive() }),
		execute: async ({ id }) => getProjectById(id),
	}),
	analyzeRepo: tool({
		description:
			"Analyse un dépôt GitHub (owner/repo) : stack détectée et écart avec le projet associé.",
		inputSchema: z.object({ fullName: z.string().min(3) }),
		execute: async ({ fullName }) => analyzeRepo(fullName),
	}),
};
```

- [ ] **Step 4: Lancer le test (succès attendu)**

Run: `pnpm test lib/agents/tools/projects.tools.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/agents/tools/projects.tools.ts lib/agents/tools/projects.tools.test.ts
git commit -m "feat(agents): outils lecture de l'agent projets"
```

---

### Task 7: Proposition projet (schéma + outil, sans écriture)

**Files:**
- Create: `lib/agents/proposals.ts`
- Test: `lib/agents/proposals.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

```ts
// lib/agents/proposals.test.ts
import { describe, expect, it } from "vitest";
import { ProjectProposalSchema, summarizeProposal } from "./proposals";

describe("ProjectProposalSchema", () => {
	it("accepte une mise à jour", () => {
		const p = ProjectProposalSchema.parse({
			action: "update",
			projectId: 3,
			summary: "Ajouter le domaine Agents",
			data: { domains: ["Agents"] },
		});
		expect(p.projectId).toBe(3);
	});
	it("refuse une mise à jour sans projectId", () => {
		const r = ProjectProposalSchema.safeParse({
			action: "update",
			summary: "x",
			data: {},
		});
		expect(r.success).toBe(false);
	});
});

describe("summarizeProposal", () => {
	it("liste les champs fournis", () => {
		expect(
			summarizeProposal({
				action: "update",
				projectId: 3,
				summary: "s",
				data: { domains: ["Agents"], pitch: "Neuf." },
			}),
		).toEqual(["domains", "pitch"]);
	});
});
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run: `pnpm test lib/agents/proposals.test.ts`
Expected: FAIL.

- [ ] **Step 3: Écrire l'implémentation**

```ts
// lib/agents/proposals.ts
import { z } from "zod";
import { AdminProjectSchema } from "@/schemas";

export const ProposalDataSchema = AdminProjectSchema.partial();

export const ProjectProposalSchema = z
	.object({
		action: z.enum(["create", "update", "delete"]),
		projectId: z.number().int().positive().nullable().default(null),
		summary: z.string().min(1).max(400),
		data: ProposalDataSchema.optional(),
	})
	.superRefine((p, ctx) => {
		if (p.action === "create" && !p.data?.title)
			ctx.addIssue({ code: "custom", message: "create : titre requis" });
		if (p.action === "update" && p.projectId === null)
			ctx.addIssue({ code: "custom", message: "update : projectId requis" });
		if (p.action === "delete" && p.projectId === null)
			ctx.addIssue({ code: "custom", message: "delete : projectId requis" });
	});

export type ProjectProposal = z.infer<typeof ProjectProposalSchema>;

/** Champs effectivement fournis (pour l'affichage de la carte). */
export function summarizeProposal(p: ProjectProposal): string[] {
	return Object.keys(p.data ?? {}).sort();
}
```

- [ ] **Step 4: Ajouter l'outil de proposition à `projectTools`**

Dans `lib/agents/tools/projects.tools.ts`, ajouter en tête :

```ts
import { ProjectProposalSchema } from "@/lib/agents/proposals";
```

et à la fin de l'objet `projectTools` :

```ts
	proposeProjectDraft: tool({
		description:
			"Prépare une écriture de projet (create/update/delete) SANS l'appliquer. L'humain validera ensuite dans l'interface.",
		inputSchema: ProjectProposalSchema,
		execute: async (proposal) => proposal,
	}),
```

- [ ] **Step 5: Lancer les tests (succès attendu)**

Run: `pnpm test lib/agents/proposals.test.ts lib/agents/tools/projects.tools.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/agents/proposals.ts lib/agents/proposals.test.ts lib/agents/tools/projects.tools.ts
git commit -m "feat(agents): proposition projet structurée (sans écriture)"
```

---

### Task 8: Server action `applyProjectProposal`

**Files:**
- Create: `app/actions/agents.action.ts`
- Test: `app/actions/agents.action.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

```ts
// app/actions/agents.action.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn(async () => ({ user: { githubId: "1" } }));
const createProject = vi.fn(async () => {});
const updateProject = vi.fn(async () => {});
const deleteProject = vi.fn(async () => {});
const loadAdminProject = vi.fn(async () => ({
	title: "Alpha",
	description: "Desc.",
	isPrivate: false,
	isAiGenerated: false,
	languages: [],
	databases: [],
	backends: [],
	frontends: [],
	devops: [],
	domains: [],
	mlStack: [],
	practices: [],
	training: null,
}));

vi.mock("@/auth", () => ({ auth }));
vi.mock("@/app/actions/admin.action", () => ({
	createProject,
	updateProject,
	deleteProject,
}));
vi.mock("@/lib/admin/load-project", () => ({ loadAdminProject }));

import { applyProjectProposal } from "./agents.action";

const ENV = { ...process.env };
beforeEach(() => {
	vi.clearAllMocks();
	process.env.ADMIN_GITHUB_ID = "1";
});

describe("applyProjectProposal", () => {
	it("refuse un non-admin", async () => {
		auth.mockResolvedValueOnce({ user: { githubId: "999" } } as never);
		const r = await applyProjectProposal({
			action: "delete",
			projectId: 1,
			summary: "s",
		});
		expect(r).toEqual({ ok: false, error: "Non autorisé." });
		expect(deleteProject).not.toHaveBeenCalled();
	});

	it("applique une suppression", async () => {
		const r = await applyProjectProposal({
			action: "delete",
			projectId: 1,
			summary: "s",
		});
		expect(r).toEqual({ ok: true });
		expect(deleteProject).toHaveBeenCalledWith(1);
	});

	it("applique une mise à jour fusionnée", async () => {
		const r = await applyProjectProposal({
			action: "update",
			projectId: 3,
			summary: "s",
			data: { domains: ["Agents"] },
		});
		expect(r).toEqual({ ok: true });
		expect(updateProject).toHaveBeenCalledWith(
			3,
			expect.objectContaining({ title: "Alpha", domains: ["Agents"] }),
		);
	});

	it("applique une création", async () => {
		const r = await applyProjectProposal({
			action: "create",
			summary: "s",
			data: { title: "Nouveau", description: "Une description." },
		});
		expect(r).toEqual({ ok: true });
		expect(createProject).toHaveBeenCalled();
	});

	it("refuse des données invalides", async () => {
		const r = await applyProjectProposal({ action: "create", summary: "s" });
		expect(r.ok).toBe(false);
		expect(createProject).not.toHaveBeenCalled();
	});
});
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run: `pnpm test app/actions/agents.action.test.ts`
Expected: FAIL.

- [ ] **Step 3: Écrire l'implémentation**

```ts
// app/actions/agents.action.ts
"use server";

import { auth } from "@/auth";
import {
	createProject,
	deleteProject,
	updateProject,
} from "@/app/actions/admin.action";
import { loadAdminProject } from "@/lib/admin/load-project";
import {
	ProjectProposalSchema,
	type ProjectProposal,
} from "@/lib/agents/proposals";
import { AdminProjectSchema } from "@/schemas";

async function requireAdmin(): Promise<boolean> {
	const session = await auth();
	return session?.user?.githubId === process.env.ADMIN_GITHUB_ID;
}

export type ApplyResult = { ok: true } | { ok: false; error: string };

/** Applique une proposition validée. Re-vérifie l'admin et re-valide les données. */
export async function applyProjectProposal(
	raw: ProjectProposal,
): Promise<ApplyResult> {
	if (!(await requireAdmin())) return { ok: false, error: "Non autorisé." };
	const parsed = ProjectProposalSchema.safeParse(raw);
	if (!parsed.success) return { ok: false, error: "Proposition invalide." };
	const p = parsed.data;

	try {
		if (p.action === "delete") {
			await deleteProject(p.projectId as number);
			return { ok: true };
		}

		if (p.action === "create") {
			const merged = AdminProjectSchema.parse({
				...AdminProjectSchema.parse({}),
				...p.data,
			});
			await createProject(merged);
			return { ok: true };
		}

		const current = await loadAdminProject(p.projectId as number);
		if (!current) return { ok: false, error: "Projet introuvable." };
		const merged = AdminProjectSchema.parse({ ...current, ...p.data });
		await updateProject(p.projectId as number, merged);
		return { ok: true };
	} catch {
		return { ok: false, error: "Écriture impossible." };
	}
}
```

> Note : `AdminProjectSchema.parse({})` fournit les valeurs par défaut (tableaux vides, booléens) ; il échouera si `title`/`description` manquent, ce qui est le comportement voulu pour `create`.

- [ ] **Step 4: Lancer le test (succès attendu)**

Run: `pnpm test app/actions/agents.action.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/actions/agents.action.ts app/actions/agents.action.test.ts
git commit -m "feat(agents): action applyProjectProposal (validation admin + Zod)"
```

---

### Task 9: Route de chat streaming de l'agent Projets

**Files:**
- Create: `app/api/agents/projects/route.ts`

- [ ] **Step 1: Écrire la route**

```ts
// app/api/agents/projects/route.ts
import {
	convertToModelMessages,
	createUIMessageStreamResponse,
	isStepCount,
	streamText,
	toUIMessageStream,
	type UIMessage,
} from "ai";
import { auth } from "@/auth";
import { resolveModelId } from "@/lib/agents/model";
import { vllmProvider } from "@/lib/agents/provider";
import { requestOptions } from "@/lib/agents/reasoning";
import { projectTools } from "@/lib/agents/tools/projects.tools";

export const maxDuration = 300;

const SYSTEM = `Tu es l'assistant de gestion des projets du portfolio de William Derue.
Tu aides à lire, analyser (dépôt GitHub) et rédiger les fiches projets.
RÈGLE ABSOLUE : tu ne modifies JAMAIS la base. Pour toute écriture, appelle
proposeProjectDraft avec une proposition structurée ; l'humain validera dans l'interface.
Réponds en français, de façon concise.`;

export async function POST(req: Request) {
	const session = await auth();
	if (session?.user?.githubId !== process.env.ADMIN_GITHUB_ID)
		return new Response("Unauthorized", { status: 401 });

	const { messages }: { messages: UIMessage[] } = await req.json();
	const modelId = await resolveModelId();
	const opts = requestOptions("chat");

	const result = streamText({
		model: vllmProvider()(modelId),
		system: SYSTEM,
		messages: await convertToModelMessages(messages),
		tools: projectTools,
		stopWhen: isStepCount(6),
		...opts,
	});

	return createUIMessageStreamResponse({
		stream: toUIMessageStream({ stream: result.stream }),
	});
}
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: aucune erreur. (Le nom exact `isStepCount` est celui de la doc AI SDK v7 ; si le typecheck échoue, vérifier l'export dans `node_modules/ai` et ajuster.)

- [ ] **Step 3: Commit**

```bash
git add app/api/agents/projects/route.ts
git commit -m "feat(agents): route de chat streaming de l'agent projets"
```

---

### Task 10: Composants — ChatPanel, ProposalCard, AttachmentPicker

**Files:**
- Create: `components/agents/AttachmentPicker.tsx`
- Create: `components/agents/ProposalCard.tsx`
- Create: `components/agents/ChatPanel.tsx`
- Test: `components/agents/agents.ssr.test.tsx`

- [ ] **Step 1: Écrire le test SSR qui échoue**

```tsx
// components/agents/agents.ssr.test.tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ProposalCard } from "./ProposalCard";

vi.mock("sonner", () => ({ toast: { success() {}, error() {} } }));

describe("ProposalCard", () => {
	it("affiche l'action, le résumé et les champs, avec un bouton Appliquer", () => {
		const html = renderToStaticMarkup(
			<ProposalCard
				proposal={{
					action: "update",
					projectId: 3,
					summary: "Ajouter le domaine Agents",
					data: { domains: ["Agents"], pitch: "Neuf." },
				}}
			/>,
		);
		expect(html).toContain("Mise à jour du projet");
		expect(html).toContain("Ajouter le domaine Agents");
		expect(html).toContain("domains");
		expect(html).toContain("Appliquer");
	});
	it("affiche la suppression", () => {
		const html = renderToStaticMarkup(
			<ProposalCard
				proposal={{ action: "delete", projectId: 7, summary: "Doublon" }}
			/>,
		);
		expect(html).toContain("Suppression");
		expect(html).toContain("#7");
	});
});
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run: `pnpm test components/agents/agents.ssr.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Écrire `AttachmentPicker.tsx`**

```tsx
"use client";

import { useRef } from "react";
import {
	MAX_IMAGES,
	validateAttachmentSet,
	type AttachmentMeta,
} from "@/lib/agents/attachments";

export function AttachmentPicker({
	files,
	onFiles,
}: {
	files: AttachmentMeta[];
	onFiles: (next: AttachmentMeta[]) => void;
}) {
	const ref = useRef<HTMLInputElement>(null);

	return (
		<div className="flex items-center gap-2">
			<input
				ref={ref}
				type="file"
				multiple
				accept="image/png,image/jpeg,image/webp,image/gif,text/*,application/json"
				className="hidden"
				onChange={(e) => {
					const next = Array.from(e.target.files ?? []).map((f) => ({
						mediaType: f.type,
						size: f.size,
					}));
					const check = validateAttachmentSet(next);
					if (!check.ok) {
						alert(check.reason);
						if (ref.current) ref.current.value = "";
						return;
					}
					onFiles(next);
				}}
			/>
			<button
				type="button"
				onClick={() => ref.current?.click()}
				className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-2 py-1"
			>
				Joindre
			</button>
			<span className="text-xs text-zinc-500">
				{files.length}/{MAX_IMAGES}
			</span>
		</div>
	);
}
```

- [ ] **Step 4: Écrire `ProposalCard.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { applyProjectProposal } from "@/app/actions/agents.action";
import type { ProjectProposal } from "@/lib/agents/proposals";
import { summarizeProposal } from "@/lib/agents/proposals";

const LABELS: Record<ProjectProposal["action"], string> = {
	create: "Création de projet",
	update: "Mise à jour du projet",
	delete: "Suppression",
};

export function ProposalCard({ proposal }: { proposal: ProjectProposal }) {
	const [applied, setApplied] = useState(false);
	const [pending, start] = useTransition();

	const apply = () =>
		start(async () => {
			const res = await applyProjectProposal(proposal);
			if (res.ok) {
				setApplied(true);
				toast.success("Proposition appliquée.");
			} else {
				toast.error(res.error);
			}
		});

	return (
		<div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 space-y-2">
			<p className="text-sm font-medium text-zinc-100">
				{LABELS[proposal.action]}
				{proposal.projectId ? ` #${proposal.projectId}` : ""}
			</p>
			<p className="text-sm text-zinc-300">{proposal.summary}</p>
			<ul className="text-xs text-zinc-500 font-mono">
				{summarizeProposal(proposal).map((field) => (
					<li key={field}>{field}</li>
				))}
			</ul>
			<button
				type="button"
				disabled={pending || applied}
				onClick={apply}
				className="text-xs bg-zinc-100 text-zinc-900 rounded px-3 py-1.5 font-medium disabled:opacity-50"
			>
				{applied ? "Appliqué" : pending ? "Application…" : "Appliquer"}
			</button>
		</div>
	);
}
```

- [ ] **Step 5: Écrire `ChatPanel.tsx`**

```tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import type { AttachmentMeta } from "@/lib/agents/attachments";
import { ProjectProposalSchema } from "@/lib/agents/proposals";
import { AttachmentPicker } from "./AttachmentPicker";
import { ArticleDraftTool } from "./ArticleDraftTool";
import { ProposalCard } from "./ProposalCard";

export function ChatPanel({ api }: { api: string }) {
	const { messages, sendMessage, status } = useChat({ api });
	const [input, setInput] = useState("");
	const [files, setFiles] = useState<AttachmentMeta[]>([]);

	return (
		<div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl">
			<div className="flex-1 overflow-auto space-y-4 pr-2">
				{messages.map((m) => (
					<div key={m.id} className="text-sm">
						<p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
							{m.role === "user" ? "Vous" : "Agent"}
						</p>
						{m.parts.map((part, i) => {
							if (part.type === "text")
								return (
									<p key={i} className="whitespace-pre-wrap text-zinc-200">
										{part.text}
									</p>
								);
							if (part.type === "file" && part.mediaType?.startsWith("image/"))
								return (
									// biome-ignore lint/performance/noImgElement: aperçu local d'une pièce jointe
									<img
										key={i}
										src={part.url}
										alt={part.filename ?? "pièce jointe"}
										className="max-w-xs rounded border border-zinc-700"
									/>
								);
							if (part.type === "tool-proposeProjectDraft") {
								const out = (part as { output?: unknown }).output;
								const parsed = ProjectProposalSchema.safeParse(out);
								return parsed.success ? (
									<ProposalCard key={i} proposal={parsed.data} />
								) : null;
							}
							if (part.type === "tool-generateArticleDraft") {
								const out = (part as { output?: { runId?: string } }).output;
								return out?.runId ? (
									<ArticleDraftTool key={i} runId={out.runId} />
								) : null;
							}
							return null;
						})}
					</div>
				))}
			</div>
			<form
				className="border-t border-zinc-800 pt-3 flex flex-col gap-2"
				onSubmit={(e) => {
					e.preventDefault();
					if (!input.trim()) return;
					sendMessage({ role: "user", parts: [{ type: "text", text: input }] });
					setInput("");
					setFiles([]);
				}}
			>
				<div className="flex items-center justify-between">
					<AttachmentPicker files={files} onFiles={setFiles} />
					{status !== "ready" ? (
						<span className="text-xs text-zinc-500">L'agent réfléchit…</span>
					) : null}
				</div>
				<textarea
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Demander à l'agent…"
					className="w-full resize-none rounded-lg bg-zinc-900 border border-zinc-700 p-3 text-sm text-zinc-100"
					rows={3}
				/>
				<button
					type="submit"
					disabled={status !== "ready"}
					className="self-end text-sm bg-zinc-100 text-zinc-900 rounded-lg px-4 py-2 font-medium disabled:opacity-50"
				>
					Envoyer
				</button>
			</form>
		</div>
	);
}
```

- [ ] **Step 6: Lancer le test (succès attendu)**

Run: `pnpm test components/agents/agents.ssr.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/agents/
git commit -m "feat(agents): composants ChatPanel, ProposalCard, AttachmentPicker"
```

---

### Task 11: Page agent Projets + navigation

**Files:**
- Create: `app/(admin)/admin/agents/projects/page.tsx`
- Modify: `app/(admin)/admin/layout.tsx:35-40`
- Modify: `app/(admin)/admin/dashboard/page.tsx:43-48`

- [ ] **Step 1: Écrire la page**

```tsx
// app/(admin)/admin/agents/projects/page.tsx
import { ChatPanel } from "@/components/agents/ChatPanel";

export default function ProjectsAgentPage() {
	return (
		<div>
			<h1 className="text-2xl font-bold font-mono mb-6">Agent Projets</h1>
			<ChatPanel api="/api/agents/projects" />
		</div>
	);
}
```

- [ ] **Step 2: Ajouter le lien de navigation**

Dans `app/(admin)/admin/layout.tsx`, après le lien « Projects » (ligne 40), ajouter :

```tsx
				<Link
					href="/admin/agents/projects"
					className="text-sm text-zinc-400 hover:text-white py-1.5 px-2 rounded hover:bg-zinc-800 transition-colors"
				>
					Agent Projets
				</Link>
```

- [ ] **Step 3: Ajouter le lien au dashboard**

Dans `app/(admin)/admin/dashboard/page.tsx`, dans le `<div className="flex gap-4">`, ajouter :

```tsx
				<Link
					href="/admin/agents/projects"
					className="border border-zinc-700 text-zinc-300 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors"
				>
					Agent Projets
				</Link>
```

- [ ] **Step 4: Vérifier build/typecheck/tests**

Run: `pnpm exec tsc --noEmit && pnpm test`
Expected: aucune erreur, tests PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/agents/projects/page.tsx" "app/(admin)/admin/layout.tsx" "app/(admin)/admin/dashboard/page.tsx"
git commit -m "feat(agents): page et navigation de l'agent projets"
```

---

## Phase B — Agent Articles

### Task 12: Schéma brouillon article + rendu MDX

**Files:**
- Create: `lib/agents/articles.ts`
- Test: `lib/agents/articles.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

```ts
// lib/agents/articles.test.ts
import { describe, expect, it } from "vitest";
import { ArticleDraftSchema, frontmatterToMdx } from "./articles";

const draft = {
	slug: "carnet-agents",
	title: "Un carnet d'agents",
	description: "Deux agents dans l'admin.",
	date: "2026-10-10",
	tags: ["agents", "vllm"],
	status: "brouillon",
	projects: [3, 4],
	body: "## Intro\n\nTexte.",
};

describe("ArticleDraftSchema", () => {
	it("accepte un brouillon valide", () => {
		expect(ArticleDraftSchema.parse(draft).slug).toBe("carnet-agents");
	});
	it("refuse un slug invalide", () => {
		expect(ArticleDraftSchema.safeParse({ ...draft, slug: "Bad Slug" }).success).toBe(
			false,
		);
	});
});

describe("frontmatterToMdx", () => {
	it("produit un bloc frontmatter + corps", () => {
		const mdx = frontmatterToMdx(ArticleDraftSchema.parse(draft));
		expect(mdx).toContain("title: Un carnet d'agents");
		expect(mdx).toContain("projects: [3, 4]");
		expect(mdx).toContain("## Intro");
	});
});
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run: `pnpm test lib/agents/articles.test.ts`
Expected: FAIL.

- [ ] **Step 3: Écrire l'implémentation**

```ts
// lib/agents/articles.ts
import { z } from "zod";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const ArticleDraftSchema = z.object({
	slug: z.string().regex(SLUG_RE, "slug invalide"),
	title: z.string().min(1),
	description: z.string().min(1),
	date: z.string().regex(DATE_RE, "date YYYY-MM-DD attendue"),
	tags: z.array(z.string()).default([]),
	status: z.string().optional(),
	period: z.string().optional(),
	projects: z.array(z.number().int().positive()).optional(),
	body: z.string().min(1),
});

export type ArticleDraft = z.infer<typeof ArticleDraftSchema>;

/** Assemble le fichier MDX (frontmatter YAML minimal + corps). */
export function frontmatterToMdx(draft: ArticleDraft): string {
	const lines = [
		"---",
		`title: ${draft.title}`,
		`description: ${draft.description}`,
		`date: ${draft.date}`,
		`tags: [${draft.tags.join(", ")}]`,
	];
	if (draft.status) lines.push(`status: ${draft.status}`);
	if (draft.period) lines.push(`period: ${draft.period}`);
	if (draft.projects?.length)
		lines.push(`projects: [${draft.projects.join(", ")}]`);
	lines.push("---", "", draft.body.trim(), "");
	return lines.join("\n");
}
```

- [ ] **Step 4: Lancer le test (succès attendu)**

Run: `pnpm test lib/agents/articles.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/agents/articles.ts lib/agents/articles.test.ts
git commit -m "feat(agents): schéma brouillon article et rendu MDX"
```

---

### Task 13: Client GitHub d'écriture (branche + commit + PR)

**Files:**
- Create: `lib/agents/github-pr.ts`
- Test: `lib/agents/github-pr.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

```ts
// lib/agents/github-pr.test.ts
import { describe, expect, it, vi } from "vitest";
import { createArticlePr, type GithubWriteDeps } from "./github-pr";

function deps(over: Partial<GithubWriteDeps> = {}): GithubWriteDeps {
	return {
		token: "t",
		repo: "WillIsback/portfolio",
		baseBranch: "main",
		fetchImpl: vi.fn(async (url: string, init?: RequestInit) => {
			const method = init?.method ?? "GET";
			if (url.endsWith("/git/ref/heads/main"))
				return new Response(JSON.stringify({ object: { sha: "base" } }), { status: 200 });
			if (url.endsWith("/git/refs") && method === "POST")
				return new Response(JSON.stringify({ ref: "refs/heads/x" }), { status: 201 });
			if (url.endsWith("/contents/content/articles/a.mdx") && method === "GET")
				return new Response("", { status: 404 });
			if (url.endsWith("/contents/content/articles/a.mdx") && method === "PUT")
				return new Response(JSON.stringify({ commit: { sha: "c" } }), { status: 201 });
			if (url.endsWith("/pulls") && method === "POST")
				return new Response(JSON.stringify({ html_url: "https://github.com/x/pr/1" }), { status: 201 });
			return new Response("{}", { status: 404 });
		}),
		...over,
	} as unknown as GithubWriteDeps;
}

describe("createArticlePr", () => {
	it("crée branche, commit et PR, et renvoie l'URL", async () => {
		const d = deps();
		const res = await createArticlePr(
			{ slug: "a", mdx: "---\n---\n", branch: "agent/article-a", title: "A", body: "b" },
			d,
		);
		expect(res).toEqual({ ok: true, url: "https://github.com/x/pr/1" });
	});

	it("échoue proprement sans jeton", async () => {
		const res = await createArticlePr(
			{ slug: "a", mdx: "x", branch: "b", title: "A", body: "b" },
			deps({ token: undefined }),
		);
		expect(res.ok).toBe(false);
	});
});
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run: `pnpm test lib/agents/github-pr.test.ts`
Expected: FAIL.

- [ ] **Step 3: Écrire l'implémentation**

```ts
// lib/agents/github-pr.ts
const API = "https://api.github.com";

export interface GithubWriteDeps {
	token: string | undefined;
	repo: string; // "owner/name"
	baseBranch: string;
	fetchImpl?: typeof fetch;
}

export interface ArticlePrInput {
	slug: string;
	mdx: string;
	branch: string;
	title: string;
	body: string;
}

export type ArticlePrResult = { ok: true; url: string } | { ok: false; error: string };

async function gh(
	deps: GithubWriteDeps,
	path: string,
	init: RequestInit,
): Promise<Response> {
	const fetchImpl = deps.fetchImpl ?? fetch;
	return fetchImpl(`${API}${path}`, {
		...init,
		headers: {
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
			Authorization: `Bearer ${deps.token}`,
			"Content-Type": "application/json",
			...init.headers,
		},
		cache: "no-store",
		signal: AbortSignal.timeout(15_000),
	});
}

/** Crée une branche depuis la base, y commit le MDX, puis ouvre une PR. */
export async function createArticlePr(
	input: ArticlePrInput,
	deps: GithubWriteDeps,
): Promise<ArticlePrResult> {
	if (!deps.token) return { ok: false, error: "Jeton GitHub manquant." };
	try {
		const base = await gh(
			deps,
			`/repos/${deps.repo}/git/ref/heads/${deps.baseBranch}`,
			{ method: "GET" },
		);
		if (!base.ok) return { ok: false, error: `Branche de base introuvable (${base.status}).` };
		const baseSha = ((await base.json()) as { object: { sha: string } }).object.sha;

		const branch = await gh(deps, `/repos/${deps.repo}/git/refs`, {
			method: "POST",
			body: JSON.stringify({ ref: `refs/heads/${input.branch}`, sha: baseSha }),
		});
		if (!branch.ok && branch.status !== 422)
			return { ok: false, error: `Création de branche impossible (${branch.status}).` };

		const path = `/repos/${deps.repo}/contents/content/articles/${input.slug}.mdx`;
		const existing = await gh(deps, `${path}?ref=${input.branch}`, { method: "GET" });
		const sha = existing.ok
			? ((await existing.json()) as { sha: string }).sha
			: undefined;

		const commit = await gh(deps, path, {
			method: "PUT",
			body: JSON.stringify({
				message: `content(article): ${input.title}\n\nGénéré par l'agent articles.`,
				content: Buffer.from(input.mdx, "utf8").toString("base64"),
				branch: input.branch,
				...(sha ? { sha } : {}),
			}),
		});
		if (!commit.ok)
			return { ok: false, error: `Commit impossible (${commit.status}).` };

		const pr = await gh(deps, `/repos/${deps.repo}/pulls`, {
			method: "POST",
			body: JSON.stringify({
				title: input.title,
				head: input.branch,
				base: deps.baseBranch,
				body: input.body,
			}),
		});
		if (!pr.ok) return { ok: false, error: `Ouverture de PR impossible (${pr.status}).` };
		return { ok: true, url: ((await pr.json()) as { html_url: string }).html_url };
	} catch {
		return { ok: false, error: "GitHub injoignable." };
	}
}
```

- [ ] **Step 4: Lancer le test (succès attendu)**

Run: `pnpm test lib/agents/github-pr.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/agents/github-pr.ts lib/agents/github-pr.test.ts
git commit -m "feat(agents): client GitHub d'écriture (branche, commit, PR)"
```

---

### Task 14: Workflow de génération d'article

**Files:**
- Create: `app/workflows/article.workflow.ts`
- Modify: `next.config.ts`
- Modify: `next.config.test.ts`
- Test: `app/workflows/article.workflow.test.ts`

- [ ] **Step 1: Activer le plugin Workflow**

Dans `next.config.ts`, exporter la config de base et l'envelopper :

```ts
import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

export const baseConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "raw.githubusercontent.com",
				pathname: "/WillIsback/**",
			},
		],
	},
	async headers() {
		return [
			{
				source: "/models/carnet-static/:file*",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=31536000, immutable",
					},
				],
			},
		];
	},
};

export default withWorkflow(baseConfig);
```

Dans `next.config.test.ts`, remplacer l'import :
```ts
import { baseConfig as nextConfig } from "./next.config";
```

- [ ] **Step 2: Vérifier que le test de config passe toujours**

Run: `pnpm test next.config.test.ts`
Expected: PASS.

- [ ] **Step 3: Écrire le test du workflow qui échoue**

```ts
// app/workflows/article.workflow.test.ts
import { describe, expect, it, vi } from "vitest";
import { buildSections, planSchema } from "./article.workflow";

describe("shared logic", () => {
	it("planSchema valide un plan", () => {
		expect(
			planSchema.parse({
				sections: [{ heading: "Intro", brief: "Poser le sujet" }],
			}).sections[0].heading,
		).toBe("Intro");
	});
	it("buildSections découpe par section", () => {
		expect(buildSections([{ heading: "A", brief: "x" }, { heading: "B", brief: "y" }])).toEqual(
			["A", "B"],
		);
	});
});
```

- [ ] **Step 4: Lancer le test (échec attendu)**

Run: `pnpm test app/workflows/article.workflow.test.ts`
Expected: FAIL.

- [ ] **Step 5: Écrire le workflow**

```ts
// app/workflows/article.workflow.ts
import { generateText } from "ai";
import { z } from "zod";
import { ArticleDraftSchema, type ArticleDraft } from "@/lib/agents/articles";
import { resolveModelId } from "@/lib/agents/model";
import { vllmProvider } from "@/lib/agents/provider";
import { requestOptions } from "@/lib/agents/reasoning";

export const planSchema = z.object({
	sections: z
		.array(z.object({ heading: z.string(), brief: z.string() }))
		.min(1)
		.max(8),
});

export interface ArticleBrief {
	slug: string;
	title: string;
	description: string;
	tags: string[];
	projects?: number[];
	notes: string;
}

export function buildSections(
	sections: { heading: string; brief: string }[],
): string[] {
	return sections.map((s) => s.heading);
}

async function model() {
	return vllmProvider()(await resolveModelId());
}

export async function planArticle(brief: ArticleBrief) {
	"use step";
	const opts = requestOptions("generation");
	const { text } = await generateText({
		model: await model(),
		system:
			"Tu planifies un article de blog technique en français (style carnet de labo). Réponds UNIQUEMENT en JSON: {\"sections\":[{\"heading\":\"...\",\"brief\":\"...\"}]}.",
		prompt: `Titre: ${brief.title}\nDescription: ${brief.description}\nNotes: ${brief.notes}`,
		...opts,
	});
	return planSchema.parse(JSON.parse(text));
}

export async function writeSection(args: {
	brief: ArticleBrief;
	plan: z.infer<typeof planSchema>;
	section: { heading: string; brief: string };
}) {
	"use step";
	const opts = requestOptions("generation");
	const { text } = await generateText({
		model: await model(),
		system:
			"Tu rédiges une section d'article technique en français, en Markdown, sans le titre de section.",
		prompt: `Article: ${args.brief.title}\nPlan: ${buildSections(args.plan.sections).join(" > ")}\nSection: ${args.section.heading}\nConsigne: ${args.section.brief}`,
		...opts,
	});
	return { heading: args.section.heading, body: text.trim() };
}

export async function assembleArticle(args: {
	brief: ArticleBrief;
	sections: { heading: string; body: string }[];
}): Promise<ArticleDraft> {
	"use step";
	const body = args.sections
		.map((s) => `## ${s.heading}\n\n${s.body}`)
		.join("\n\n");
	return ArticleDraftSchema.parse({
		slug: args.brief.slug,
		title: args.brief.title,
		description: args.brief.description,
		date: new Date().toISOString().slice(0, 10),
		tags: args.brief.tags,
		status: "brouillon",
		projects: args.brief.projects,
		body,
	});
}

/** Génère un brouillon d'article : plan → sections (1 step/section) → assemblage. */
export async function articleWorkflow(brief: ArticleBrief): Promise<ArticleDraft> {
	"use workflow";
	const plan = await planArticle(brief);
	const sections: { heading: string; body: string }[] = [];
	for (const section of plan.sections)
		sections.push(await writeSection({ brief, plan, section }));
	return assembleArticle({ brief, sections });
}
```

> `App` serveur `maxDuration` : chaque `'use step'` hérite de la limite fonction (300 s sur Hobby). Le nombre de sections (≤ 8) est volontairement borné ; ajuster après mesures (point ouvert du spec).

- [ ] **Step 6: Lancer le test (succès attendu)**

Run: `pnpm test app/workflows/article.workflow.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/workflows/article.workflow.ts app/workflows/article.workflow.test.ts next.config.ts next.config.test.ts
git commit -m "feat(agents): workflow de génération d'article (plan + sections + assemblage)"
```

---

### Task 15: Actions de l'agent Articles

**Files:**
- Modify: `app/actions/agents.action.ts`
- Test: `app/actions/agents.action.test.ts`

- [ ] **Step 1: Ajouter les tests qui échouent**

Ajouter à la fin de `app/actions/agents.action.test.ts` :

```ts
const start = vi.fn(async () => ({ runId: "run_1" }));
const createArticlePr = vi.fn(async () => ({ ok: true, url: "https://github.com/x/pr/1" }));

vi.mock("workflow/api", () => ({ start, getRun: vi.fn() }));
vi.mock("@/lib/agents/github-pr", () => ({ createArticlePr }));
vi.mock("@/app/workflows/article.workflow", () => ({
	articleWorkflow: vi.fn(),
}));

import { openArticlePr, startArticleWorkflow } from "./agents.action";

describe("agent articles", () => {
	it("startArticleWorkflow exige l'admin et renvoie le runId", async () => {
		const r = await startArticleWorkflow({
			slug: "a",
			title: "A",
			description: "d",
			tags: [],
			notes: "n",
		});
		expect(r).toEqual({ ok: true, runId: "run_1" });
	});

	it("openArticlePr refuse un non-admin", async () => {
		auth.mockResolvedValueOnce({ user: { githubId: "999" } } as never);
		const r = await openArticlePr({
			slug: "a",
			mdx: "x",
			title: "A",
			body: "b",
		});
		expect(r.ok).toBe(false);
		expect(createArticlePr).not.toHaveBeenCalled();
	});

	it("openArticlePr ouvre une PR", async () => {
		const r = await openArticlePr({ slug: "a", mdx: "x", title: "A", body: "b" });
		expect(r).toEqual({ ok: true, url: "https://github.com/x/pr/1" });
		expect(createArticlePr).toHaveBeenCalledWith(
			expect.objectContaining({ slug: "a", branch: "agent/article-a" }),
			expect.objectContaining({ repo: "WillIsback/portfolio" }),
		);
	});
});
```

- [ ] **Step 2: Lancer les tests (échec attendu)**

Run: `pnpm test app/actions/agents.action.test.ts`
Expected: FAIL — exports manquants.

- [ ] **Step 3: Ajouter les actions**

Ajouter à `app/actions/agents.action.ts` :

```ts
import { getRun, start } from "workflow/api";
import { createArticlePr } from "@/lib/agents/github-pr";
import { articleWorkflow, type ArticleBrief } from "@/app/workflows/article.workflow";
import type { ArticleDraft } from "@/lib/agents/articles";

const PORTFOLIO_REPO = "WillIsback/portfolio";
const BASE_BRANCH = "main";

export async function startArticleWorkflow(
	brief: ArticleBrief,
): Promise<{ ok: true; runId: string } | { ok: false; error: string }> {
	if (!(await requireAdmin())) return { ok: false, error: "Non autorisé." };
	try {
		const run = await start(articleWorkflow, [brief]);
		return { ok: true, runId: run.runId };
	} catch {
		return { ok: false, error: "Démarrage de la génération impossible." };
	}
}

export async function openArticlePr(input: {
	slug: string;
	mdx: string;
	title: string;
	body: string;
}): Promise<ArticlePrResult> {
	if (!(await requireAdmin())) return { ok: false, error: "Non autorisé." };
	return createArticlePr(
		{ ...input, branch: `agent/article-${input.slug}` },
		{
			token: process.env.GITHUB_TOKEN,
			repo: PORTFOLIO_REPO,
			baseBranch: BASE_BRANCH,
		},
	);
}

export type ArticleRunResult =
	| { ok: true; status: string; draft: ArticleDraft | null }
	| { ok: false; error: string };

/** Statut d'un run de génération d'article ; renvoie le brouillon s'il est terminé. */
export async function getArticleRun(runId: string): Promise<ArticleRunResult> {
	if (!(await requireAdmin())) return { ok: false, error: "Non autorisé." };
	try {
		const run = getRun(runId);
		const status = await run.status;
		if (status === "completed")
			return { ok: true, status, draft: (await run.returnValue) as ArticleDraft };
		if (status === "failed") return { ok: false, error: "Génération échouée." };
		return { ok: true, status, draft: null };
	} catch {
		return { ok: false, error: "Run introuvable." };
	}
}
```

et ajouter l'import de type en tête :
```ts
import type { ArticlePrResult } from "@/lib/agents/github-pr";
```

- [ ] **Step 4: Lancer les tests (succès attendu)**

Run: `pnpm test app/actions/agents.action.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/actions/agents.action.ts app/actions/agents.action.test.ts
git commit -m "feat(agents): actions de l'agent articles (workflow + PR)"
```

> La lecture du résultat se fait via `getArticleRun` (ajouté ci-dessus) et est consommée par `ArticleDraftTool` (Task 18).

---

### Task 16: Aperçu article + page agent Articles + navigation

**Files:**
- Create: `components/agents/ArticlePreview.tsx`
- Create: `app/(admin)/admin/agents/articles/page.tsx`
- Modify: `app/(admin)/admin/layout.tsx`
- Modify: `app/(admin)/admin/dashboard/page.tsx`

- [ ] **Step 1: Écrire le test SSR qui échoue**

Ajouter à `components/agents/agents.ssr.test.tsx` :

```tsx
import { ArticlePreview } from "./ArticlePreview";

describe("ArticlePreview", () => {
	it("affiche le titre, le frontmatter et un bouton PR", () => {
		const html = renderToStaticMarkup(
			<ArticlePreview
				draft={{
					slug: "carnet-agents",
					title: "Un carnet d'agents",
					description: "d",
					date: "2026-10-10",
					tags: ["agents"],
					status: "brouillon",
					body: "## Intro\n\nTexte.",
				}}
			/>,
		);
		expect(html).toContain("Un carnet d&#x27;agents");
		expect(html).toContain("Ouvrir la PR");
		expect(html).toContain("carnet-agents.mdx");
	});
});
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run: `pnpm test components/agents/agents.ssr.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Écrire `ArticlePreview.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { openArticlePr } from "@/app/actions/agents.action";
import { type ArticleDraft, frontmatterToMdx } from "@/lib/agents/articles";

export function ArticlePreview({ draft }: { draft: ArticleDraft }) {
	const [url, setUrl] = useState<string | null>(null);
	const [pending, start] = useTransition();

	const openPr = () =>
		start(async () => {
			const res = await openArticlePr({
				slug: draft.slug,
				mdx: frontmatterToMdx(draft),
				title: draft.title,
				body: draft.description,
			});
			if (res.ok) {
				setUrl(res.url);
				toast.success("PR ouverte.");
			} else {
				toast.error(res.error);
			}
		});

	return (
		<div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 space-y-3">
			<p className="font-mono text-xs text-zinc-500">
				content/articles/{draft.slug}.mdx
			</p>
			<h2 className="text-lg font-bold text-zinc-100">{draft.title}</h2>
			<p className="text-sm text-zinc-400">{draft.description}</p>
			<pre className="max-h-80 overflow-auto rounded bg-zinc-950 p-3 text-xs text-zinc-300 whitespace-pre-wrap">
				{draft.body}
			</pre>
			{url ? (
				<a
					href={url}
					target="_blank"
					rel="noreferrer"
					className="text-sm text-emerald-400 hover:underline"
				>
					Voir la PR
				</a>
			) : (
				<button
					type="button"
					disabled={pending}
					onClick={openPr}
					className="text-sm bg-zinc-100 text-zinc-900 rounded-lg px-4 py-2 font-medium disabled:opacity-50"
				>
					{pending ? "Ouverture…" : "Ouvrir la PR"}
				</button>
			)}
		</div>
	);
}
```

- [ ] **Step 4: Écrire la page**

```tsx
// app/(admin)/admin/agents/articles/page.tsx
import { ChatPanel } from "@/components/agents/ChatPanel";

export default function ArticlesAgentPage() {
	return (
		<div>
			<h1 className="text-2xl font-bold font-mono mb-6">Agent Articles</h1>
			<ChatPanel api="/api/agents/articles" />
		</div>
	);
}
```

> Note : l'agent articles utilise sa propre route de chat (`app/api/agents/articles/route.ts`, Task 18) alimentée par `lib/agents/tools/articles.tools.ts` (Task 17), avec la génération déléguée à `startArticleWorkflow` via l'outil `generateArticleDraft`.

- [ ] **Step 5: Ajouter les liens de navigation**

Dans `app/(admin)/admin/layout.tsx`, après « Agent Projets » :
```tsx
				<Link
					href="/admin/agents/articles"
					className="text-sm text-zinc-400 hover:text-white py-1.5 px-2 rounded hover:bg-zinc-800 transition-colors"
				>
					Agent Articles
				</Link>
```
Dans `app/(admin)/admin/dashboard/page.tsx`, dans le `<div className="flex gap-4">` :
```tsx
				<Link
					href="/admin/agents/articles"
					className="border border-zinc-700 text-zinc-300 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors"
				>
					Agent Articles
				</Link>
```

- [ ] **Step 6: Lancer les tests (succès attendu)**

Run: `pnpm test components/agents/agents.ssr.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/agents/ArticlePreview.tsx "app/(admin)/admin/agents/articles/page.tsx" "app/(admin)/admin/layout.tsx" "app/(admin)/admin/dashboard/page.tsx"
git commit -m "feat(agents): aperçu article, page et navigation de l'agent articles"
```

---

### Task 17: Outils lecture de l'agent Articles

**Files:**
- Create: `lib/agents/tools/articles.tools.ts`
- Test: `lib/agents/tools/articles.tools.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

```ts
// lib/agents/tools/articles.tools.test.ts
import { describe, expect, it } from "vitest";
import { articleTools } from "./articles.tools";

const DIR = "lib/agents/tools/__fixtures__/articles";
// Fixtures: deux fichiers MDX, dont un sans tag "vllm".

describe("articleTools", () => {
	it("listArticles renvoie les métadonnées", async () => {
		const out = (await articleTools.listArticles.execute?.(
			{},
			{} as never,
		)) as unknown[];
		expect(Array.isArray(out)).toBe(true);
	});
	it("getArticle renvoie le contenu d'un slug", async () => {
		const out = (await articleTools.getArticle.execute?.(
			{ slug: "carnet-agents" },
			{} as never,
		)) as { slug: string } | null;
		expect(out?.slug ?? null).toBeTruthy();
	});
});
```

- [ ] **Step 2: Créer les fixtures**

Créer `lib/agents/tools/__fixtures__/articles/carnet-agents.mdx` :
```mdx
---
title: Carnet d'agents
description: Deux agents dans l'admin.
date: 2026-10-10
tags: [agents, vllm]
---
## Intro

Texte.
```

Créer `lib/agents/tools/__fixtures__/articles/autre.mdx` :
```mdx
---
title: Autre
description: Un autre article.
date: 2026-10-09
tags: [agents]
---
## Intro

Texte.
```

- [ ] **Step 3: Lancer le test (échec attendu)**

Run: `pnpm test lib/agents/tools/articles.tools.test.ts`
Expected: FAIL.

- [ ] **Step 4: Écrire l'implémentation**

```ts
// lib/agents/tools/articles.tools.ts
import { tool } from "ai";
import { z } from "zod";
import { getAllArticles, getArticleBySlug } from "@/lib/articles/loader";

export const articleTools = {
	listArticles: tool({
		description: "Liste les articles (métadonnées : slug, titre, tags, date).",
		inputSchema: z.object({}),
		execute: async () =>
			getAllArticles().map((a) => ({
				slug: a.slug,
				title: a.title,
				description: a.description,
				date: a.date,
				tags: a.tags,
				projects: a.projects ?? [],
			})),
	}),
	getArticle: tool({
		description: "Contenu complet (frontmatter + corps MDX) d'un article par slug.",
		inputSchema: z.object({ slug: z.string() }),
		execute: async ({ slug }) => getArticleBySlug(slug),
	}),
};
```

- [ ] **Step 5: Lancer le test (succès attendu)**

Run: `pnpm test lib/agents/tools/articles.tools.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/agents/tools/articles.tools.ts lib/agents/tools/articles.tools.test.ts lib/agents/tools/__fixtures__/
git commit -m "feat(agents): outils lecture de l'agent articles"
```

---

### Task 18: Route de chat et génération de l'agent Articles

**Files:**
- Create: `app/api/agents/articles/route.ts`
- Create: `components/agents/ArticleDraftTool.tsx`

- [ ] **Step 1: Écrire la route de chat articles (avec l'outil de génération)**

L'outil de génération est défini **dans la route** (et non dans `articles.tools.ts`) pour que le module d'outils de lecture reste pur et testable sans dépendance serveur.

```ts
// app/api/agents/articles/route.ts
import {
	convertToModelMessages,
	createUIMessageStreamResponse,
	isStepCount,
	streamText,
	toUIMessageStream,
	tool,
	type UIMessage,
} from "ai";
import { z } from "zod";
import { auth } from "@/auth";
import { startArticleWorkflow } from "@/app/actions/agents.action";
import { resolveModelId } from "@/lib/agents/model";
import { vllmProvider } from "@/lib/agents/provider";
import { requestOptions } from "@/lib/agents/reasoning";
import { articleTools } from "@/lib/agents/tools/articles.tools";

export const maxDuration = 300;

const SYSTEM = `Tu es l'assistant de gestion des articles du portfolio de William Derue.
Tu aides à lire, relire et rédiger des articles MDX (style carnet de labo, en français).
Pour rédiger un article, appelle generateArticleDraft (génération en tâche de fond) : l'humain relira l'aperçu puis publiera via une Pull Request.
Tu ne publies JAMAIS toi-même. Réponds de façon concise.`;

const generateArticleDraft = tool({
	description:
		"Lance en tâche de fond la génération d'un brouillon d'article (plan + sections). Renvoie un runId à suivre dans l'interface ; l'humain validera avant toute publication.",
	inputSchema: z.object({
		slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
		title: z.string().min(1),
		description: z.string().min(1),
		tags: z.array(z.string()).default([]),
		projects: z.array(z.number().int().positive()).optional(),
		notes: z.string().min(1),
	}),
	execute: async (brief) => startArticleWorkflow(brief),
});

export async function POST(req: Request) {
	const session = await auth();
	if (session?.user?.githubId !== process.env.ADMIN_GITHUB_ID)
		return new Response("Unauthorized", { status: 401 });

	const { messages }: { messages: UIMessage[] } = await req.json();
	const modelId = await resolveModelId();
	const opts = requestOptions("chat");

	const result = streamText({
		model: vllmProvider()(modelId),
		system: SYSTEM,
		messages: await convertToModelMessages(messages),
		tools: { ...articleTools, generateArticleDraft },
		stopWhen: isStepCount(6),
		...opts,
	});

	return createUIMessageStreamResponse({
		stream: toUIMessageStream({ stream: result.stream }),
	});
}
```

- [ ] **Step 2: Écrire `ArticleDraftTool.tsx` (polling du run)**

```tsx
"use client";

import { useEffect, useState } from "react";
import { getArticleRun } from "@/app/actions/agents.action";
import type { ArticleDraft } from "@/lib/agents/articles";
import { ArticlePreview } from "./ArticlePreview";

export function ArticleDraftTool({ runId }: { runId: string }) {
	const [draft, setDraft] = useState<ArticleDraft | null>(null);
	const [status, setStatus] = useState("running");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let stop = false;
		const tick = async () => {
			const res = await getArticleRun(runId);
			if (stop) return;
			if (!res.ok) {
				setError(res.error);
				return;
			}
			setStatus(res.status);
			if (res.draft) setDraft(res.draft);
		};
		void tick();
		const id = setInterval(() => {
			if (draft) return;
			void tick();
		}, 4000);
		return () => {
			stop = true;
			clearInterval(id);
		};
	}, [runId, draft]);

	if (error) return <p className="text-sm text-red-400">{error}</p>;
	if (!draft)
		return (
			<p className="text-sm text-zinc-500">
				Génération en cours… (statut : {status})
			</p>
		);
	return <ArticlePreview draft={draft} />;
}
```

- [ ] **Step 3: Vérifier le typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add app/api/agents/articles/route.ts components/agents/ArticleDraftTool.tsx
git commit -m "feat(agents): route de chat et génération de l'agent articles"
```

---

### Task 19: Vérification finale

- [ ] **Step 1: Lint, typecheck, tests**

Run:
```bash
pnpm lint && pnpm exec tsc --noEmit && pnpm test
```
Expected: aucune erreur, tous les tests PASS.

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: build réussi (le plugin Workflow transforme `app/workflows/*`).

- [ ] **Step 3: Test manuel (dev)**

Run: `pnpm dev`, puis :
1. `http://localhost:3000/admin/agents/projects` → poser une question (« liste mes projets IA »).
2. Demander une modification (« ajoute le domaine Agents au projet 3 ») → vérifier la carte, cliquer **Appliquer**, contrôler en base.
3. `http://localhost:3000/admin/agents/articles` → demander un article → la carte affiche « Génération en cours… » puis l'aperçu ; cliquer **Ouvrir la PR** (sur une branche de test) et vérifier la PR.

- [ ] **Step 4: Commit (si ajustements)**

```bash
git add -A
git commit -m "test(agents): vérifications finales"
```

---

## Points de vigilance

- **`isStepCount`** : nom d'export AI SDK v7 ; vérifier dans `node_modules/ai` lors du typecheck (Task 9, Step 2).
- **Workflow + `maxDuration`** : les steps héritent de la limite fonction (300 s Hobby). Ajuster le nombre/la taille des sections après mesures (point ouvert du spec).
- **Service token Access** : à créer côté Cloudflare (dédié portfolio) avant la Task 1 Step 3 ; sinon `VLLM_BASE_URL` renvoie 403.
- **`GITHUB_TOKEN`** : doit porter le scope `repo` sur `WillIsback/portfolio`.
- **Rétention Workflow Hobby = 1 jour** : un brouillon non publié dans les 24 h est perdu (assumé). `getArticleRun` renvoie « Run introuvable » passé ce délai.
- **Retry réseau** : les steps de Workflow retentent automatiquement (3× par défaut) ; la boucle d'outils du chat s'appuie sur le comportement par défaut de l'AI SDK.
