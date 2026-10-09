# Portfolio V2 — L3 « Reste de l'accueil » Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sous la Fig. 1, faire lire l'accueil comme un carnet : « Dernières entrées » (articles), « Registre des projets » (projets phares en grandes cartes avec figures réelles, puis index compact avec filtres repliés), « Instruments » (quatre lignes compactes) ; retirer le bloc compétences et ses cubes animés ; solder les reports de L2 qui pèsent sur les performances et la recherche.

**Architecture:** Toute la logique de sélection et de figures est pure et testée (`lib/register.ts`, `lib/instruments.ts`, ajouts à `lib/articles/loader.ts`). Les articles et les instruments sont des composants serveur. Le registre des projets reste alimenté à l'exécution par l'action serveur existante `getProjects` via `useProjects` (comme aujourd'hui : le build ne lit pas la base) ; il reçoit du serveur les données de la carte (positions, voisins) calculées depuis `content/map.json`.

**Tech Stack:** Next.js 16.1.4 (App Router, Turbopack), React 19.2, Tailwind CSS v4, zod 4, Vitest 4 (environnement `node`, composants testés par `renderToStaticMarkup`), Biome 2.3, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-07-portfolio-v2-carnet-de-labo-design.md` — §1, §4.3, §5, §6 (points 3 à 5), §8.1, §8.2 (champ `projects` du frontmatter), §9. L3 est la ligne « L3 » de la section 10.

**Base :** `main` à `6977169` (L0, L1, L2 mergées). Worktree : `/home/will/dev-project/portfolio-l3`, branche `feat/v2-l3-home`. `.env.local` y est copié (utile seulement à la tâche 2 pour `pnpm embeddings`).

**Constat de données (base, 2026-10-09) :** 26 projets ; **aucun** n'a `isML` ni `isIAG` ; aucune `imagePath` n'est une capture (valeurs : vide, `null`, `logo/*.svg`, `/icon/*.svg`). La règle par défaut des projets phares donnerait donc zéro carte : voir la règle de complément de la tâche 4.

## Global Constraints

- Aucune nouvelle dépendance npm. `framer-motion` n'entre pas sur l'accueil (L2 l'en a retiré) ; animations en CSS pur.
- Contenu complet au repos ; aucune `opacity:0` inline dans le HTML serveur ; `prefers-reduced-motion: reduce` = état final, aucun mouvement.
- Aucune modification du schéma ni du contenu de la base (catalogue) ; aucun accès à la base pendant le build (le registre reste chargé à l'exécution par `getProjects`).
- Uniquement des données réelles dans les figures (aucune courbe ou métrique inventée).
- Accessibilité : AA dans les deux thèmes, focus visible, hiérarchie de titres sans saut sur l'accueil (h1 → h2 → h3), figures décrites (`role="img"` + `aria-label`, ou `aria-hidden` doublé d'un texte).
- Textes en français, accents et typographie française (« », espace avant `:`), dates en Fira Code.
- Ne pas toucher à l'espace d'administration, sauf l'ajout du `<ThemedToaster />` (tâche 1).
- Projets privés : jamais en projets phares ; dans l'index, affichés sans lien GitHub avec la mention « privé ».
- Chaque commit : `pnpm exec biome check --write` puis tests verts ; message au style du dépôt, terminé par `Co-Authored-By: <le modèle qui a réellement écrit le commit> <noreply@anthropic.com>`.

## Review Focus

1. **Catalogue sans projet marqué ML/IAG** (situation réelle) → quatre projets phares quand même (complément par les plus récents), jamais une section vide (tâche 4, test « complète jusqu'au minimum »).
2. **Filtre actif dans l'index** → l'index montre toutes les correspondances, y compris celles déjà en projets phares ; sans filtre, l'index exclut les projets phares (tâche 4, tests `splitRegister`).
3. **Projet absent de la carte** (privé, ou ajouté après la dernière génération de `map.json`) → la carte de projet phare tombe sur la seule barre de composition, sans planter (tâche 5, test « sans point sur la carte »).
4. **Erreur ou lenteur de l'action serveur** → squelette pendant le chargement, message d'erreur lisible, le reste de l'accueil intact (tâche 6, tests SSR de l'état de chargement et d'erreur via les composants purs).
5. **Moins de trois articles** (un seul aujourd'hui) → « Dernières entrées » affiche ce qui existe, sans trou ni texte « undefined » ; zéro article → section omise (tâche 3 et 7).

---

### Task 1: Reports de L2 — sonner hors du layout racine, carte bornée, utilitaires

**Files:**
- Modify: `app/layout.tsx` (retirer `<ThemedToaster />` et son import)
- Modify: `app/Contact/page.tsx`, `app/(admin)/admin/layout.tsx` (monter `<ThemedToaster />`)
- Modify: `lib/carnet/map-view.ts` (exporter `isExternalHref`, borner l'indice de groupe)
- Modify: `components/carnet/MapSvg.tsx`, `components/carnet/MapItemList.tsx`, `components/carnet/CarnetExplorer.tsx` (utiliser `isExternalHref`, borne basse du plafond de la carte)
- Test: `app/toaster.test.ts` (créer), `lib/carnet/map-view.test.ts`

**Interfaces:**
- Produces: `isExternalHref(href: string): boolean` dans `lib/carnet/map-view.ts` (les tâches 5 et 6 l'utilisent).

- [ ] **Step 1: Tests qui échouent**

`app/toaster.test.ts` :

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) =>
	readFileSync(path.join(process.cwd(), file), "utf8");

describe("ThemedToaster", () => {
	it("n'est plus chargé par toutes les pages (layout racine)", () => {
		expect(read("app/layout.tsx")).not.toContain("ThemedToaster");
	});

	it("est monté là où des toasts sont émis", () => {
		expect(read("app/Contact/page.tsx")).toContain("<ThemedToaster />");
		expect(read("app/(admin)/admin/layout.tsx")).toContain("<ThemedToaster />");
	});
});
```

Ajouter à `lib/carnet/map-view.test.ts` :

```ts
describe("isExternalHref", () => {
	it("distingue un dépôt GitHub d'une page du site", () => {
		expect(isExternalHref("https://github.com/x/y")).toBe(true);
		expect(isExternalHref("/articles/a")).toBe(false);
	});
});

describe("toMapView (groupes au-delà de 5)", () => {
	it("reboucle l'indice de teinte sur 1…5", () => {
		const many: MapData = {
			...map,
			clusters: Array.from({ length: 7 }, (_, i) => ({ id: `c${i + 1}`, label: `g${i + 1}` })),
			items: [{ ...map.items[0], cluster: "c7" }],
		};
		expect(toMapView(many, {}).points[0].cluster).toBe(2);
	});
});
```

(Importer `isExternalHref` dans l'en-tête du fichier de test ; `map` est la fixture existante du fichier.)

- [ ] **Step 2: Vérifier l'échec** — Run: `pnpm test app/toaster.test.ts lib/carnet/map-view.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implémenter**

`app/layout.tsx` : supprimer `import ThemedToaster …` et la ligne `<ThemedToaster />`.

`app/Contact/page.tsx` : `import ThemedToaster from "@/components/theme/ThemedToaster";` (même forme d'import que l'ancien layout) et rendre `<ThemedToaster />` comme dernier enfant de l'élément racine retourné par la page. `app/(admin)/admin/layout.tsx` : idem, dernier enfant de l'élément racine du layout.

`lib/carnet/map-view.ts` :

```ts
export function isExternalHref(href: string): boolean {
	return href.startsWith("http");
}
```

et, dans `toMapView`, `cluster: (((index.get(item.cluster) ?? 1) - 1) % 5) + 1` (les teintes CSS n'existent que de `--cluster-1` à `--cluster-5`) ; l'`index` des groupes de la légende reboucle de la même façon : `index: (i % 5) + 1`. Mettre à jour le test existant de `toMapView` seulement s'il dépend de l'ancien comportement (il ne devrait pas : 2 groupes).

`MapSvg.tsx`, `MapItemList.tsx`, `CarnetExplorer.tsx` : supprimer la constante locale `isExternal` et importer `isExternalHref` depuis `@/lib/carnet/map-view`.

`CarnetExplorer.tsx` : le plafond `lg:max-w-[min(560px,calc(100svh-20rem))]` devient `lg:max-w-[clamp(16rem,calc(100svh-20rem),560px)]` (borne basse pour les écrans larges très peu hauts).

- [ ] **Step 4: Vérifier** — Run: `pnpm test`, `pnpm exec biome check --write`, `pnpm lint`, `pnpm build` — Expected: PASS ; le build liste toujours `/` en `○`.

- [ ] **Step 5: Commit**

```bash
git add app lib/carnet components/carnet
git commit -m "perf(layout): sonner chargé seulement où il sert ; carte bornée, utilitaires partagés"
```

---

### Task 2: Qualité du repli par mots-clés (reports de L2)

**Files:**
- Modify: `lib/carnet/terms.ts` (mots vides), `lib/carnet/terms.test.ts`
- Modify: `lib/carnet/search.ts` (mots-clés tokenisés), `lib/carnet/search.test.ts`
- Regenerate: `content/map.json` (`pnpm embeddings`)

**Interfaces:**
- Consumes: `tokenize` (`lib/carnet/tokenize.ts`, inchangé).

- [ ] **Step 1: Tests qui échouent**

Ajouter à `lib/carnet/terms.test.ts` :

```ts
	it("écarte les mots trop génériques pour départager des projets", () => {
		expect(
			extractTerms(
				"Outil de projet",
				"Une application simple qui permet, en utilisant un modèle complet, de faire aussi des cartes",
			),
		).toEqual(["modele", "faire", "cartes"]);
	});
```

Ajouter à `lib/carnet/search.test.ts` (dans `describe("keywordMatches")`) :

```ts
	it("reconnaît un mot-clé ponctué comme expression entière", () => {
		const punctuated: SearchItem[] = [
			{ id: "n", title: "N", keywords: ["next.js", "text-to-sql"], terms: [] },
		];
		expect(keywordMatches("text to sql", punctuated)).toEqual([{ id: "n", score: 2 }]);
		expect(keywordMatches("Next.js", punctuated)).toEqual([{ id: "n", score: 2 }]);
	});
```

- [ ] **Step 2: Vérifier l'échec** — Run: `pnpm test lib/carnet/terms.test.ts lib/carnet/search.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implémenter**

`lib/carnet/terms.ts` : ajouter à `STOPWORDS` (formes déjà pliées) : `"outil", "outils", "projet", "projets", "project", "projects", "application", "simple", "permet", "permettant", "utilisant", "utilise", "utiliser", "complet", "complete", "aussi", "dont", "sont", "cet", "etc", "afin", "peut", "tool", "purpose", "use", "uses"`. Ne retirer aucun mot existant.

Note : « faire » et « cartes » restent (ce sont des mots utiles au sens de la liste ; l'attendu du test les garde). Si l'attendu diffère uniquement parce qu'un autre mot du texte est déjà un mot vide de la liste existante, ajuster l'attendu et le signaler ; ne jamais modifier `tokenize`.

`lib/carnet/search.ts`, dans `keywordMatches` : remplacer `const kw = foldText(keyword).trim();` par `const kw = tokenize(keyword).join(" ");` (retirer l'import `foldText` s'il devient inutilisé). Le reste de la fonction est inchangé.

- [ ] **Step 4: Régénérer la carte** — Run: `pnpm embeddings`. Vérifier avec `git diff --stat content/map.json` puis `git diff content/map.json | grep -E '^[-+]\s+"(x|y|cluster)"' | head` (sortie vide attendue : seuls `terms` et `generatedAt` changent). Si des coordonnées ou groupes changent, garder la carte régénérée et le signaler (DONE_WITH_CONCERNS) avec l'appartenance des groupes.

- [ ] **Step 5: Vérifier** — Run: `pnpm test`, biome, lint — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/carnet content/map.json
git commit -m "fix(carnet): mots vides élargis et mots-clés ponctués dans le repli de recherche"
```

---

### Task 3: Articles — champ `projects`, dernières entrées, entrée par projet

**Files:**
- Modify: `lib/articles/loader.ts`, `lib/articles/loader.test.ts`

**Interfaces:**
- Produces:
  - `ArticleFrontmatter.projects?: number[]` (entiers positifs ; absent si non renseigné)
  - `latestArticles(n: number, dir?: string): ArticleMeta[]` — triés par `date` décroissante, au plus `n`
  - `projectEntries(articles: ArticleMeta[]): Record<number, { slug: string; title: string }>` — pour chaque identifiant de projet, l'article **le plus récent** qui le cite

- [ ] **Step 1: Tests qui échouent**

Ajouter à `lib/articles/loader.test.ts` (adapter les noms de fabriques au fichier existant ; `parseFrontmatter(data, file)` est déjà exporté) :

```ts
describe("frontmatter projects", () => {
	const base = { title: "T", description: "D", date: "2026-10-01", tags: [] };

	it("accepte une liste d'identifiants de projets", () => {
		expect(parseFrontmatter({ ...base, projects: [3, 12] }, "a.mdx").projects).toEqual([3, 12]);
	});

	it("reste absent quand il n'est pas renseigné", () => {
		expect(parseFrontmatter(base, "a.mdx").projects).toBeUndefined();
	});

	it("refuse un identifiant qui n'est pas un entier positif", () => {
		expect(() => parseFrontmatter({ ...base, projects: [0] }, "a.mdx")).toThrow("projects");
		expect(() => parseFrontmatter({ ...base, projects: ["x"] }, "a.mdx")).toThrow("projects");
	});
});

describe("projectEntries", () => {
	it("associe chaque projet à l'article le plus récent qui le cite", () => {
		const meta = (slug: string, date: string, projects?: number[]) => ({
			slug, title: slug.toUpperCase(), description: "", date, tags: [], readingTimeMinutes: 1, projects,
		});
		expect(
			projectEntries([meta("old", "2026-01-01", [3]), meta("new", "2026-06-01", [3, 7]), meta("none", "2026-07-01")]),
		).toEqual({ 3: { slug: "new", title: "NEW" }, 7: { slug: "new", title: "NEW" } });
	});
});

describe("latestArticles", () => {
	it("renvoie au plus n articles, du plus récent au plus ancien", () => {
		const all = latestArticles(10);
		expect(all.length).toBeGreaterThan(0);
		const dates = all.map((a) => a.date);
		expect([...dates].sort().reverse()).toEqual(dates);
		expect(latestArticles(0)).toEqual([]);
	});
});
```

- [ ] **Step 2: Vérifier l'échec** — Run: `pnpm test lib/articles/loader.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implémenter**

Dans `lib/articles/loader.ts` :
- `ArticleFrontmatter` reçoit `projects?: number[];`.
- Dans `parseFrontmatter`, après `status` :

```ts
		projects: optionalProjectIds(data.projects, file),
```

avec, à côté des autres aides :

```ts
function optionalProjectIds(value: unknown, file: string): number[] | undefined {
	if (value === undefined) return undefined;
	if (
		!Array.isArray(value) ||
		!value.every((v) => Number.isInteger(v) && (v as number) > 0)
	) {
		throw new Error(`${file} : "projects" doit être une liste d'entiers positifs`);
	}
	return value as number[];
}
```

(Si l'objet retourné par `parseFrontmatter` est construit littéralement, ne pas émettre la clé quand la valeur est `undefined` si un test existant compare l'objet entier avec `toEqual` — `toEqual` ignore les clés `undefined`, donc la forme ci-dessus convient.)
- Ajouter :

```ts
export function latestArticles(n: number, dir = ARTICLES_DIR): ArticleMeta[] {
	return [...getAllArticles(dir)]
		.sort((a, b) => b.date.localeCompare(a.date))
		.slice(0, Math.max(0, n));
}

export function projectEntries(
	articles: ArticleMeta[],
): Record<number, { slug: string; title: string }> {
	const out: Record<number, { slug: string; title: string }> = {};
	const byDate = [...articles].sort((a, b) => b.date.localeCompare(a.date));
	for (const article of byDate)
		for (const id of article.projects ?? [])
			out[id] ??= { slug: article.slug, title: article.title };
	return out;
}
```

- [ ] **Step 4: Vérifier** — Run: `pnpm test`, biome, lint — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/articles
git commit -m "feat(articles): champ projects, dernières entrées et entrée du carnet par projet"
```

---

### Task 4: Logique du registre (phares, index, figures) — pure

**Files:**
- Create: `lib/register.ts`, `lib/register.test.ts`, `lib/featured.ts`

**Interfaces:**
- Consumes: `NormalizedProject` (`lib/projects-data.ts`) ; `MapData` (`lib/carnet/map-types.ts`) ; `cosine` (`lib/carnet/static-model.ts`).
- Produces:
  - `lib/featured.ts` : `export const featuredProjectIds: number[] = [];`
  - `FEATURED_MIN = 4`, `FEATURED_MAX = 6`
  - `selectFeatured(projects: NormalizedProject[], explicitIds: number[]): NormalizedProject[]`
  - `splitIndex(all: NormalizedProject[], filtered: NormalizedProject[], featured: NormalizedProject[], filtersActive: boolean): NormalizedProject[]`
  - `interface TechShare { key: "languages" | "databases" | "backends" | "frontends" | "devops"; label: string; count: number; share: number }`
  - `techComposition(p: NormalizedProject): TechShare[]` (catégories non vides, ordre fixe, parts sommant à 1)
  - `techNames(p: NormalizedProject): string[]` (toutes les technologies, ordre langages → bases → back → front → DevOps)
  - `isCapture(imagePath: string | null): boolean`
  - `mapNeighbors(map: MapData, k?: number): Record<string, string[]>` — pour chaque élément `project:*` de la carte, les identifiants des `k` (défaut 3) éléments les plus proches (cosinus des vecteurs stockés), lui-même exclu
  - `projectYear(p: NormalizedProject): string` (`"2026"`, ou `"—"` sans date)

- [ ] **Step 1: Tests qui échouent**

`lib/register.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import type { MapData } from "@/lib/carnet/map-types";
import type { NormalizedProject } from "@/lib/projects-data";
import {
	isCapture,
	mapNeighbors,
	projectYear,
	selectFeatured,
	splitIndex,
	techComposition,
	techNames,
} from "./register";

const project = (id: number, over: Partial<NormalizedProject> = {}): NormalizedProject => ({
	id,
	title: `P${id}`,
	description: "",
	imagePath: null,
	github: `https://github.com/x/p${id}`,
	lastUpdate: new Date(`2026-0${(id % 9) + 1}-01T00:00:00Z`),
	isPrivate: false,
	isAiGenerated: false,
	isML: false,
	isIAG: false,
	createdAt: new Date(0),
	updatedAt: new Date(0),
	languages: [],
	databases: [],
	backends: [],
	frontends: [],
	devops: [],
	...over,
});

describe("selectFeatured", () => {
	it("prend les projets ML/IAG publics, du plus récent au plus ancien, 6 au plus", () => {
		const ps = [1, 2, 3, 4, 5, 6, 7, 8].map((id) => project(id, { isML: true }));
		const out = selectFeatured(ps, []);
		expect(out.map((p) => p.id)).toEqual([8, 7, 6, 5, 4, 3]);
	});

	it("complète jusqu'au minimum avec les projets publics les plus récents", () => {
		const ps = [project(1, { isIAG: true }), project(2), project(3), project(4), project(5)];
		expect(selectFeatured(ps, []).map((p) => p.id)).toEqual([1, 5, 4, 3]);
	});

	it("n'inclut jamais un projet privé", () => {
		const ps = [project(1, { isML: true, isPrivate: true }), project(2), project(3), project(4), project(5)];
		expect(selectFeatured(ps, []).map((p) => p.id)).not.toContain(1);
	});

	it("suit la liste explicite quand elle est renseignée, dans son ordre", () => {
		const ps = [1, 2, 3, 4, 5].map((id) => project(id));
		expect(selectFeatured(ps, [3, 99, 1]).map((p) => p.id)).toEqual([3, 1]);
	});
});

describe("splitIndex", () => {
	const all = [1, 2, 3, 4].map((id) => project(id));
	const featured = [all[0], all[1]];

	it("sans filtre, l'index exclut les projets phares", () => {
		expect(splitIndex(all, all, featured, false).map((p) => p.id)).toEqual([3, 4]);
	});

	it("avec un filtre, l'index montre toutes les correspondances", () => {
		expect(splitIndex(all, [all[0], all[2]], featured, true).map((p) => p.id)).toEqual([1, 3]);
	});
});

describe("techComposition", () => {
	it("donne la part de chaque catégorie non vide, dans l'ordre fixe", () => {
		const p = project(1, {
			languages: [{ language: "Python" }, { language: "TypeScript" }],
			backends: [{ backend: "FastAPI" }],
			devops: [{ devops: "Docker" }],
		});
		expect(techComposition(p)).toEqual([
			{ key: "languages", label: "Langages", count: 2, share: 0.5 },
			{ key: "backends", label: "Back-end", count: 1, share: 0.25 },
			{ key: "devops", label: "DevOps", count: 1, share: 0.25 },
		]);
	});

	it("est vide pour un projet sans technologie", () => {
		expect(techComposition(project(1))).toEqual([]);
	});
});

describe("techNames", () => {
	it("liste les technologies dans l'ordre des catégories", () => {
		const p = project(1, { devops: [{ devops: "Docker" }], languages: [{ language: "Rust" }] });
		expect(techNames(p)).toEqual(["Rust", "Docker"]);
	});
});

describe("isCapture", () => {
	it("ne reconnaît que des images matricielles, jamais un logo SVG ni l'image GitHub", () => {
		expect(isCapture("/captures/syntheo.webp")).toBe(true);
		expect(isCapture("https://example.com/shot.PNG")).toBe(true);
		expect(isCapture("logo/ML.svg")).toBe(false);
		expect(isCapture("https://opengraph.githubassets.com/1/x/y.png")).toBe(false);
		expect(isCapture("")).toBe(false);
		expect(isCapture(null)).toBe(false);
	});
});

describe("mapNeighbors", () => {
	const map: MapData = {
		model: "m",
		generatedAt: "2026-10-09T00:00:00Z",
		clusters: [{ id: "c1", label: "g" }],
		items: [
			{ id: "project:1", kind: "project", title: "A", href: "h", x: 0, y: 0, cluster: "c1", keywords: [], terms: [], vector: [1, 0] },
			{ id: "project:2", kind: "project", title: "B", href: "h", x: 0, y: 0, cluster: "c1", keywords: [], terms: [], vector: [0.9, 0.1] },
			{ id: "article:a", kind: "article", title: "C", href: "h", x: 0, y: 0, cluster: "c1", keywords: [], terms: [], vector: [0, 1] },
		],
	};

	it("donne les k plus proches de chaque projet, lui-même exclu", () => {
		const n = mapNeighbors(map, 1);
		expect(n["project:1"]).toEqual(["project:2"]);
		expect(n["project:2"]).toEqual(["project:1"]);
		expect(n["article:a"]).toBeUndefined();
	});
});

describe("projectYear", () => {
	it("donne l'année de dernière mise à jour", () => {
		expect(projectYear(project(1, { lastUpdate: new Date("2025-03-02T00:00:00Z") }))).toBe("2025");
		expect(projectYear(project(1, { lastUpdate: null }))).toBe("—");
	});
});
```

- [ ] **Step 2: Vérifier l'échec** — Run: `pnpm test lib/register.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implémenter**

`lib/featured.ts` :

```ts
/**
 * Projets phares de l'accueil (identifiants en base), dans l'ordre d'affichage.
 * Vide : règle par défaut (projets ML/IAG publics les plus récents, complétés
 * jusqu'à 4 par les projets publics les plus récents). Voir lib/register.ts.
 */
export const featuredProjectIds: number[] = [];
```

`lib/register.ts` :

```ts
import { cosine } from "@/lib/carnet/static-model";
import type { MapData } from "@/lib/carnet/map-types";
import type { NormalizedProject } from "@/lib/projects-data";

export const FEATURED_MIN = 4;
export const FEATURED_MAX = 6;

const byRecent = (a: NormalizedProject, b: NormalizedProject) =>
	(b.lastUpdate?.getTime() ?? 0) - (a.lastUpdate?.getTime() ?? 0) || a.id - b.id;

/** Spec §6.4 : ML/IAG publics du plus récent au plus ancien ; liste explicite prioritaire. */
export function selectFeatured(
	projects: NormalizedProject[],
	explicitIds: number[],
): NormalizedProject[] {
	const visible = projects.filter((p) => !p.isPrivate);
	if (explicitIds.length > 0) {
		const byId = new Map(visible.map((p) => [p.id, p]));
		return explicitIds
			.map((id) => byId.get(id))
			.filter((p): p is NormalizedProject => p !== undefined)
			.slice(0, FEATURED_MAX);
	}
	const sorted = [...visible].sort(byRecent);
	const flagged = sorted.filter((p) => p.isML || p.isIAG);
	const fill = sorted.filter((p) => !(p.isML || p.isIAG));
	const picked = [...flagged, ...fill.slice(0, Math.max(0, FEATURED_MIN - flagged.length))];
	return picked.slice(0, FEATURED_MAX);
}

export function splitIndex(
	all: NormalizedProject[],
	filtered: NormalizedProject[],
	featured: NormalizedProject[],
	filtersActive: boolean,
): NormalizedProject[] {
	if (filtersActive) return filtered;
	const ids = new Set(featured.map((p) => p.id));
	return all.filter((p) => !ids.has(p.id));
}

export interface TechShare {
	key: "languages" | "databases" | "backends" | "frontends" | "devops";
	label: string;
	count: number;
	share: number;
}

const CATEGORIES: { key: TechShare["key"]; label: string; names: (p: NormalizedProject) => string[] }[] = [
	{ key: "languages", label: "Langages", names: (p) => p.languages.map((l) => l.language) },
	{ key: "databases", label: "Bases de données", names: (p) => p.databases.map((d) => d.database) },
	{ key: "backends", label: "Back-end", names: (p) => p.backends.map((b) => b.backend) },
	{ key: "frontends", label: "Front-end", names: (p) => p.frontends.map((f) => f.frontend) },
	{ key: "devops", label: "DevOps", names: (p) => p.devops.map((d) => d.devops) },
];

export function techComposition(p: NormalizedProject): TechShare[] {
	const counts = CATEGORIES.map((c) => ({ key: c.key, label: c.label, count: c.names(p).length }));
	const total = counts.reduce((s, c) => s + c.count, 0);
	if (total === 0) return [];
	return counts.filter((c) => c.count > 0).map((c) => ({ ...c, share: c.count / total }));
}

export function techNames(p: NormalizedProject): string[] {
	return CATEGORIES.flatMap((c) => c.names(p));
}

/** Une vraie capture d'écran : image matricielle hors images GitHub par défaut (spec §8.1). */
export function isCapture(imagePath: string | null): boolean {
	if (!imagePath) return false;
	if (/github/i.test(imagePath)) return false;
	return /\.(png|jpe?g|webp|avif)$/i.test(imagePath);
}

export function mapNeighbors(map: MapData, k = 3): Record<string, string[]> {
	const out: Record<string, string[]> = {};
	for (const item of map.items) {
		if (item.kind !== "project") continue;
		out[item.id] = map.items
			.filter((other) => other.id !== item.id)
			.map((other) => ({ id: other.id, score: cosine(item.vector, other.vector) }))
			.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
			.slice(0, k)
			.map((s) => s.id);
	}
	return out;
}

export function projectYear(p: NormalizedProject): string {
	return p.lastUpdate ? String(p.lastUpdate.getUTCFullYear()) : "—";
}
```

Note : `lastUpdate` peut arriver sérialisé en chaîne depuis l'action serveur côté client ; `selectFeatured`, `byRecent` et `projectYear` doivent donc accepter `Date | string | null`. Normaliser une seule fois : ajouter `const time = (d: Date | string | null) => (d ? new Date(d).getTime() : 0);` et l'utiliser dans `byRecent` ; dans `projectYear`, `p.lastUpdate ? String(new Date(p.lastUpdate).getUTCFullYear()) : "—"`. Ajouter un test : `projectYear(project(1, { lastUpdate: "2024-05-01T00:00:00.000Z" as unknown as Date }))` vaut `"2024"`.

- [ ] **Step 4: Vérifier** — Run: `pnpm test`, biome, lint — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/register.ts lib/register.test.ts lib/featured.ts
git commit -m "feat(registre): sélection des projets phares, index et données des figures"
```

---

### Task 5: Figures et cartes de projets (composants purs)

**Files:**
- Create: `components/register/MiniMap.tsx`, `components/register/TechBar.tsx`, `components/register/FeaturedCard.tsx`, `components/register/IndexRow.tsx`, `components/register/register.test.tsx`
- Modify: `app/globals.css` (classe `.register-ink` facultative : non ; aucune nouvelle animation)

**Interfaces:**
- Consumes: `MapPoint`, `toPercent`, `isExternalHref` (`lib/carnet/map-view.ts`) ; `TechShare`, `techComposition`, `techNames`, `isCapture`, `projectYear` (tâche 4) ; `FigureCaption` (`components/notebook/FigureCaption.tsx`) ; `formatPercentFr` (`lib/articles/format.ts`) ; `NormalizedProject`.
- Produces:
  - `<MiniMap points focusId neighborIds />` — SVG `aria-hidden`, le projet à l'accent, ses voisins cerclés, le reste estompé
  - `<TechBar shares />` — barre empilée `role="img"` + `aria-label` complet, légende en Fira Code avec pourcentages
  - `<FeaturedCard project figureNumber points neighborIds entry />` — `entry?: { slug: string; title: string }`
  - `<IndexRow project />` — une ligne compacte `<li>`

- [ ] **Step 1: Tests qui échouent**

`components/register/register.test.tsx` :

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { MapPoint } from "@/lib/carnet/map-view";
import type { NormalizedProject } from "@/lib/projects-data";
import FeaturedCard from "./FeaturedCard";
import IndexRow from "./IndexRow";
import MiniMap from "./MiniMap";
import TechBar from "./TechBar";

const p = (over: Partial<NormalizedProject> = {}): NormalizedProject => ({
	id: 7,
	title: "P13-Fashion-Insta",
	description: "Segmentation de vêtements. Deuxième phrase.",
	imagePath: "logo/ML.svg",
	github: "https://github.com/x/p13",
	lastUpdate: new Date("2025-06-01T00:00:00Z"),
	isPrivate: false,
	isAiGenerated: false,
	isML: false,
	isIAG: false,
	createdAt: new Date(0),
	updatedAt: new Date(0),
	languages: [{ language: "Python" }],
	databases: [],
	backends: [{ backend: "FastAPI" }],
	frontends: [],
	devops: [{ devops: "Docker" }],
	...over,
});
const points: MapPoint[] = [
	{ id: "project:7", kind: "project", title: "P13", href: "h", x: 0.5, y: 0.5, cluster: 4 },
	{ id: "project:8", kind: "project", title: "P8", href: "h", x: 0.6, y: 0.5, cluster: 4 },
	{ id: "article:a", kind: "article", title: "A", href: "/articles/a", x: 0.1, y: 0.1, cluster: 1 },
];

describe("MiniMap", () => {
	it("met le projet à l'accent et cercle ses voisins, sans être annoncée", () => {
		const html = renderToStaticMarkup(<MiniMap points={points} focusId="project:7" neighborIds={["project:8"]} />);
		expect(html).toContain('aria-hidden="true"');
		expect(html.match(/data-role="focus"/g)?.length).toBe(1);
		expect(html.match(/data-role="neighbor"/g)?.length).toBe(1);
		expect(html.match(/data-role="other"/g)?.length).toBe(1);
	});
});

describe("TechBar", () => {
	it("décrit la composition en texte et la dessine en segments proportionnels", () => {
		const html = renderToStaticMarkup(
			<TechBar shares={[
				{ key: "languages", label: "Langages", count: 1, share: 0.5 },
				{ key: "devops", label: "DevOps", count: 1, share: 0.5 },
			]} />,
		);
		expect(html).toContain('role="img"');
		expect(html).toContain('aria-label="Composition technique : Langages 50 %, DevOps 50 %"');
		expect(html).toContain("width:50%");
	});

	it("ne rend rien sans technologie", () => {
		expect(renderToStaticMarkup(<TechBar shares={[]} />)).toBe("");
	});
});

describe("FeaturedCard", () => {
	it("montre une figure numérotée, la première phrase, les technologies et le dépôt", () => {
		const html = renderToStaticMarkup(
			<FeaturedCard project={p()} figureNumber={2} points={points} neighborIds={["project:8"]} />,
		);
		expect(html).toContain("<h3");
		expect(html).toContain("P13-Fashion-Insta");
		expect(html).toContain("Segmentation de vêtements.");
		expect(html).not.toContain("Deuxième phrase");
		expect(html).toContain("Fig. 2 · ");
		expect(html).toContain("Python");
		expect(html).toContain('href="https://github.com/x/p13"');
		expect(html).toContain('rel="noopener noreferrer"');
		expect(html).not.toContain("Lire l'entrée du carnet");
	});

	it("renvoie à l'entrée du carnet qui cite le projet", () => {
		const html = renderToStaticMarkup(
			<FeaturedCard project={p()} figureNumber={2} points={points} neighborIds={[]} entry={{ slug: "a", title: "A" }} />,
		);
		expect(html).toContain('href="/articles/a"');
		expect(html).toContain("Lire l&#x27;entrée du carnet");
	});

	it("préfère une vraie capture à la mini-carte", () => {
		const html = renderToStaticMarkup(
			<FeaturedCard project={p({ imagePath: "/captures/p13.webp" })} figureNumber={2} points={points} neighborIds={[]} />,
		);
		expect(html).toContain("p13.webp");
		expect(html).not.toContain('data-role="focus"');
	});

	it("sans point sur la carte, garde la seule barre de composition", () => {
		const html = renderToStaticMarkup(
			<FeaturedCard project={p({ id: 99 })} figureNumber={3} points={points} neighborIds={[]} />,
		);
		expect(html).not.toContain('data-role="focus"');
		expect(html).toContain("Composition technique");
	});
});

describe("IndexRow", () => {
	it("tient sur une ligne : nom, description, technologies, année", () => {
		const html = renderToStaticMarkup(<ul><IndexRow project={p()} /></ul>);
		expect(html).toContain("<li");
		expect(html).toContain("P13-Fashion-Insta");
		expect(html).toContain("2025");
		expect(html).toContain("line-clamp-1");
		expect(html).toContain("Python");
	});

	it("affiche un projet privé sans lien, avec la mention privé", () => {
		const html = renderToStaticMarkup(<ul><IndexRow project={p({ isPrivate: true, github: null })} /></ul>);
		expect(html).not.toContain("<a ");
		expect(html).toContain("privé");
	});
});
```

(Si React échappe l'apostrophe autrement que `&#x27;`, ajuster l'attendu à la forme réellement produite.)

- [ ] **Step 2: Vérifier l'échec** — Run: `pnpm test components/register` — Expected: FAIL.

- [ ] **Step 3: Implémenter**

`components/register/MiniMap.tsx` :

```tsx
import { type MapPoint, toPercent } from "@/lib/carnet/map-view";

/** Fig. 1 en réduction : le projet parmi ses voisins (spec §8.1). Décorative, doublée par la légende. */
export default function MiniMap({
	points,
	focusId,
	neighborIds,
}: Readonly<{ points: MapPoint[]; focusId: string; neighborIds: string[] }>) {
	const neighbors = new Set(neighborIds);
	return (
		<svg viewBox="0 0 100 100" aria-hidden="true" className="h-full w-full text-ink-soft">
			<path d="M4 96 H98 M4 96 V2" stroke="currentColor" strokeWidth={0.4} fill="none" />
			{points.map((pt) => {
				const role = pt.id === focusId ? "focus" : neighbors.has(pt.id) ? "neighbor" : "other";
				return (
					<circle
						key={pt.id}
						data-role={role}
						cx={toPercent(pt.x)}
						cy={toPercent(pt.y)}
						r={role === "focus" ? 3.2 : 2}
						fill={role === "focus" ? "var(--primary)" : `var(--cluster-${pt.cluster})`}
						fillOpacity={role === "other" ? 0.3 : 1}
						stroke={role === "neighbor" ? "var(--primary)" : "none"}
						strokeWidth={role === "neighbor" ? 0.8 : 0}
					/>
				);
			})}
		</svg>
	);
}
```

`components/register/TechBar.tsx` :

```tsx
import { formatPercentFr } from "@/lib/articles/format";
import type { TechShare } from "@/lib/register";

const TINT: Record<TechShare["key"], string> = {
	languages: "var(--cluster-1)",
	databases: "var(--cluster-2)",
	backends: "var(--cluster-3)",
	frontends: "var(--cluster-4)",
	devops: "var(--cluster-5)",
};

/** Barre de composition technique : proportions réelles des technologies en base. */
export default function TechBar({ shares }: Readonly<{ shares: TechShare[] }>) {
	if (shares.length === 0) return null;
	const pct = (s: TechShare) => formatPercentFr(s.count, shares.reduce((t, x) => t + x.count, 0));
	const label = `Composition technique : ${shares.map((s) => `${s.label} ${pct(s)}`).join(", ")}`;
	return (
		<div>
			<div role="img" aria-label={label} className="flex h-2 w-full overflow-hidden rounded-full bg-paper-grid">
				{shares.map((s) => (
					<span key={s.key} className="h-full" style={{ width: `${Math.round(s.share * 100)}%`, background: TINT[s.key] }} />
				))}
			</div>
			<ul aria-hidden="true" className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-ink-soft">
				{shares.map((s) => (
					<li key={s.key} className="flex items-center gap-1.5">
						<span className="inline-block size-2 rounded-full" style={{ background: TINT[s.key] }} />
						{s.label} {pct(s)}
					</li>
				))}
			</ul>
		</div>
	);
}
```

(`formatPercentFr` renvoie `"50 %"` avec une espace insécable étroite ou normale selon son implémentation : faire correspondre l'attendu du test `aria-label` au caractère réellement produit — lire `lib/articles/format.ts` — sans modifier `formatPercentFr`.)

`components/register/FeaturedCard.tsx` :

```tsx
import Image from "next/image";
import Link from "next/link";
import FigureCaption from "@/components/notebook/FigureCaption";
import { isExternalHref, type MapPoint } from "@/lib/carnet/map-view";
import type { NormalizedProject } from "@/lib/projects-data";
import { isCapture, techComposition, techNames } from "@/lib/register";
import MiniMap from "./MiniMap";
import TechBar from "./TechBar";

interface FeaturedCardProps {
	project: NormalizedProject;
	figureNumber: number;
	points: MapPoint[];
	neighborIds: string[];
	entry?: { slug: string; title: string };
}

const firstSentence = (text: string) => text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;

export default function FeaturedCard({ project, figureNumber, points, neighborIds, entry }: Readonly<FeaturedCardProps>) {
	const mapId = `project:${project.id}`;
	const onMap = points.some((pt) => pt.id === mapId);
	const capture = isCapture(project.imagePath) ? project.imagePath : null;
	const shares = techComposition(project);
	return (
		<article className="flex h-full flex-col rounded-md border border-border bg-background/70 p-5">
			<figure className="m-0">
				{capture ? (
					<div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-border">
						<Image src={capture} alt={`Capture de ${project.title}`} fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" />
					</div>
				) : onMap ? (
					<div className="mx-auto aspect-square w-40">
						<MiniMap points={points} focusId={mapId} neighborIds={neighborIds} />
					</div>
				) : null}
				<div className="mt-3">
					<TechBar shares={shares} />
				</div>
				<FigureCaption number={figureNumber}>
					{capture ? project.title : onMap ? `${project.title} parmi ses voisins` : `Composition de ${project.title}`}
				</FigureCaption>
			</figure>
			<h3 className="mt-4 font-display text-xl font-semibold">{project.title}</h3>
			<p className="mt-2 text-base leading-relaxed">{firstSentence(project.description)}</p>
			<p className="mt-3 font-mono text-[11px] text-ink-soft">{techNames(project).join(" · ")}</p>
			<div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-sm">
				{project.github && isExternalHref(project.github) ? (
					<a href={project.github} target="_blank" rel="noopener noreferrer" className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
						Dépôt GitHub
					</a>
				) : null}
				{entry ? (
					<Link href={`/articles/${entry.slug}`} className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
						Lire l'entrée du carnet
					</Link>
				) : null}
			</div>
		</article>
	);
}
```

`components/register/IndexRow.tsx` :

```tsx
import type { NormalizedProject } from "@/lib/projects-data";
import { projectYear, techNames } from "@/lib/register";

export default function IndexRow({ project }: Readonly<{ project: NormalizedProject }>) {
	const name = <span className="font-display font-semibold">{project.title}</span>;
	return (
		<li className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 border-b border-border/60 py-2.5 sm:grid-cols-[minmax(10rem,14rem)_1fr_auto]">
			<span>
				{project.github && !project.isPrivate ? (
					<a href={project.github} target="_blank" rel="noopener noreferrer" className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
						{name}
					</a>
				) : (
					<>
						{name} <span className="font-mono text-[11px] text-ink-soft">privé</span>
					</>
				)}
			</span>
			<span className="order-3 col-span-2 line-clamp-1 text-sm text-ink-soft sm:order-none sm:col-span-1">
				{project.description}
				<span className="ml-2 font-mono text-[11px]">{techNames(project).slice(0, 4).join(" · ")}</span>
			</span>
			<span className="font-mono text-xs text-ink-soft">{projectYear(project)}</span>
		</li>
	);
}
```

(Un `<a>` littéral « Dépôt GitHub » au lieu du `next/link` est volontaire : lien externe.)

- [ ] **Step 4: Vérifier** — Run: `pnpm test`, biome, lint — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/register
git commit -m "feat(registre): figures réelles des projets, cartes phares et lignes d'index"
```

---

### Task 6: Registre des projets (îlot client) et retrait de l'ancienne grille

**Files:**
- Create: `components/register/ProjectRegister.tsx`, `components/register/RegisterView.tsx`, `components/register/register-view.test.tsx`
- Delete: `components/ProjectGrid/` (dossier entier : `ProjectGrid.tsx`, `ProjectList.tsx`, `ProjectGridSkeleton.tsx`, `ProjectCard/`) **sauf** `FilterBar.tsx`, déplacé en `components/register/FilterBar.tsx` (contenu inchangé, imports relatifs ajustés)

**Interfaces:**
- Consumes: `useProjects(filters)` (`hooks/CustomHooks.tsx`) ; `ProjectFilters` (`@/schemas`) ; `selectFeatured`, `splitIndex` (tâche 4) ; `featuredProjectIds` (`lib/featured.ts`) ; `FeaturedCard`, `IndexRow` (tâche 5) ; `MapPoint`.
- Produces:
  - `RegisterView` (pur, sans hook) : props `{ status: "loading" | "error" | "ready"; error?: string; featured: NormalizedProject[]; index: NormalizedProject[]; filtersActive: boolean; filterBar: ReactNode; points: MapPoint[]; neighbors: Record<string, string[]>; entries: Record<number, { slug: string; title: string }> }`
  - `ProjectRegister` (client) : props `{ points; neighbors; entries }` ; lit les filtres de l'URL comme l'ancien `ProjectGrid` (même `parseFilters`), appelle `useProjects({})` et `useProjects(filters)`, calcule `selectFeatured(all, featuredProjectIds)` et `splitIndex(…)`, rend `RegisterView`. À envelopper dans `<Suspense>` par l'appelant (usage de `useSearchParams`).

- [ ] **Step 1: Tests qui échouent**

`components/register/register-view.test.tsx` :

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { NormalizedProject } from "@/lib/projects-data";
import RegisterView from "./RegisterView";

const p = (id: number): NormalizedProject => ({
	id, title: `Projet ${id}`, description: "Une phrase.", imagePath: null, github: `https://github.com/x/${id}`,
	lastUpdate: new Date("2026-01-01T00:00:00Z"), isPrivate: false, isAiGenerated: false, isML: false, isIAG: false,
	createdAt: new Date(0), updatedAt: new Date(0), languages: [{ language: "Python" }], databases: [], backends: [], frontends: [], devops: [],
});
const base = { featured: [], index: [], filtersActive: false, filterBar: <div>filtres</div>, points: [], neighbors: {}, entries: {} };

describe("RegisterView", () => {
	it("montre un squelette pendant le chargement", () => {
		const html = renderToStaticMarkup(<RegisterView {...base} status="loading" />);
		expect(html).toContain('aria-busy="true"');
		expect(html).toContain("Chargement du registre");
	});

	it("affiche une erreur lisible sans casser la page", () => {
		const html = renderToStaticMarkup(<RegisterView {...base} status="error" error="Trop de requêtes." />);
		expect(html).toContain('role="alert"');
		expect(html).toContain("Trop de requêtes.");
	});

	it("numérote les figures des projets phares à partir de 2 et liste l'index", () => {
		const html = renderToStaticMarkup(
			<RegisterView {...base} status="ready" featured={[p(1), p(2)]} index={[p(3)]} />,
		);
		expect(html).toContain("Projets phares");
		expect(html).toContain("Fig. 2 · ");
		expect(html).toContain("Fig. 3 · ");
		expect(html).toContain("Projet 3");
		expect(html.match(/<h3/g)?.length).toBeGreaterThanOrEqual(3);
	});

	it("replie les filtres par défaut et les ouvre quand un filtre est actif", () => {
		expect(renderToStaticMarkup(<RegisterView {...base} status="ready" />)).toMatch(/<details(?![^>]*open)/);
		expect(renderToStaticMarkup(<RegisterView {...base} status="ready" filtersActive />)).toMatch(/<details[^>]*open/);
	});

	it("dit quand l'index filtré est vide", () => {
		const html = renderToStaticMarkup(<RegisterView {...base} status="ready" filtersActive />);
		expect(html).toContain("Aucun projet ne correspond à ces filtres.");
	});
});
```

- [ ] **Step 2: Vérifier l'échec** — Run: `pnpm test components/register/register-view.test.tsx` — Expected: FAIL.

- [ ] **Step 3: Implémenter**

`components/register/RegisterView.tsx` :

```tsx
import type { ReactNode } from "react";
import type { MapPoint } from "@/lib/carnet/map-view";
import type { NormalizedProject } from "@/lib/projects-data";
import FeaturedCard from "./FeaturedCard";
import IndexRow from "./IndexRow";

interface RegisterViewProps {
	status: "loading" | "error" | "ready";
	error?: string;
	featured: NormalizedProject[];
	index: NormalizedProject[];
	filtersActive: boolean;
	filterBar: ReactNode;
	points: MapPoint[];
	neighbors: Record<string, string[]>;
	entries: Record<number, { slug: string; title: string }>;
}

export default function RegisterView(props: Readonly<RegisterViewProps>) {
	const { status, error, featured, index, filtersActive, filterBar, points, neighbors, entries } = props;
	if (status === "loading")
		return (
			<div aria-busy="true" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<p className="sr-only">Chargement du registre des projets…</p>
				{[0, 1, 2].map((i) => (
					<div key={i} className="h-72 rounded-md border border-border bg-paper-grid motion-safe:animate-pulse" />
				))}
			</div>
		);
	if (status === "error")
		return (
			<p role="alert" className="rounded-md border border-destructive/40 p-4 text-sm text-destructive">
				{error ?? "Le registre des projets n'a pas pu être chargé."}
			</p>
		);
	return (
		<div className="space-y-12">
			{featured.length > 0 ? (
				<div>
					<h3 className="font-display text-lg font-semibold">Projets phares</h3>
					<ul className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{featured.map((project, i) => (
							<li key={project.id}>
								<FeaturedCard
									project={project}
									figureNumber={i + 2}
									points={points}
									neighborIds={neighbors[`project:${project.id}`] ?? []}
									entry={entries[project.id]}
								/>
							</li>
						))}
					</ul>
				</div>
			) : null}
			<div>
				<h3 className="font-display text-lg font-semibold">Index</h3>
				<details open={filtersActive || undefined} className="mt-3">
					<summary className="cursor-pointer rounded-sm font-mono text-xs text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
						Filtrer le registre
					</summary>
					<div className="mt-3">{filterBar}</div>
				</details>
				{index.length > 0 ? (
					<ul className="mt-4">
						{index.map((project) => (
							<IndexRow key={project.id} project={project} />
						))}
					</ul>
				) : (
					<p className="mt-4 text-sm text-ink-soft">
						{filtersActive ? "Aucun projet ne correspond à ces filtres." : "Aucun autre projet pour l'instant."}
					</p>
				)}
			</div>
		</div>
	);
}
```

`components/register/ProjectRegister.tsx` :

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useProjects } from "@/hooks/CustomHooks";
import type { MapPoint } from "@/lib/carnet/map-view";
import { featuredProjectIds } from "@/lib/featured";
import { selectFeatured, splitIndex } from "@/lib/register";
import type { ProjectFilters } from "@/schemas";
import FilterBar from "./FilterBar";
import RegisterView from "./RegisterView";

function parseFilters(params: URLSearchParams): ProjectFilters {
	const list = (key: string) => (params.get(key) ?? "").split(",").filter(Boolean);
	return {
		search: params.get("search") || undefined,
		language: list("language") as ProjectFilters["language"],
		database: list("database") as ProjectFilters["database"],
		backend: list("backend") as ProjectFilters["backend"],
		frontend: list("frontend") as ProjectFilters["frontend"],
		devops: list("devops") as ProjectFilters["devops"],
	};
}

const NO_FILTERS: ProjectFilters = { language: [], database: [], backend: [], frontend: [], devops: [] };

export default function ProjectRegister({
	points,
	neighbors,
	entries,
}: Readonly<{ points: MapPoint[]; neighbors: Record<string, string[]>; entries: Record<number, { slug: string; title: string }> }>) {
	const params = useSearchParams();
	const filters = parseFilters(params);
	const filtersActive =
		Boolean(filters.search) ||
		[filters.language, filters.database, filters.backend, filters.frontend, filters.devops].some((l) => (l?.length ?? 0) > 0);
	const all = useProjects(NO_FILTERS);
	const filtered = useProjects(filtersActive ? filters : NO_FILTERS);
	const featured = useMemo(() => selectFeatured(all.projects, featuredProjectIds), [all.projects]);
	const index = splitIndex(all.projects, filtered.projects, featured, filtersActive);
	const status = all.error || filtered.error ? "error" : all.isLoading || filtered.isLoading ? "loading" : "ready";
	return (
		<RegisterView
			status={status}
			error={all.error ?? filtered.error ?? undefined}
			featured={featured}
			index={index}
			filtersActive={filtersActive}
			filterBar={<FilterBar />}
			points={points}
			neighbors={neighbors}
			entries={entries}
		/>
	);
}
```

Vérifier la forme exacte de `ProjectFilters` (`schemas/index.ts`) : si les tableaux sont optionnels, `NO_FILTERS` peut se réduire à `{}` ; il doit sérialiser de façon stable pour la clé de cache de `useProjects` (même objet constant à chaque rendu). Si `FilterBar` dépend d'un `Suspense` interne de l'ancien `ProjectGrid`, l'appelant (tâche 7) fournit le `Suspense`.

Supprimer `components/ProjectGrid/ProjectGrid.tsx`, `ProjectList.tsx`, `ProjectGridSkeleton.tsx`, `ProjectCard/` (`git rm -r`), déplacer `FilterBar.tsx` (`git mv components/ProjectGrid/FilterBar.tsx components/register/FilterBar.tsx`). `app/page.tsx` importe encore `ProjectGrid` : pour garder le build vert, y remplacer `<ProjectGrid />` par `<Suspense><ProjectRegister points={view.points} neighbors={{}} entries={{}} /></Suspense>` (import de `Suspense` depuis `react`) ; la tâche 7 finalisera l'accueil. Vérifier qu'aucun autre fichier n'importe les fichiers supprimés (`grep -rn "ProjectGrid\|ProjectCard\|ProjectList" app components lib hooks`).

- [ ] **Step 4: Vérifier** — Run: `pnpm test`, biome, lint, `pnpm build` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A components app/page.tsx
git commit -m "feat(registre): registre des projets — phares, index, filtres repliés ; retrait de l'ancienne grille"
```

---

### Task 7: Dernières entrées, Instruments, accueil assemblé, retrait des compétences

**Files:**
- Create: `lib/instruments.ts`, `lib/instruments.test.ts`, `components/home/LatestEntries.tsx`, `components/home/Instruments.tsx`, `components/home/home-sections.test.tsx`
- Modify: `app/page.tsx`
- Delete: `components/Skills/` (dossier entier)
- Test: `app/home.test.ts` (étendre)

**Interfaces:**
- Consumes: `latestArticles`, `projectEntries`, `getAllArticles` (tâche 3) ; `mapNeighbors` (tâche 4) ; `ProjectRegister` (tâche 6) ; `formatDateFr`, `formatReadingTime` (`lib/articles/format.ts`) ; `invertOnDark` (`lib/theme-icons.ts`).
- Produces:
  - `interface Instrument { id: "data-ml" | "backend" | "frontend" | "devops"; title: string; tools: { name: string; icon?: string }[]; libraries: string[]; utilities: string[] }`
  - `INSTRUMENTS: Instrument[]` (dans l'ordre Data & ML, back-end, front-end, DevOps)
  - `<LatestEntries articles />`, `<Instruments />`

- [ ] **Step 1: Tests qui échouent**

`lib/instruments.test.ts` :

```ts
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { INSTRUMENTS } from "./instruments";

describe("INSTRUMENTS", () => {
	it("suit l'ordre de la spec : Data & ML, back-end, front-end, DevOps", () => {
		expect(INSTRUMENTS.map((i) => i.id)).toEqual(["data-ml", "backend", "frontend", "devops"]);
	});

	it("ne référence que des logos présents dans public/", () => {
		for (const i of INSTRUMENTS)
			for (const t of i.tools)
				if (t.icon) expect(existsSync(path.join(process.cwd(), "public", t.icon))).toBe(true);
	});

	it("met les bibliothèques de ML dans la ligne Data & ML", () => {
		expect(INSTRUMENTS[0].libraries).toEqual(expect.arrayContaining(["PyTorch", "Transformers", "Scikit-learn"]));
		expect(INSTRUMENTS[1].libraries).not.toContain("PyTorch");
	});
});
```

`components/home/home-sections.test.tsx` :

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Instruments from "./Instruments";
import LatestEntries from "./LatestEntries";

const article = (slug: string, date: string) => ({
	slug, title: `Titre ${slug}`, description: "Résumé en une phrase.", date, tags: ["SRE"], readingTimeMinutes: 7,
});

describe("LatestEntries", () => {
	it("liste les entrées datées en Fira Code, avec temps de lecture et thèmes", () => {
		const html = renderToStaticMarkup(<LatestEntries articles={[article("a", "2026-10-07")]} />);
		expect(html).toContain('<time dateTime="2026-10-07"');
		expect(html).toContain("font-mono");
		expect(html).toContain("7 octobre 2026");
		expect(html).toContain('href="/articles/a"');
		expect(html).toContain("7 min de lecture");
		expect(html).toContain("SRE");
		expect(html).toContain('href="/articles"');
	});

	it("ne rend rien sans article", () => {
		expect(renderToStaticMarkup(<LatestEntries articles={[]} />)).toBe("");
	});
});

describe("Instruments", () => {
	const html = renderToStaticMarkup(<Instruments />);

	it("rend quatre lignes titrées avec le détail derrière une divulgation", () => {
		expect(html.match(/<h3/g)?.length).toBe(4);
		expect(html.match(/<details/g)?.length).toBe(4);
		expect(html).toContain("voir le détail");
	});

	it("n'anime rien (plus de cubes empilés)", () => {
		expect(html).not.toContain("animate-");
		expect(html).not.toContain("transition-all");
	});
});
```

Étendre `app/home.test.ts` :

```ts
	it("assemble l'accueil dans l'ordre du carnet et retire les compétences", () => {
		const page = read("app/page.tsx");
		const order = ["CarnetExplorer", "LatestEntries", "ProjectRegister", "Instruments", "Footer"].map((s) => page.indexOf(`<${s}`));
		expect(order.every((i) => i >= 0)).toBe(true);
		expect([...order].sort((a, b) => a - b)).toEqual(order);
		expect(page).not.toMatch(/SkillsStack|ProjectGrid/);
		expect(existsSync(path.join(process.cwd(), "components/Skills"))).toBe(false);
	});
```

- [ ] **Step 2: Vérifier l'échec** — Run: `pnpm test lib/instruments.test.ts components/home app/home.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implémenter**

`lib/instruments.ts` (contenu repris des quatre composants `components/Skills/*`, réordonné ; les bibliothèques de ML passent de « Backend & API » à « Data & ML ») :

```ts
export interface Instrument {
	id: "data-ml" | "backend" | "frontend" | "devops";
	title: string;
	tools: { name: string; icon?: string }[];
	libraries: string[];
	utilities: string[];
}

export const INSTRUMENTS: Instrument[] = [
	{
		id: "data-ml",
		title: "Data & ML",
		tools: [
			{ name: "Python", icon: "/icon/Python.svg" },
			{ name: "PostgreSQL", icon: "/icon/Postgresql.svg" },
			{ name: "MongoDB", icon: "/icon/Mongodb.svg" },
			{ name: "Informix", icon: "/icon/Informix.svg" },
		],
		libraries: ["PyTorch", "Transformers", "Scikit-learn", "pgvector", "Faiss", "SQLAlchemy", "Prisma", "Drizzle", "Mongoose", "ElectricSQL", "TanStack DB"],
		utilities: ["lite-cli", "Data Wrangler"],
	},
	{
		id: "backend",
		title: "Back-end & API",
		tools: [
			{ name: "FastAPI", icon: "/icon/FastApi.svg" },
			{ name: "Fastify", icon: "/icon/Fastify.svg" },
			{ name: "Express.js", icon: "/icon/Expressjs.svg" },
			{ name: "TypeScript", icon: "/icon/Typescript.svg" },
		],
		libraries: ["Uvicorn", "Bun", "Pytest", "Playwright", "Zod", "Swagger / OpenAPI", "JOSE", "MkDocs", "Psycopg", "Ruff", "uv"],
		utilities: ["Postman", "WebDevTools"],
	},
	{
		id: "frontend",
		title: "Front-end",
		tools: [
			{ name: "React", icon: "/icon/React.svg" },
			{ name: "Next.js", icon: "/icon/Nextjs.svg" },
			{ name: "TanStack", icon: "/icon/Tanstack.svg" },
			{ name: "Svelte", icon: "/icon/Svelte.svg" },
			{ name: "Vite", icon: "/icon/Vite.svg" },
		],
		libraries: ["NextAuth", "Biome", "Lucide React", "shadcn/ui", "DOMPurify", "date-fns", "TailwindCSS", "DaisyUI", "TSDoc"],
		utilities: ["Wave", "Playwright", "WebDevTools"],
	},
	{
		id: "devops",
		title: "DevOps & outils",
		tools: [
			{ name: "Docker", icon: "/icon/Docker.svg" },
			{ name: "GitHub Actions", icon: "/icon/Github.svg" },
		],
		libraries: ["Pytest", "Vitest", "pre-commit", "git-cliff", "standard-version"],
		utilities: ["Wave", "Playwright", "lazy-docker", "docker-compose", "Portainer"],
	},
];
```

`components/home/Instruments.tsx` :

```tsx
import Image from "next/image";
import { INSTRUMENTS } from "@/lib/instruments";
import { invertOnDark } from "@/lib/theme-icons";
import { cn } from "@/lib/utils";

/** Instruments (spec §6.5) : une ligne par domaine, détail derrière une divulgation. */
export default function Instruments() {
	return (
		<ul className="divide-y divide-border/70 border-y border-border/70">
			{INSTRUMENTS.map((instrument) => (
				<li key={instrument.id} className="grid gap-3 py-4 sm:grid-cols-[12rem_1fr]">
					<h3 className="font-display text-base font-semibold">{instrument.title}</h3>
					<div>
						<ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
							{instrument.tools.map((tool) => (
								<li key={tool.name} className="flex items-center gap-2 text-sm">
									{tool.icon ? (
										<Image src={tool.icon} alt="" width={20} height={20} className={cn("size-5", invertOnDark(tool.icon))} />
									) : null}
									{tool.name}
								</li>
							))}
						</ul>
						<details className="mt-2">
							<summary className="cursor-pointer rounded-sm font-mono text-[11px] text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
								voir le détail
							</summary>
							<dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
								<div>
									<dt className="font-mono text-[11px] text-ink-soft">Bibliothèques</dt>
									<dd>{instrument.libraries.join(", ")}</dd>
								</div>
								<div>
									<dt className="font-mono text-[11px] text-ink-soft">Utilitaires</dt>
									<dd>{instrument.utilities.join(", ")}</dd>
								</div>
							</dl>
						</details>
					</div>
				</li>
			))}
		</ul>
	);
}
```

`components/home/LatestEntries.tsx` :

```tsx
import Link from "next/link";
import { formatDateFr, formatReadingTime } from "@/lib/articles/format";
import type { ArticleMeta } from "@/lib/articles/loader";

/** Dernières entrées du carnet (spec §6.3). */
export default function LatestEntries({ articles }: Readonly<{ articles: ArticleMeta[] }>) {
	if (articles.length === 0) return null;
	return (
		<div>
			<ol className="divide-y divide-border/70 border-y border-border/70">
				{articles.map((article) => (
					<li key={article.slug} className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
						<time dateTime={article.date} className="font-mono text-xs text-ink-soft sm:pt-1.5">
							{formatDateFr(article.date)}
						</time>
						<div>
							<h3 className="font-display text-lg font-semibold">
								<Link href={`/articles/${article.slug}`} className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
									{article.title}
								</Link>
							</h3>
							<p className="mt-1 line-clamp-2 text-base leading-relaxed">{article.description}</p>
							<p className="mt-2 font-mono text-[11px] text-ink-soft">
								{formatReadingTime(article.readingTimeMinutes)}
								{article.tags.length > 0 ? ` · ${article.tags.join(" · ")}` : ""}
							</p>
						</div>
					</li>
				))}
			</ol>
			<Link href="/articles" className="mt-4 inline-block rounded-sm font-mono text-xs text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
				Toutes les entrées →
			</Link>
		</div>
	);
}
```

(Le test vérifie `'<time dateTime="2026-10-07"'` : React sérialise l'attribut en `datetime` ; ajuster l'attendu à `'<time dateTime='` ou `'datetime="2026-10-07"'` selon la sortie réelle de `renderToStaticMarkup`, sans changer le composant.)

`app/page.tsx` — sous la section Fig. 1 existante, remplacer le bloc `<hr />` + compétences + `<section id="realisations">…<ProjectGrid/ProjectRegister…>` par :

```tsx
			<div className="mx-auto w-full max-w-6xl space-y-20 px-4 pb-20 sm:px-6">
				{entries.length > 0 ? (
					<section aria-labelledby="entries-title">
						<h2 id="entries-title" className="font-display text-2xl font-bold">Dernières entrées</h2>
						<div className="mt-6"><LatestEntries articles={entries} /></div>
					</section>
				) : null}
				<section id="realisations" aria-labelledby="register-title">
					<h2 id="register-title" className="font-display text-2xl font-bold">Registre des projets</h2>
					<div className="mt-6">
						<Suspense fallback={<RegisterView status="loading" featured={[]} index={[]} filtersActive={false} filterBar={null} points={[]} neighbors={{}} entries={{}} />}>
							<ProjectRegister points={view.points} neighbors={neighbors} entries={byProject} />
						</Suspense>
					</div>
				</section>
				<section aria-labelledby="instruments-title">
					<h2 id="instruments-title" className="font-display text-2xl font-bold">Instruments</h2>
					<div className="mt-6"><Instruments /></div>
				</section>
			</div>
			<Footer />
```

avec, au niveau module (à côté de `view` et `searchItems`) :

```ts
const entries = latestArticles(3);
const byProject = projectEntries(getAllArticles());
const neighbors = mapNeighbors(map);
```

et les imports correspondants (`Suspense` de `react`, `LatestEntries`, `Instruments`, `ProjectRegister`, `RegisterView`, `latestArticles`, `projectEntries`, `getAllArticles`, `mapNeighbors`). Supprimer les imports de `SkillsStack` et `ProjectGrid`. Garder l'ancre `id="realisations"` (liens existants).

Supprimer `components/Skills/` (`git rm -r`) ; vérifier qu'aucun fichier ne l'importe.

- [ ] **Step 4: Vérifier** — Run: `pnpm test`, biome, lint, `pnpm build` — Expected: PASS ; `/` reste `○`.

- [ ] **Step 5: Essai navigateur** — `pnpm start -p 3316` (noter le PID). Avec les outils Playwright du MCP, à 1280×800 puis 390×844 : l'ordre des sections ; 4 projets phares avec mini-carte et barre ; l'index sans les phares ; ouvrir « Filtrer le registre », filtrer sur Python : l'index montre toutes les correspondances et le `<details>` reste ouvert après rechargement ; « voir le détail » d'un instrument ; aucune erreur console. Arrêter le serveur par son PID (jamais de `pkill` par motif).

- [ ] **Step 6: Commit**

```bash
git add -A app components lib
git commit -m "feat(accueil): dernières entrées, registre des projets et instruments ; retrait du bloc compétences"
```

---

### Task 8: Vérification, mesures et PR

**Files:** aucun fichier de code, sauf correctifs trouvés pendant la vérification (commits `fix(…)` dédiés et testés).

- [ ] **Step 1:** `pnpm test && pnpm exec biome check && pnpm lint && pnpm build` — tout PASS.
- [ ] **Step 2: Revue visuelle** — `pnpm start -p 3317` (PID noté). Captures Playwright de `/` en pleine page à 390×844 et 1280×800, clair et sombre, plus 1280 en `prefers-reduced-motion: reduce`, rangées dans le dossier de travail SDD du plan (`screens/`), pas dans le dépôt. Vérifier : hiérarchie h1 → h2 → h3 sans saut (`document.querySelectorAll("h1,h2,h3,h4")`), aucun débordement horizontal à 390 px, grille du papier visible, teintes lisibles dans les deux thèmes, aucune animation en mouvement réduit.
- [ ] **Step 3: Lighthouse local** — 3 passes mobile sur la branche (`npx lighthouse http://localhost:3317/ --only-categories=performance --form-factor=mobile --chrome-flags="--headless" --quiet --output=json --output-path=/tmp/claude-1000/lh-l3-N.json`) ; relever score, FCP, LCP, CLS, TBT par passe et médianes. Référence `main` (production 2026-10-09, à chaud) : 95, LCP 2,57–2,72 s, CLS 0,010. Seuils : pas de régression ; LCP < 2,5 s visé. Ne pas modifier le design pour gagner des points sans le signaler.
- [ ] **Step 4: Push et PR** — `git push -u origin feat/v2-l3-home` puis `gh pr create --base main --title "feat(accueil): L3 — dernières entrées, registre des projets, instruments"` ; corps en français : livraison, décisions (complément des projets phares faute de projets ML/IAG en base, `lib/featured.ts` à renseigner par William, registre chargé à l'exécution, ThemedToaster déplacé, mots vides), mesures, reste pour L4 ; dernière ligne `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Ne pas merger. Arrêter les serveurs lancés, par PID.
