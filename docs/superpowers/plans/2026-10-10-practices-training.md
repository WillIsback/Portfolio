# Pratiques Ops et badge « Projet de formation » — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter aux projets une liste fermée de pratiques DevOps/SecOps/MLOps (détectées depuis GitHub et
cochables à la main) et un badge « Projet de formation · OpenClassrooms · <parcours> », visibles et filtrables
dans le registre public, puis retirer les mentions RNCP de la page À propos.

**Architecture:** Deux enums Prisma, `Practice` (table de jonction `ProjectPractice`) et `Training` (colonne
nullable). Les familles et libellés vivent dans des modules purs (`lib/practices.ts`, `lib/training.ts`) consommés
par la détection GitHub, l'admin et le site. La synchronisation propose des pratiques en mode additif uniquement.

**Tech Stack:** Next 16 (App Router, server actions), Prisma 7 + Neon (`prisma db push`, client généré committé),
zod 4, Vitest + `react-dom/server` pour les tests SSR, Biome, Tailwind.

**Spec:** `docs/superpowers/specs/2026-10-10-practices-training-design.md`

## Global Constraints

- Worktree `/home/will/dev-project/portfolio-practices`, branche `feat/practices-training` ; commandes lancées depuis cette racine.
- Réponses, libellés UI et commentaires en français, accents compris ; identifiants de code en anglais.
- Libellé du badge, exact : `Projet de formation · OpenClassrooms · Développeur FullStack IA` ou `… · AI Engineer` ; version abrégée `Formation OC · <parcours>`. Jamais de numéro de projet, d'intitulé officiel ni d'état du parcours.
- Pas de création manuelle de projet : l'import GitHub reste la seule entrée.
- Le diff de synchronisation des pratiques n'a **jamais** de `removed`.
- La formation n'est jamais déduite automatiquement ; seul un indice est affiché.
- Aucune mention `RNCP`, `EQF`, `niveau 6`, `niveau 7` dans `lib/about.ts` ; le diplôme Développeur full stack validé en juillet 2026 reste ; AI Engineer reste « en cours », sans « obtenu » ni « diplômé ».
- Home HTML ≤ 14 600 octets gzip.
- Clé de cache `projects-v3` / `project-v3`.
- Schéma appliqué avec `pnpm exec prisma db push` (pas de migrations) puis `pnpm exec prisma generate` ; le client généré `prisma/generated/prisma/**` est committé. `.env.local` pointe sur la base **de prod** : aucun `db push` avant la tâche 8.
- Vitest ne vérifie pas les types : chaque tâche finit par `pnpm exec tsc --noEmit` et `pnpm exec biome check --write` sur les fichiers touchés.
- Messages de commit terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Ne jamais afficher de secret (URL de base, jetons) dans une sortie.

## Review Focus

1. Un objet `NormalizedProject` venu d'un ancien cache (sans `practices`/`training`) ne doit pas faire planter le registre : `withProjectDefaults` complète (test tâche 2).
2. Une synchronisation sur un projet qui a des pratiques cochées à la main (Durcissement) ne doit ni les retirer ni proposer d'écart si la détection ne trouve rien de nouveau (test tâche 3).
3. Un nom de workflow comme `abcd.yml` ou `scd-report.yml` ne doit pas déclencher « Déploiement automatisé » ; un `README.md` sous `.github/workflows/` ne compte pas comme CI (tests tâche 3).
4. Un paramètre d'URL inconnu (`?practice=Foo`, `?training=maybe`) ne doit pas casser le registre : il est ignoré (test tâche 6).
5. Le badge et les familles doivent rester lisibles par un lecteur d'écran sur `IndexRow`, où l'affichage est abrégé : texte complet en `sr-only` (test tâche 6).

---

### Task 1: Modèle de données et modules de référence

**Files:**
- Modify: `prisma/schema.prisma`
- Regenerate: `prisma/generated/prisma/**`
- Create: `lib/practices.ts`, `lib/practices.test.ts`, `lib/training.ts`, `lib/training.test.ts`
- Modify: `schemas/index.ts`

**Interfaces:**
- Produces:
  - `PRACTICES: readonly Practice[]` (ordre d'affichage), `type Practice`, `FAMILIES = ["DevOps","SecOps","MLOps"] as const`, `type PracticeFamily`, `PRACTICE_FAMILY: Record<Practice, PracticeFamily>`, `PRACTICE_LABELS: Record<Practice, string>`, `PRACTICES_OF: Record<PracticeFamily, Practice[]>`, `normalizePractices(input: readonly string[]): Practice[]`, `practicesByFamily(values: readonly string[]): { family: PracticeFamily; practices: Practice[] }[]`, `familiesOf(values: readonly string[]): PracticeFamily[]`.
  - `TRAININGS = ["FullstackAI","AIEngineer"] as const`, `type Training`, `TRAINING_LABELS: Record<Training,string>`, `trainingBadge(t: Training): string`, `trainingBadgeShort(t: Training): string`, `looksLikeOpenClassrooms(repoName: string): boolean`.
  - zod : `PracticeEnum`, `TrainingEnum`, `PracticeFamilyEnum` ; `AdminProjectSchema` gagne `practices` (défaut `[]`) et `training` (nullable, défaut `null`) ; `ProjectFiltersSchema` gagne `practice?: PracticeFamily[]` et `training?: "only" | "exclude"`.

- [ ] **Step 1: Write the failing tests**

`lib/practices.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import {
	FAMILIES,
	familiesOf,
	normalizePractices,
	PRACTICE_FAMILY,
	PRACTICE_LABELS,
	PRACTICES,
	PRACTICES_OF,
	practicesByFamily,
} from "./practices";

describe("practices", () => {
	it("14 pratiques, chacune avec une famille et un libellé", () => {
		expect(PRACTICES).toHaveLength(14);
		for (const p of PRACTICES) {
			expect(FAMILIES).toContain(PRACTICE_FAMILY[p]);
			expect(PRACTICE_LABELS[p].length).toBeGreaterThan(0);
		}
	});

	it("PRACTICES_OF partitionne PRACTICES (5 / 4 / 5)", () => {
		expect(PRACTICES_OF.DevOps).toHaveLength(5);
		expect(PRACTICES_OF.SecOps).toHaveLength(4);
		expect(PRACTICES_OF.MLOps).toHaveLength(5);
		expect(FAMILIES.flatMap((f) => PRACTICES_OF[f])).toEqual([...PRACTICES]);
	});

	it("normalise : inconnus filtrés, doublons retirés, ordre canonique", () => {
		expect(
			normalizePractices(["LlmEvaluation", "Foo", "Hardening", "Hardening"]),
		).toEqual(["Hardening", "LlmEvaluation"]);
	});

	it("regroupe par famille présente, dans l'ordre des familles", () => {
		expect(
			practicesByFamily(["ModelServing", "ContinuousIntegration", "ExperimentTracking"]),
		).toEqual([
			{ family: "DevOps", practices: ["ContinuousIntegration"] },
			{ family: "MLOps", practices: ["ExperimentTracking", "ModelServing"] },
		]);
		expect(familiesOf(["Hardening", "Containerization"])).toEqual(["DevOps", "SecOps"]);
		expect(familiesOf([])).toEqual([]);
	});
});
```

`lib/training.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import {
	looksLikeOpenClassrooms,
	TRAININGS,
	trainingBadge,
	trainingBadgeShort,
} from "./training";

describe("training", () => {
	it("deux parcours et libellés exacts", () => {
		expect(TRAININGS).toEqual(["FullstackAI", "AIEngineer"]);
		expect(trainingBadge("FullstackAI")).toBe(
			"Projet de formation · OpenClassrooms · Développeur FullStack IA",
		);
		expect(trainingBadge("AIEngineer")).toBe(
			"Projet de formation · OpenClassrooms · AI Engineer",
		);
		expect(trainingBadgeShort("AIEngineer")).toBe("Formation OC · AI Engineer");
	});

	it("indice OpenClassrooms sur le nom du dépôt", () => {
		for (const n of [
			"P13-Fashion-Insta",
			"OC-P7-DataImmo",
			"p12-phase1-zenassist",
			"OC_P5_Deployez",
			"OC-Ai-Engineer-P3",
			"P8-bottleneck",
		])
			expect(looksLikeOpenClassrooms(n)).toBe(true);
		for (const n of ["portfolio", "ops-tools", "Python-utils", "p-thing", "occam"])
			expect(looksLikeOpenClassrooms(n)).toBe(false);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run lib/practices.test.ts lib/training.test.ts`
Expected: FAIL, modules introuvables.

- [ ] **Step 3: Implement the modules**

`lib/practices.ts` :

```ts
/** Pratiques d'ingénierie (liste fermée) regroupées en trois familles. */
export const FAMILIES = ["DevOps", "SecOps", "MLOps"] as const;
export type PracticeFamily = (typeof FAMILIES)[number];

export const PRACTICES = [
	"ContinuousIntegration",
	"Containerization",
	"ContinuousDeployment",
	"AutomatedTesting",
	"Observability",
	"DependencyUpdates",
	"StaticAnalysis",
	"SecretsManagement",
	"Hardening",
	"ExperimentTracking",
	"ModelRegistry",
	"DataVersioning",
	"ModelServing",
	"LlmEvaluation",
] as const;
export type Practice = (typeof PRACTICES)[number];

export const PRACTICE_FAMILY: Record<Practice, PracticeFamily> = {
	ContinuousIntegration: "DevOps",
	Containerization: "DevOps",
	ContinuousDeployment: "DevOps",
	AutomatedTesting: "DevOps",
	Observability: "DevOps",
	DependencyUpdates: "SecOps",
	StaticAnalysis: "SecOps",
	SecretsManagement: "SecOps",
	Hardening: "SecOps",
	ExperimentTracking: "MLOps",
	ModelRegistry: "MLOps",
	DataVersioning: "MLOps",
	ModelServing: "MLOps",
	LlmEvaluation: "MLOps",
};

export const PRACTICE_LABELS: Record<Practice, string> = {
	ContinuousIntegration: "Intégration continue",
	Containerization: "Conteneurisation",
	ContinuousDeployment: "Déploiement automatisé",
	AutomatedTesting: "Tests automatisés",
	Observability: "Observabilité",
	DependencyUpdates: "Veille des dépendances",
	StaticAnalysis: "Analyse de code (SAST)",
	SecretsManagement: "Gestion des secrets",
	Hardening: "Durcissement",
	ExperimentTracking: "Suivi d'expériences",
	ModelRegistry: "Registre de modèles",
	DataVersioning: "Versionnage des données",
	ModelServing: "Service de modèle",
	LlmEvaluation: "Évaluation / monitoring LLM",
};

export const PRACTICES_OF: Record<PracticeFamily, Practice[]> = {
	DevOps: PRACTICES.filter((p) => PRACTICE_FAMILY[p] === "DevOps"),
	SecOps: PRACTICES.filter((p) => PRACTICE_FAMILY[p] === "SecOps"),
	MLOps: PRACTICES.filter((p) => PRACTICE_FAMILY[p] === "MLOps"),
};

const isPractice = (v: string): v is Practice =>
	(PRACTICES as readonly string[]).includes(v);

/** Filtre les valeurs inconnues, dédoublonne, ordre canonique. */
export function normalizePractices(input: readonly string[]): Practice[] {
	const set = new Set(input.filter(isPractice));
	return PRACTICES.filter((p) => set.has(p));
}

/** Familles présentes, chacune avec ses pratiques, dans l'ordre canonique. */
export function practicesByFamily(
	values: readonly string[],
): { family: PracticeFamily; practices: Practice[] }[] {
	const list = normalizePractices(values);
	return FAMILIES.map((family) => ({
		family,
		practices: list.filter((p) => PRACTICE_FAMILY[p] === family),
	})).filter((g) => g.practices.length > 0);
}

export function familiesOf(values: readonly string[]): PracticeFamily[] {
	return practicesByFamily(values).map((g) => g.family);
}
```

`lib/training.ts` :

```ts
/** Parcours de formation OpenClassrooms (badge « Projet de formation »). */
export const TRAININGS = ["FullstackAI", "AIEngineer"] as const;
export type Training = (typeof TRAININGS)[number];

export const TRAINING_LABELS: Record<Training, string> = {
	FullstackAI: "Développeur FullStack IA",
	AIEngineer: "AI Engineer",
};

export const trainingBadge = (t: Training) =>
	`Projet de formation · OpenClassrooms · ${TRAINING_LABELS[t]}`;

export const trainingBadgeShort = (t: Training) =>
	`Formation OC · ${TRAINING_LABELS[t]}`;

export const isTraining = (v: unknown): v is Training =>
	typeof v === "string" && (TRAININGS as readonly string[]).includes(v);

/** Indice seulement : un nom `OC-…`, `OC_…` ou `P<n>-…` ressemble à un projet OpenClassrooms. */
export const looksLikeOpenClassrooms = (repoName: string) =>
	/^(oc[-_]|p\d+[-_])/i.test(repoName);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run lib/practices.test.ts lib/training.test.ts`
Expected: PASS.

- [ ] **Step 5: Prisma schema + client**

Dans `prisma/schema.prisma`, après `enum ProjectStatus` :

```prisma
// Enum pour les pratiques DevOps / SecOps / MLOps (familles dans lib/practices.ts)
enum Practice {
  ContinuousIntegration
  Containerization
  ContinuousDeployment
  AutomatedTesting
  Observability
  DependencyUpdates
  StaticAnalysis
  SecretsManagement
  Hardening
  ExperimentTracking
  ModelRegistry
  DataVersioning
  ModelServing
  LlmEvaluation
}

// Enum pour les parcours de formation OpenClassrooms
enum Training {
  FullstackAI
  AIEngineer
}
```

Dans `model Project`, après `syncedAt` : `training      Training?` ; dans les relations, après `mlStack` :
`practices   ProjectPractice[]`. Puis, après le modèle `ProjectMlStack` (copier sa forme exacte : clé composée,
`onDelete: Cascade`) :

```prisma
model ProjectPractice {
  projectId Int
  practice  Practice
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@id([projectId, practice])
}
```

Vérifier que `ProjectMlStack` a bien cette forme (`@@id([projectId, ml])`) et aligner si le nommage diffère.
Puis : `pnpm exec prisma generate` (PAS de `db push`).

- [ ] **Step 6: zod**

Dans `schemas/index.ts` :

```ts
import { FAMILIES, PRACTICES } from "@/lib/practices";
import { TRAININGS } from "@/lib/training";

export const PracticeEnum = z.enum(PRACTICES);
export const PracticeFamilyEnum = z.enum(FAMILIES);
export const TrainingEnum = z.enum(TRAININGS);
```

`ProjectFiltersSchema` gagne :

```ts
	practice: z.array(PracticeFamilyEnum).optional(),
	training: z.enum(["only", "exclude"]).optional(),
```

`AdminProjectSchema` gagne :

```ts
	practices: z
		.array(PracticeEnum)
		.max(PRACTICES.length)
		.default([])
		.transform((v) => [...new Set(v)]),
	training: TrainingEnum.nullable().default(null),
```

Ajouter un test dans `schemas/index.test.ts` (créer s'il n'existe pas) :

```ts
import { describe, expect, it } from "vitest";
import { AdminProjectSchema, ProjectFiltersSchema } from "@/schemas";

const base = { title: "t", description: "d" };

describe("AdminProjectSchema — pratiques et formation", () => {
	it("défauts, doublons et valeurs inconnues", () => {
		const ok = AdminProjectSchema.parse(base);
		expect(ok.practices).toEqual([]);
		expect(ok.training).toBeNull();
		expect(
			AdminProjectSchema.parse({ ...base, practices: ["Hardening", "Hardening"] }).practices,
		).toEqual(["Hardening"]);
		expect(AdminProjectSchema.safeParse({ ...base, practices: ["Foo"] }).success).toBe(false);
		expect(AdminProjectSchema.safeParse({ ...base, training: "Bac" }).success).toBe(false);
		expect(AdminProjectSchema.parse({ ...base, training: "AIEngineer" }).training).toBe("AIEngineer");
	});

	it("filtres : famille et formation", () => {
		expect(ProjectFiltersSchema.parse({ practice: ["MLOps"], training: "only" })).toMatchObject({
			practice: ["MLOps"],
			training: "only",
		});
		expect(ProjectFiltersSchema.safeParse({ training: "maybe" }).success).toBe(false);
	});
});
```

- [ ] **Step 7: Verify and commit**

Run: `pnpm exec vitest run lib/practices.test.ts lib/training.test.ts schemas && pnpm exec tsc --noEmit`
Expected: tests PASS. `tsc` peut signaler des objets `AdminProject`/`NormalizedProject` incomplets (champs
`practices`, `training`) : c'est l'objet de la tâche 2, ne pas les corriger ici sauf dans les fichiers de ce lot.
Si `tsc` échoue uniquement pour cela, noter les fichiers dans le rapport.

```bash
pnpm exec biome check --write lib/practices.ts lib/practices.test.ts lib/training.ts lib/training.test.ts schemas
git add prisma lib/practices* lib/training* schemas
git commit -m "feat(data): pratiques Ops et parcours de formation (schéma, modules, zod)"
```

---

### Task 2: Acheminement des données (lecture publique, écriture admin)

**Files:**
- Modify: `lib/projects-data.ts`, `app/actions/projects.action.ts`, `app/actions/admin.action.ts`,
  `lib/admin/project-form.ts`, `app/(admin)/admin/projects/[id]/page.tsx`
- Modify fixtures: `components/register/register.test.tsx`, `components/register/register-view.test.tsx`,
  `lib/register.test.ts` (ajouter `practices: [], training: null` à l'objet de base)
- Test: `lib/projects-data.test.ts`, `lib/projects-filters.test.ts` (créé)

**Interfaces:**
- Consumes: tâche 1 (`Practice`, `Training`, `PRACTICES_OF`, `PracticeFamily`).
- Produces: `NormalizedProject.practices: { practice: string }[]`, `NormalizedProject.training: string | null` ;
  `buildProjectWhere(filters: ProjectFilters): Prisma-like object` exporté depuis un module pur
  `lib/projects-filters.ts` ; `getProjects` filtre sur `practice` et `training`.

- [ ] **Step 1: Write the failing tests**

Dans `lib/projects-data.test.ts`, ajouter :

```ts
it("withProjectDefaults complète pratiques et formation d'un ancien cache", () => {
	const old = { ...sample } as Record<string, unknown>;
	delete old.practices;
	delete old.training;
	const p = withProjectDefaults(old as unknown as NormalizedProject);
	expect(p.practices).toEqual([]);
	expect(p.training).toBeNull();
});
```

(`sample` = l'objet `NormalizedProject` déjà utilisé dans ce fichier par le test « old-shape » de la PR #14 ;
réutiliser son nom réel.)

Créer `lib/projects-filters.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { buildProjectWhere } from "./projects-filters";

describe("buildProjectWhere", () => {
	it("famille → pratiques de la famille", () => {
		expect(buildProjectWhere({ practice: ["SecOps"] }).practices).toEqual({
			some: {
				practice: {
					in: ["DependencyUpdates", "StaticAnalysis", "SecretsManagement", "Hardening"],
				},
			},
		});
	});

	it("formation : only / exclude", () => {
		expect(buildProjectWhere({ training: "only" }).training).toEqual({ not: null });
		expect(buildProjectWhere({ training: "exclude" }).training).toBeNull();
		expect("training" in buildProjectWhere({})).toBe(false);
	});

	it("garde les filtres existants", () => {
		expect(buildProjectWhere({ domain: ["LLM"] }).domains).toEqual({
			some: { domain: { in: ["LLM"] } },
		});
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run lib/projects-data.test.ts lib/projects-filters.test.ts`
Expected: FAIL.

- [ ] **Step 3: Extract and extend the where builder**

Créer `lib/projects-filters.ts` en déplaçant tel quel le bloc de construction de `where` de
`getProjectsFromDb` (`search`, `language`, `database`, `backend`, `frontend`, `devops`, `domain`) dans :

```ts
import { PRACTICES_OF } from "@/lib/practices";
import type { ProjectFilters } from "@/schemas";

/** Clause `where` Prisma des filtres du registre (logique pure). */
export function buildProjectWhere(filters: ProjectFilters): Record<string, unknown> {
	const where: Record<string, unknown> = {};
	// … blocs existants déplacés depuis projects.action.ts, inchangés …
	if (filters.practice?.length) {
		where.practices = {
			some: { practice: { in: filters.practice.flatMap((f) => PRACTICES_OF[f]) } },
		};
	}
	if (filters.training === "only") where.training = { not: null };
	else if (filters.training === "exclude") where.training = null;
	return where;
}
```

Dans `projects.action.ts` : `const where = buildProjectWhere(filters ?? {});`, ajouter `practices: true,
training: true` aux deux `select`, mapper `practices: p.practices.map((x) => ({ practice: x.practice }))`,
renommer les clés de cache `"projects-v2"` → `"projects-v3"` et `"project-v2"` → `"project-v3"`.

- [ ] **Step 4: NormalizedProject, JSON, defaults**

Dans `lib/projects-data.ts` : ajouter `practices: { practice: string }[]` et `training: string | null` à
`NormalizedProject`, `practices: [], training: null` dans `normalizeProject`, et dans `withProjectDefaults` :

```ts
		practices: p.practices ?? [],
		training: p.training ?? null,
```

Dans `getProjectsFromJson`, après le filtre `devops` :

```ts
	if (filters?.training === "only") projects = projects.filter((p) => p.training);
	if (filters?.training === "exclude") projects = projects.filter((p) => !p.training);
```

(le JSON n'a jamais de pratiques : un filtre `practice` y vide la liste, ce qui est correct.)

```ts
	if (filters?.practice?.length) {
		const wanted = new Set(filters.practice.flatMap((f) => PRACTICES_OF[f]) as string[]);
		projects = projects.filter((p) => p.practices.some((x) => wanted.has(x.practice)));
	}
```

- [ ] **Step 5: Admin writes**

Dans `app/actions/admin.action.ts` :
- `upsertProjectRelations` : `await tx.projectPractice.deleteMany({ where: { projectId } });` avec les autres,
  puis
  ```ts
	const practices = normalizePractices(data.practices);
	if (practices.length > 0) {
		await tx.projectPractice.createMany({
			data: practices.map((practice) => ({ projectId, practice })),
		});
	}
  ```
- `createProject` et `updateProject` : `training: data.training ?? null,` dans `data`.

Dans `lib/admin/project-form.ts` (`buildPreviewProject`) :
`practices: form.practices.map((practice) => ({ practice })), training: form.training ?? null,`.

Dans `app/(admin)/admin/projects/[id]/page.tsx` : ajouter `practices: true, training: true` au `select`, et
`practices: project.practices.map((p) => p.practice), training: project.training ?? null,` à l'objet `initial`.

Fixtures de test : ajouter `practices: [], training: null` aux objets de base listés dans **Files**.

- [ ] **Step 6: Verify and commit**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: tout PASS, `tsc` propre (hors champs que les tâches 3–5 ajoutent : il ne doit y en avoir aucun).

```bash
pnpm exec biome check --write lib app components
git add -A lib app components
git commit -m "feat(data): pratiques et formation lues, filtrées et écrites (cache projects-v3)"
```

---

### Task 3: Détection des pratiques et synchronisation additive

**Files:**
- Modify: `lib/github/client.ts` (chemins marqueurs), `lib/github/detect.ts`, `lib/github/board.ts`,
  `lib/github/sync.ts`, `lib/github/apply.ts`, `app/actions/admin.action.ts` (`applySync`, `ImportRepoSchema`)
- Test: `lib/github/detect.test.ts`, `lib/github/sync.test.ts`, `lib/github/client.test.ts`, `lib/github/board.test.ts`

**Interfaces:**
- Consumes: tâche 1 (`Practice`, `PRACTICES`, `normalizePractices`), tâche 2 (écriture `projectPractice`).
- Produces: `Detection.practices: Practice[]` ; `RemoteRepo.practices?: string[]` ; `SyncProject.practices: string[]` ;
  `LIST_FIELDS` inclut `"practices"` ; `ADDITIVE_FIELDS = ["practices"] as const` exporté de `sync.ts` ;
  `FIELD_LABELS.practices = "Pratiques"` ; `ACCEPTABLE_FIELDS` inclut `"practices"`.

- [ ] **Step 1: Write the failing detection tests**

Dans `lib/github/detect.test.ts` :

```ts
describe("detectProject — pratiques", () => {
	const has = (over: Partial<DetectInput>, practice: string) =>
		expect(detect(over).practices).toContain(practice);
	const hasNot = (over: Partial<DetectInput>, practice: string) =>
		expect(detect(over).practices).not.toContain(practice);

	it("DevOps", () => {
		has({ filePaths: [".github/workflows/ci.yml"] }, "ContinuousIntegration");
		has({ filePaths: [".forgejo/workflows/test.yaml"] }, "ContinuousIntegration");
		has({ filePaths: [".gitlab-ci.yml"] }, "ContinuousIntegration");
		hasNot({ filePaths: [".github/workflows/README.md"] }, "ContinuousIntegration");
		has({ filePaths: ["api/Dockerfile"] }, "Containerization");
		has({ filePaths: ["deploy/compose.yaml"] }, "Containerization");
		has({ filePaths: [".github/workflows/deploy.yml"] }, "ContinuousDeployment");
		has({ filePaths: [".github/workflows/release-please.yml"] }, "ContinuousDeployment");
		has({ filePaths: [".github/workflows/ci-cd.yml"] }, "ContinuousDeployment");
		has({ filePaths: ["vercel.json"] }, "ContinuousDeployment");
		hasNot({ filePaths: [".github/workflows/abcd.yml"] }, "ContinuousDeployment");
		hasNot({ filePaths: [".github/workflows/scd-report.yml"] }, "ContinuousDeployment");
		has({ npm: ["vitest"] }, "AutomatedTesting");
		has({ python: ["pytest"] }, "AutomatedTesting");
		has({ filePaths: ["tests/test_api.py"] }, "AutomatedTesting");
		has({ npm: ["@opentelemetry/api"] }, "Observability");
		has({ python: ["opentelemetry-sdk"] }, "Observability");
		has({ python: ["prometheus_client"] }, "Observability");
	});

	it("SecOps", () => {
		has({ filePaths: ["renovate.json"] }, "DependencyUpdates");
		has({ filePaths: [".github/dependabot.yml"] }, "DependencyUpdates");
		has({ filePaths: [".github/workflows/codeql.yml"] }, "StaticAnalysis");
		has({ python: ["bandit"] }, "StaticAnalysis");
		has({ filePaths: [".gitleaks.toml"] }, "SecretsManagement");
		has({ filePaths: [".github/workflows/trufflehog.yml"] }, "SecretsManagement");
	});

	it("MLOps", () => {
		has({ python: ["mlflow"] }, "ExperimentTracking");
		has({ python: ["wandb"] }, "ExperimentTracking");
		has({ filePaths: ["dvc.yaml"] }, "DataVersioning");
		has({ filePaths: ["data/raw.csv.dvc"] }, "DataVersioning");
		has({ python: ["vllm"] }, "ModelServing");
		has({ composeImages: ["vllm/vllm-openai"] }, "ModelServing");
		has({ python: ["fastapi", "scikit-learn"] }, "ModelServing");
		hasNot({ python: ["fastapi"] }, "ModelServing");
		has({ python: ["langfuse"] }, "LlmEvaluation");
		has({ npm: ["promptfoo"] }, "LlmEvaluation");
	});

	it("jamais Durcissement ni Registre de modèles, ordre canonique", () => {
		const r = detect({
			filePaths: ["Dockerfile", ".github/workflows/ci.yml", "renovate.json"],
			python: ["mlflow", "fastapi", "torch"],
		});
		expect(r.practices).toEqual([
			"ContinuousIntegration",
			"Containerization",
			"DependencyUpdates",
			"ExperimentTracking",
			"ModelServing",
		]);
	});
});
```

Run: `pnpm exec vitest run lib/github/detect.test.ts` → FAIL (`practices` undefined).

- [ ] **Step 2: Implement detection**

Dans `lib/github/detect.ts` : importer `{ normalizePractices, type Practice } from "@/lib/practices"`, ajouter
`practices: Practice[]` à `Detection`, et avant le `return` :

```ts
	const paths = input.filePaths;
	const workflowNames = paths
		.filter((p) => /^\.(github|forgejo)\/workflows\/[^/]+\.ya?ml$/.test(p))
		.map((p) => p.slice(p.lastIndexOf("/") + 1).toLowerCase());
	const wf = (re: RegExp) => workflowNames.some((n) => re.test(n));
	const anyPath = (re: RegExp) => paths.some((p) => re.test(p));

	const practices = new Set<Practice>();
	if (workflowNames.length > 0 || anyPath(/^\.gitlab-ci\.yml$/))
		practices.add("ContinuousIntegration");
	if (
		devops.has("Docker") ||
		anyPath(/(^|\/)(docker-)?compose\.ya?ml$/)
	)
		practices.add("Containerization");
	// « cd » doit être un mot entier : `ci-cd.yml` oui, `abcd.yml` / `scd-report.yml` non.
	if (wf(/(^|[-_.])(deploy|release|cd)([-_.]|$)/) || anyPath(/^vercel\.json$/))
		practices.add("ContinuousDeployment");
	if (
		matches(deps, "vitest", "jest", "pytest", "@playwright/test", "playwright") ||
		anyPath(/(^|\/)(tests|__tests__)\//)
	)
		practices.add("AutomatedTesting");
	if (matches(deps, /^opentelemetry-/, /^@opentelemetry\//, "prometheus-client", "prom-client"))
		practices.add("Observability");
	if (anyPath(/^(\.github\/)?renovate\.json5?$/) || anyPath(/^\.github\/dependabot\.ya?ml$/))
		practices.add("DependencyUpdates");
	if (wf(/codeql|semgrep|bandit/) || anyPath(/^\.semgrep\.ya?ml$/) || matches(deps, "bandit", "semgrep"))
		practices.add("StaticAnalysis");
	if (wf(/gitleaks|trufflehog/) || anyPath(/^\.gitleaks\.toml$|^\.secrets\.baseline$/))
		practices.add("SecretsManagement");
	if (matches(deps, "mlflow", "wandb", "comet-ml", "neptune"))
		practices.add("ExperimentTracking");
	if (anyPath(/^dvc\.yaml$|^\.dvc\/|\.dvc$/) || deps.has("dvc"))
		practices.add("DataVersioning");
	if (
		matches(deps, "vllm", "bentoml", "torchserve", "ray") ||
		[...images].some((i) => /(^|\/)vllm/.test(i)) ||
		(deps.has("fastapi") && matches(deps, "torch", "transformers", "scikit-learn"))
	)
		practices.add("ModelServing");
	if (matches(deps, "langfuse", "ragas", "deepeval", "promptfoo", "arize-phoenix"))
		practices.add("LlmEvaluation");
```

et `practices: normalizePractices([...practices]),` dans l'objet retourné. Note : `norm()` transforme
`prometheus_client` en `prometheus-client` et `comet_ml` en `comet-ml`. Vérifier aussi que la règle VLLM existante
sur les images (`/^vllm(-|$)/`) n'est pas affectée.

Run: `pnpm exec vitest run lib/github/detect.test.ts` → PASS.

- [ ] **Step 3: Marker paths in the bundle (test first)**

Dans `lib/github/client.test.ts`, dans le test existant qui construit un arbre de dépôt pour `getRepoBundle`,
ajouter à l'arbre `renovate.json`, `.github/dependabot.yml`, `dvc.yaml`, `tests/test_x.py`, `deploy/compose.yaml`,
`vercel.json`, `src/app.py`, et vérifier :

```ts
expect(bundle.filePaths).toEqual(
	expect.arrayContaining([
		"renovate.json",
		".github/dependabot.yml",
		"dvc.yaml",
		"tests/test_x.py",
		"deploy/compose.yaml",
		"vercel.json",
	]),
);
expect(bundle.filePaths).not.toContain("src/app.py");
```

Run → FAIL. Puis dans `client.ts`, remplacer le filtre de `filePaths` :

```ts
/** Chemins utiles à la détection des pratiques (aucune requête de plus : l'arbre est déjà chargé). */
const MARKER_RE =
	/^(\.(github|forgejo)\/workflows\/|\.gitlab-ci\.yml$|\.github\/dependabot\.ya?ml$|(\.github\/)?renovate\.json5?$|\.semgrep\.ya?ml$|\.gitleaks\.toml$|\.secrets\.baseline$|dvc\.yaml$|\.dvc\/|vercel\.json$)|(^|\/)(docker-)?compose\.ya?ml$|\.dvc$|(^|\/)(tests|__tests__)\//;
const MAX_MARKERS = 200;
```

```ts
	const markers = paths
		.filter((p) => isDockerfile(p) || MARKER_RE.test(p))
		.slice(0, MAX_MARKERS);
	const filePaths = [...markers, ...images];
```

Run: `pnpm exec vitest run lib/github/client.test.ts` → PASS.

- [ ] **Step 4: Additive sync diff (test first)**

Dans `lib/github/sync.test.ts` (adapter au nom réel des helpers `project()`/`remote()` du fichier, et ajouter
`practices: []` à leur objet de base) :

```ts
describe("pratiques : diff additif", () => {
	it("propose seulement les ajouts, garde les pratiques manuelles", () => {
		const d = computeDiff(
			project({ practices: ["Hardening", "ContinuousIntegration"] }),
			remote({ practices: ["ContinuousIntegration", "DependencyUpdates"] }),
		).find((x) => x.field === "practices");
		expect(d).toEqual({
			field: "practices",
			kind: "list",
			added: ["DependencyUpdates"],
			removed: [],
			proposedList: ["ContinuousIntegration", "DependencyUpdates", "Hardening"],
		});
	});

	it("aucun écart si rien de nouveau, même si la détection en voit moins", () => {
		const diffs = computeDiff(
			project({ practices: ["Hardening", "ContinuousIntegration"] }),
			remote({ practices: ["ContinuousIntegration"] }),
		);
		expect(diffs.some((x) => x.field === "practices")).toBe(false);
	});
});
```

Run → FAIL. Puis dans `sync.ts` :
- `practices?: string[]` dans `RemoteRepo`, `practices: string[]` dans `SyncProject`, `"practices"` à la fin de
  `LIST_FIELDS` ;
- `export const ADDITIVE_FIELDS: readonly ListField[] = ["practices"];`
- dans la boucle de `computeDiff` :

```ts
	for (const field of LIST_FIELDS) {
		const detected = remote[field];
		if (!detected) continue;
		const current = project[field];
		// Champ additif : la détection ne voit pas tout (pratiques cochées à la main), elle ne retire rien.
		const proposedList = ADDITIVE_FIELDS.includes(field)
			? normalizePractices([...current, ...detected])
			: detected;
		const added = proposedList.filter((v) => !current.includes(v));
		const removed = current.filter((v) => !proposedList.includes(v));
		if (added.length || removed.length) {
			diffs.push({ field, kind: "list", added, removed, proposedList });
		}
	}
```

(import `normalizePractices` depuis `@/lib/practices`.)

Run: `pnpm exec vitest run lib/github/sync.test.ts` → PASS.

- [ ] **Step 5: Board, apply, server actions**

- `board.ts` : `practices: { select: { practice: true } }` dans `SYNC_SELECT` ; `practices: { practice: string }[]`
  dans `DbProjectRow` ; `practices: row.practices.map((x) => x.practice)` dans `toBoardProject` ;
  `practices: [...detected.practices]` dans `remoteFromBundle` ; `practices: "Pratiques"` dans `FIELD_LABELS`.
  Ajouter `practices: [{ practice: "Hardening" }]` à la ligne de base de `board.test.ts` et vérifier
  `toBoardProject(row).practices` égal à `["Hardening"]`.
- `apply.ts` : `practices: z.array(PracticeEnum),` dans `listSchemas` (import `PracticeEnum` de `@/schemas`),
  `plan.lists[key] = key === "domains" ? normalizeDomains(parsed) : key === "practices" ? normalizePractices(parsed) : parsed;`,
  `"practices"` dans `ACCEPTABLE_FIELDS`. Test dans `sync.test.ts` ou `apply` existant :
  `expect(planWrite({ practices: ["Hardening", "Foo"] })).toThrow` → utiliser
  `expect(() => planWrite({ practices: ["Foo"] })).toThrow()` et
  `expect(planWrite({ practices: ["LlmEvaluation", "Hardening"] }).lists.practices).toEqual(["Hardening", "LlmEvaluation"])`.
- `admin.action.ts` `applySync` : après le bloc `lists.domains` :

```ts
			if (lists.practices) {
				await tx.projectPractice.deleteMany({ where: { projectId: id } });
				await tx.projectPractice.createMany({
					data: lists.practices.map((practice) => ({
						projectId: id,
						practice: practice as never,
					})),
				});
			}
```

- `ImportRepoSchema` : ajouter `practices: true, training: true` au `.pick({...})`.

- [ ] **Step 6: Verify and commit**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: PASS, `tsc` propre.

```bash
pnpm exec biome check --write lib/github app/actions
git add -A lib/github app/actions
git commit -m "feat(github): détection des pratiques et diff de synchronisation additif"
```

---

### Task 4: Admin — import, fiche éditoriale, diff

**Files:**
- Create: `app/(admin)/admin/PracticeFields.tsx`, `app/(admin)/admin/TrainingSelect.tsx`
- Modify: `app/(admin)/admin/github/ImportForm.tsx`, `app/(admin)/admin/projects/[id]/ProjectEditForm.tsx`,
  `app/(admin)/admin/github/DiffPanel.tsx`
- Test: `app/(admin)/admin/practice-fields.ssr.test.tsx` (créé), `app/(admin)/admin/projects/[id]/project-form.ssr.test.tsx`

**Interfaces:**
- Consumes: tâche 1 (`PRACTICES_OF`, `FAMILIES`, `PRACTICE_LABELS`, `TRAININGS`, `TRAINING_LABELS`,
  `looksLikeOpenClassrooms`), tâche 3 (`ChipGroup` existant, `FIELD_LABELS.practices`).
- Produces: `<PracticeFields selected={string[]} onToggle={(v: string) => void} />` (trois `ChipGroup`
  « DevOps », « SecOps », « MLOps ») ; `<TrainingSelect id value={Training|null} onChange hint={boolean} />`.

- [ ] **Step 1: Write the failing SSR test**

`app/(admin)/admin/practice-fields.ssr.test.tsx` :

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PracticeFields } from "./PracticeFields";
import { TrainingSelect } from "./TrainingSelect";

describe("PracticeFields", () => {
	it("trois groupes, libellés français, état coché", () => {
		const html = renderToStaticMarkup(
			<PracticeFields selected={["Hardening"]} onToggle={() => {}} />,
		);
		for (const legend of ["DevOps", "SecOps", "MLOps"]) expect(html).toContain(legend);
		expect(html).toContain("Durcissement");
		expect(html).toContain("Évaluation / monitoring LLM");
		expect(html.match(/checked=""/g)).toHaveLength(1);
	});
});

describe("TrainingSelect", () => {
	it("options et indice OpenClassrooms", () => {
		const html = renderToStaticMarkup(
			<TrainingSelect id="t" value={null} onChange={() => {}} hint />,
		);
		expect(html).toContain("Aucune");
		expect(html).toContain("Développeur FullStack IA");
		expect(html).toContain("AI Engineer");
		expect(html).toContain("Ressemble à un projet OpenClassrooms");
		expect(
			renderToStaticMarkup(
				<TrainingSelect id="t" value="AIEngineer" onChange={() => {}} hint={false} />,
			),
		).not.toContain("Ressemble");
	});
});
```

Run: `pnpm exec vitest run "app/(admin)/admin/practice-fields.ssr.test.tsx"` → FAIL.

- [ ] **Step 2: Implement the components**

`app/(admin)/admin/PracticeFields.tsx` :

```tsx
"use client";

import { FAMILIES, PRACTICE_LABELS, PRACTICES_OF } from "@/lib/practices";
import { ChipGroup } from "./github/ChipGroup";

/** Pratiques cochables, une rangée par famille. */
export function PracticeFields({
	selected,
	onToggle,
}: {
	selected: readonly string[];
	onToggle: (value: string) => void;
}) {
	return (
		<div className="space-y-3">
			{FAMILIES.map((family) => (
				<ChipGroup
					key={family}
					legend={family}
					options={PRACTICES_OF[family]}
					selected={selected}
					onToggle={onToggle}
					labels={PRACTICE_LABELS}
				/>
			))}
		</div>
	);
}
```

`app/(admin)/admin/TrainingSelect.tsx` :

```tsx
"use client";

import { isTraining, type Training, TRAINING_LABELS, TRAININGS } from "@/lib/training";

/** Parcours OpenClassrooms ; `hint` affiche l'indice tiré du nom du dépôt (jamais de déduction). */
export function TrainingSelect({
	id,
	value,
	onChange,
	hint,
	className = "",
}: {
	id: string;
	value: Training | null;
	onChange: (value: Training | null) => void;
	hint: boolean;
	className?: string;
}) {
	return (
		<div>
			<label htmlFor={id} className="text-xs text-zinc-500 block mb-1">
				Formation
			</label>
			<select
				id={id}
				className={className}
				value={value ?? ""}
				aria-describedby={hint ? `${id}-hint` : undefined}
				onChange={(e) => onChange(isTraining(e.target.value) ? e.target.value : null)}
			>
				<option value="">Aucune</option>
				{TRAININGS.map((t) => (
					<option key={t} value={t}>
						{TRAINING_LABELS[t]}
					</option>
				))}
			</select>
			{hint ? (
				<p id={`${id}-hint`} className="mt-1 text-xs text-amber-400">
					Ressemble à un projet OpenClassrooms : choisis le parcours si c'est le cas.
				</p>
			) : null}
		</div>
	);
}
```

Run le test → PASS.

- [ ] **Step 3: Wire ImportForm**

Dans `ImportForm.tsx` : état `practices` initialisé à `remote.practices ?? []` (ajouter `"practices"` au type
`ListKey` et à `lists`, mais **pas** à `GROUPS`) ; état `const [training, setTraining] = useState<Training | null>(null);` ;
après la boucle `GROUPS.map(...)` :

```tsx
			<PracticeFields
				selected={lists.practices}
				onToggle={(v) => toggle("practices", v)}
			/>
			<TrainingSelect
				id={`${id}-training`}
				className={field}
				value={training}
				onChange={setTraining}
				hint={training === null && looksLikeOpenClassrooms(repoName(remote.fullName))}
			/>
```

et `training,` dans l'appel `importRepo({ ... })`.

- [ ] **Step 4: Wire ProjectEditForm**

Après le `<fieldset>` « Domaines IA/Data » :

```tsx
			<fieldset>
				<legend className="text-xs text-zinc-500 mb-1.5">Pratiques</legend>
				<PracticeFields
					selected={form.practices}
					onToggle={(v) => toggleArrayValue("practices", v)}
				/>
			</fieldset>
```

Dans la grille « Statut / Période », passer à `grid-cols-3` et ajouter :

```tsx
				<TrainingSelect
					id="training"
					className={FIELD}
					value={form.training ?? null}
					onChange={(v) => setField("training", v)}
					hint={!form.training && looksLikeOpenClassrooms(repoNameOf(form.github))}
				/>
```

avec, en haut du fichier, `const repoNameOf = (url?: string) => url?.split("/").filter(Boolean).pop() ?? "";`.

Dans `project-form.ssr.test.tsx`, ajouter `practices: ["Hardening"], training: "AIEngineer"` à l'objet `initial`
existant et vérifier que le rendu contient `Pratiques`, `Durcissement` et `<option value="AIEngineer" selected="">`.

- [ ] **Step 5: DiffPanel**

Libellé de liste : pour `d.field === "practices"`, afficher `"Pratiques : ajouter les pratiques détectées"` au lieu
de `… : remplacer par la liste GitHub`. Valeurs ajoutées : `{d.field === "practices" ? PRACTICE_LABELS[v as Practice] ?? v : v}`.

- [ ] **Step 6: Verify and commit**

Run: `pnpm test && pnpm exec tsc --noEmit && pnpm lint`
Expected: PASS.

```bash
pnpm exec biome check --write "app/(admin)"
git add -A "app/(admin)"
git commit -m "feat(admin): pratiques par famille et parcours de formation (import, fiche, diff)"
```

---

### Task 5: Site public — badge formation et marques de pratiques

**Files:**
- Create: `components/register/TrainingBadge.tsx`, `components/register/PracticeMarks.tsx`
- Modify: `components/register/FeaturedCard.tsx`, `components/register/IndexRow.tsx`
- Test: `components/register/register.test.tsx`

**Interfaces:**
- Consumes: tâche 1 (`trainingBadge`, `trainingBadgeShort`, `isTraining`, `practicesByFamily`, `PRACTICE_LABELS`),
  tâche 2 (`NormalizedProject.practices`, `.training`).
- Produces: `<TrainingBadge training={string|null} short? className? />`,
  `<PracticeMarks practices={{practice:string}[]} variant="full"|"compact" className? />`.

- [ ] **Step 1: Write the failing tests**

Dans `components/register/register.test.tsx` :

```tsx
describe("badge formation et pratiques", () => {
	const withOps = p({
		training: "AIEngineer",
		practices: [
			{ practice: "ExperimentTracking" },
			{ practice: "ContinuousIntegration" },
			{ practice: "ModelServing" },
		],
	});

	it("FeaturedCard : badge complet et une ligne par famille", () => {
		const html = renderToStaticMarkup(
			<FeaturedCard project={withOps} figureNumber={1} points={points} neighbors={{}} />,
		);
		expect(html).toContain("Projet de formation · OpenClassrooms · AI Engineer");
		expect(html).toContain("DevOps");
		expect(html).toContain("Intégration continue");
		expect(html).toContain("MLOps");
		expect(html).toContain("Suivi d&#x27;expériences, Service de modèle");
	});

	it("IndexRow : abrégé visible, complet pour lecteur d'écran", () => {
		const html = renderToStaticMarkup(<IndexRow project={withOps} />);
		expect(html).toContain("Formation OC · AI Engineer");
		expect(html).toMatch(/sr-only[^>]*>Projet de formation · OpenClassrooms · AI Engineer/);
		expect(html).toContain("DevOps · MLOps");
		expect(html).toMatch(/sr-only[^>]*>[^<]*Intégration continue/);
	});

	it("rien sans données, valeur inconnue ignorée", () => {
		const html = renderToStaticMarkup(<IndexRow project={p({ training: "Bac" })} />);
		expect(html).not.toContain("Formation OC");
		expect(html).not.toContain("DevOps");
	});
});
```

(Les props exactes de `FeaturedCard` sont celles utilisées par les tests existants du même fichier : les recopier.)

Run: `pnpm exec vitest run components/register/register.test.tsx` → FAIL.

- [ ] **Step 2: Implement the components**

`components/register/TrainingBadge.tsx` :

```tsx
import { isTraining, trainingBadge, trainingBadgeShort } from "@/lib/training";

/** Tampon « projet de formation » : complet, ou abrégé avec le texte complet pour lecteur d'écran. */
export default function TrainingBadge({
	training,
	short = false,
	className = "",
}: Readonly<{ training: string | null; short?: boolean; className?: string }>) {
	if (!isTraining(training)) return null;
	const full = trainingBadge(training);
	return (
		<span
			title={short ? full : undefined}
			className={`inline-block rounded-sm border border-dashed border-ink-soft/60 px-1.5 py-0.5 font-mono text-[10px] uppercase leading-none tracking-wide text-ink-soft ${className}`}
		>
			{short ? (
				<>
					<span aria-hidden="true">{trainingBadgeShort(training)}</span>
					<span className="sr-only">{full}</span>
				</>
			) : (
				full
			)}
		</span>
	);
}
```

`components/register/PracticeMarks.tsx` :

```tsx
import { PRACTICE_LABELS, practicesByFamily } from "@/lib/practices";

/** Pratiques par famille : une ligne par famille (`full`) ou les seules familles (`compact`). */
export default function PracticeMarks({
	practices,
	variant,
	className = "",
}: Readonly<{
	practices: { practice: string }[];
	variant: "full" | "compact";
	className?: string;
}>) {
	const groups = practicesByFamily(practices.map((p) => p.practice));
	if (groups.length === 0) return null;
	const line = (g: (typeof groups)[number]) =>
		`${g.family} — ${g.practices.map((p) => PRACTICE_LABELS[p]).join(", ")}`;
	if (variant === "compact") {
		const full = groups.map(line).join(" ; ");
		return (
			<span title={full} className={className}>
				<span aria-hidden="true">{groups.map((g) => g.family).join(" · ")}</span>
				<span className="sr-only">Pratiques : {full}</span>
			</span>
		);
	}
	return (
		<ul aria-label="Pratiques" className={`m-0 list-none p-0 font-mono text-[11px] text-ink-soft ${className}`}>
			{groups.map((g) => (
				<li key={g.family}>
					<span className="text-ink">{g.family}</span> —{" "}
					{g.practices.map((p) => PRACTICE_LABELS[p]).join(", ")}
				</li>
			))}
		</ul>
	);
}
```

- [ ] **Step 3: Place them**

`FeaturedCard.tsx`, juste sous le `<h3>` :
`<TrainingBadge training={project.training} className="mt-2" />`, et sous le paragraphe `techNames` :
`<PracticeMarks practices={project.practices} variant="full" className="mt-2" />`.

`IndexRow.tsx` : élargir la condition de la ligne secondaire à
`tech || project.domains.length > 0 || project.practices.length > 0 || project.training`, et dans ce `<span>` :

```tsx
						<TrainingBadge training={project.training} short />
						<DomainChips domains={project.domains} />
						{tech ? <span>{tech}</span> : null}
						<PracticeMarks practices={project.practices} variant="compact" />
```

Run: `pnpm exec vitest run components/register` → PASS.

- [ ] **Step 4: Verify and commit**

Run: `pnpm test && pnpm exec tsc --noEmit`

```bash
pnpm exec biome check --write components/register
git add -A components/register
git commit -m "feat(register): badge projet de formation et pratiques par famille"
```

---

### Task 6: Site public — filtres Pratiques et Formation

**Files:**
- Modify: `components/register/ProjectRegister.tsx` (`parseFilters`, `NO_FILTERS`, `filtersActive`),
  `components/register/FilterBar.tsx`
- Test: `components/register/register.test.tsx`

**Interfaces:**
- Consumes: tâche 1 (`FAMILIES`, `PracticeFamilyEnum`), tâche 2 (`getProjects` filtre `practice`, `training`).
- Produces: paramètres d'URL `practice=<Famille>` et `training=only|exclude`.

- [ ] **Step 1: Write the failing test**

```tsx
describe("parseFilters — pratiques et formation", () => {
	it("lit les familles et la formation, ignore l'inconnu", () => {
		const f = parseFilters(new URLSearchParams("practice=MLOps,Foo&training=only"));
		expect(f.practice).toEqual(["MLOps"]);
		expect(f.training).toBe("only");
		const g = parseFilters(new URLSearchParams("training=maybe"));
		expect(g.training).toBeUndefined();
		expect(g.practice).toEqual([]);
	});
});
```

Run → FAIL.

- [ ] **Step 2: Implement parseFilters**

```ts
import { FAMILIES, type PracticeFamily } from "@/lib/practices";
// …
		practice: list("practice").filter((v): v is PracticeFamily =>
			(FAMILIES as readonly string[]).includes(v),
		),
		training: (["only", "exclude"] as const).find((v) => v === params.get("training")),
```

Ajouter `practice: []` à `NO_FILTERS` ; dans `filtersActive`, ajouter `filters.practice` à la liste et
`|| Boolean(filters.training)`. Run → PASS.

- [ ] **Step 3: FilterBar**

Lire `practice` et `training` depuis `searchParams` comme `domain` ; les inclure dans `hasFilters`. Après le
`Select` « Domaine » :

```tsx
				<Select
					value={practice[0] ?? "all"}
					onValueChange={(value) =>
						updateSearchParams("practice", value === "all" ? [] : [value])
					}
				>
					<SelectTrigger className="w-[160px]" aria-label="Pratiques">
						<SelectValue placeholder="Pratiques" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Toutes les pratiques</SelectItem>
						{FAMILIES.map((f) => (
							<SelectItem key={f} value={f}>
								{f}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={training ?? "all"}
					onValueChange={(value) =>
						updateSearchParams("training", value === "all" ? [] : [value])
					}
				>
					<SelectTrigger className="w-[180px]" aria-label="Formation">
						<SelectValue placeholder="Formation" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Tous les projets</SelectItem>
						<SelectItem value="only">Projets de formation</SelectItem>
						<SelectItem value="exclude">Hors formation</SelectItem>
					</SelectContent>
				</Select>
```

avec `const practice = searchParams.get("practice")?.split(",").filter(Boolean) ?? [];` et
`const training = searchParams.get("training");`. `updateSearchParams` accepte déjà `string[]` (vide = suppression).

- [ ] **Step 4: Verify and commit**

Run: `pnpm test && pnpm exec tsc --noEmit && pnpm lint`

```bash
pnpm exec biome check --write components/register
git add -A components/register
git commit -m "feat(register): filtres par famille de pratiques et par formation"
```

---

### Task 7: Page À propos sans RNCP, étiquetage initial des parcours

**Files:**
- Modify: `lib/about.ts`, `lib/about.test.ts`
- Create: `lib/catalogue/initial-training.ts`, `lib/catalogue/initial-training.test.ts`,
  `scripts/catalogue/apply-training.ts`
- Modify: `package.json` (script `catalogue:training`)

**Interfaces:**
- Consumes: tâche 1 (`Training`).
- Produces: `INITIAL_TRAINING: Record<number, Training>` ; commande `pnpm catalogue:training [--apply]`.

- [ ] **Step 1: Write the failing tests**

Remplacer le second test de `lib/about.test.ts` par :

```ts
	it("aucune mention RNCP ; diplôme full stack gardé, AI Engineer en cours", () => {
		expect(PARCOURS).toHaveLength(6);
		for (const s of PARCOURS)
			expect(s.description).not.toMatch(/RNCP|EQF|niveau [67]|bac \+/i);
		expect(PARCOURS.some((s) => s.title === "Diplômé Développeur full stack")).toBe(true);
		expect(
			PARCOURS.some((s) => /validé en juillet 2026/.test(s.description)),
		).toBe(true);
		const last = PARCOURS[PARCOURS.length - 1];
		expect(last.title).toBe("Parcours AI Engineer");
		expect(last.year).toContain("en cours");
		expect(last.description).not.toMatch(/obtenu|diplômé/i);
	});
```

`lib/catalogue/initial-training.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { INITIAL_TRAINING } from "./initial-training";

describe("INITIAL_TRAINING", () => {
	it("affectation validée par Will (2026-10-10)", () => {
		const of = (t: string) =>
			Object.entries(INITIAL_TRAINING)
				.filter(([, v]) => v === t)
				.map(([k]) => Number(k));
		expect(of("FullstackAI")).toEqual([1, 6, 7, 8, 9, 10, 11, 12, 16, 17, 18, 19, 26]);
		expect(of("AIEngineer")).toEqual([27, 28]);
		expect(INITIAL_TRAINING[5]).toBeUndefined();
	});
});
```

Run → FAIL.

- [ ] **Step 2: Implement**

`lib/about.ts` — descriptions des deux étapes :

```ts
		description:
			"Parcours Développeur FullStack IA chez OpenClassrooms, validé en juillet 2026 par le titre « Développeur full stack ».",
```

```ts
		description:
			"Dans la continuité, parcours AI Engineer chez OpenClassrooms.",
```

`lib/catalogue/initial-training.ts` :

```ts
import type { Training } from "../training";

/** Parcours de formation des projets existants (validé par Will le 2026-10-10) : id → parcours. */
export const INITIAL_TRAINING: Record<number, Training> = {
	1: "FullstackAI",
	6: "FullstackAI",
	7: "FullstackAI",
	8: "FullstackAI",
	9: "FullstackAI",
	10: "FullstackAI",
	11: "FullstackAI",
	12: "FullstackAI",
	16: "FullstackAI",
	17: "FullstackAI",
	18: "FullstackAI",
	19: "FullstackAI",
	26: "FullstackAI",
	27: "AIEngineer",
	28: "AIEngineer",
};
```

`scripts/catalogue/apply-training.ts` (même structure que `apply-domains.ts`) :

```ts
import { INITIAL_TRAINING } from "../../lib/catalogue/initial-training";
import { prisma } from "../../lib/db";

async function main() {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL manquante : lancer via `pnpm catalogue:training`.");
	}
	const apply = process.argv.includes("--apply");
	const ids = Object.keys(INITIAL_TRAINING).map(Number);
	const projects = await prisma.project.findMany({
		where: { id: { in: ids } },
		select: { id: true, title: true, training: true },
		orderBy: { id: "asc" },
	});
	const found = new Set(projects.map((p) => p.id));
	const missing = ids.filter((id) => !found.has(id));
	if (missing.length > 0) {
		throw new Error(`Projets absents de la base : ${missing.join(", ")}.`);
	}
	for (const p of projects)
		console.log(`#${p.id} ${p.title} : ${p.training ?? "-"} -> ${INITIAL_TRAINING[p.id]}`);
	if (!apply) {
		console.log("\nEssai à blanc : rien n'a été écrit (--apply pour appliquer).");
		return;
	}
	await prisma.$transaction(
		ids.map((id) =>
			prisma.project.update({ where: { id }, data: { training: INITIAL_TRAINING[id] } }),
		),
	);
	console.log(`\n${ids.length} projets rattachés à un parcours.`);
}

main()
	.catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
```

`package.json` : `"catalogue:training": "tsx --env-file=.env.local scripts/catalogue/apply-training.ts",`.

Run: `pnpm exec vitest run lib/about.test.ts lib/catalogue` → PASS.

- [ ] **Step 3: Verify and commit**

Run: `pnpm test && pnpm exec tsc --noEmit && grep -rniI "rncp" app components lib --exclude=*.test.ts`
Expected: tests PASS, grep vide.

```bash
pnpm exec biome check --write lib scripts package.json
git add -A lib scripts package.json
git commit -m "feat(about): retrait des mentions RNCP ; script d'étiquetage des parcours"
```

---

### Task 8: Livraison

Exécutée par l'orchestrateur (pas par un sous-agent), dans l'ordre :

- [ ] **Step 1:** Vérifications complètes : `pnpm test`, `pnpm exec biome check .`, `pnpm lint`,
  `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm audit --prod` (aucune critique). Démarrer `AUTH_TRUST_HOST=true
  PORT=3123 pnpm start`, mesurer `curl -s localhost:3123/ | gzip -9 | wc -c` (≤ 14 600), puis arrêter le wrapper
  **et** le `next-server` et vérifier que le port est libre.
- [ ] **Step 2:** Revue finale de la branche (sous-agent, modèle le plus capable), puis correctifs.
- [ ] **Step 3:** Pousser, ouvrir la PR (corps terminé par la ligne d'attribution Claude Code), attendre la CI
  (Aikido, Lint, Vercel) verte.
- [ ] **Step 4:** Prod, opérations additives : `pnpm exec prisma db push` (nouveaux enums, table, colonne nullable),
  puis `pnpm catalogue:training` (essai à blanc relu) et `pnpm catalogue:training --apply`.
- [ ] **Step 5:** Merge squash, vérifier le déploiement Vercel, contrôler en prod (Playwright, captures uniquement
  sous `/home/will/infra` puis supprimées) : badges présents sur les projets phares de formation, filtres
  Formation et Pratiques fonctionnels, page À propos sans RNCP.
- [ ] **Step 6:** Dire à Will de lancer « Analyser tout » dans `/admin/github` et d'accepter les écarts
  « Pratiques », puis de cocher à la main Durcissement / Registre de modèles / Gestion des secrets là où c'est vrai.
  Mettre à jour la mémoire, retirer le worktree et la branche.
