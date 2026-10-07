# Portfolio V2 — L2 « Fig. 1 » Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer l'ouverture de l'accueil par la Fig. 1 : une carte SVG des projets et articles, un champ de saisie, une recherche par mots-clés immédiate puis sémantique (modèle statique chargé dans un Web Worker), les trois résultats les plus proches et le point de la requête posé sur la carte ; retirer `HeroPrompt` et l'animation vers Contact.

**Architecture:** La logique est pure et testée dans `lib/carnet/` (recherche, placement, état de l'explorateur, chargement du modèle). Le Worker (`lib/carnet/carnet.worker.ts`) n'est qu'un adaptateur de messages autour de `lib/carnet/engine.ts`. L'accueil devient un composant serveur qui lit `content/map.json` ; seul `CarnetExplorer` est un îlot client. La carte est rendue côté serveur (visible dès le HTML) ; l'entrée orchestrée de la Fig. 1 est en CSS pur, neutralisée par `prefers-reduced-motion`.

**Tech Stack:** Next.js 16.1.4 (App Router, Turbopack), React 19.2, Tailwind CSS v4, framer-motion 12, zod 4, Vitest 4 (environnement `node`, tests de composants par `renderToStaticMarkup`), Biome 2.3, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-07-portfolio-v2-carnet-de-labo-design.md` — sections 1, 5, 6 (point 2), 7.3 (noms de groupes), 7.4, 7.5, 9. L2 est la ligne « L2 » de la section 10.

**Base :** `main` à `115fdf5` (L0 et L1 mergées). Worktree : `/home/will/dev-project/portfolio-l2`, branche `feat/v2-l2-fig1`. `.env.local` y est déjà copié (nécessaire uniquement à la tâche 2 pour `pnpm embeddings`).

## Global Constraints

- Aucune nouvelle dépendance npm (ni bibliothèque d'animation, ni bibliothèque de test). `framer-motion` reste la seule bibliothèque d'animation ; du CSS pur est permis.
- Le contenu est complet au repos : aucun élément n'attend un observateur (`whileInView`, `IntersectionObserver`) pour devenir lisible ; aucune `opacity:0` inline dans le HTML serveur.
- `prefers-reduced-motion: reduce` : tout est visible immédiatement dans son état final, aucun mouvement, aucune respiration.
- Aucune inférence côté serveur ; le build Vercel ne lit pas la base : il lit `content/map.json`.
- Le tokenizer (`lib/carnet/tokenize.ts`) et le modèle (`public/models/carnet-static/`) ne changent pas.
- Accessibilité : AA dans les deux thèmes, focus visible, la carte est doublée d'une liste navigable au clavier, résultats annoncés dans une région `aria-live="polite"`, `role="img"` avec description sur le SVG.
- Textes en français, accents et typographie française (« », espaces avant `:`).
- Polices et tokens de L1 inchangés sauf mention explicite (tâche 1).
- Chaque commit : `pnpm exec biome check --write` puis tests verts ; message au style du dépôt (`feat(carnet): …`, `fix(…)`, `test(…)`), terminé par la ligne `Co-Authored-By: <le modèle qui a réellement écrit le commit> <noreply@anthropic.com>`.
- Ne pas toucher à l'administration, au catalogue (base), au contenu des articles, ni aux sections Compétences / Réalisations de l'accueil (L3).

## Review Focus

1. **Frappe rapide** : des réponses du Worker arrivent dans le désordre → seule la réponse de la dernière saisie s'affiche (tâche 6, test « ignore une réponse périmée »).
2. **Modèle indisponible** (hors ligne, 404, version différente de la carte) → l'accueil reste en mode mots-clés, sans message d'erreur ni rejet de promesse non géré (tâche 4, tests de rejet ; tâche 6, test « failed → mots-clés »).
3. **Requête sans mot connu du modèle** (faute de frappe, jargon) en mode sémantique → repli par mots-clés, pas de liste vide (tâche 6, test « ranked null »).
4. **Saisie de ponctuation, d'une seule lettre ou d'espaces** → état de repos, pas « aucun résultat » (tâche 6, test « rest »).
5. **Sans JavaScript / avant hydratation / mouvement réduit** → la carte, la légende et la liste des éléments sont visibles et leurs liens fonctionnent (tâche 5, tests SSR et test CSS `prefers-reduced-motion`).

---

## Partie L2

### Task 1: Retouches des primitives du carnet (reports de L1)

**Files:**
- Modify: `lib/motion.ts`
- Modify: `components/notebook/InkPath.tsx`, `components/notebook/MarginNote.tsx`, `components/notebook/InkUnderline.tsx`
- Modify: `app/globals.css` (bloc `@layer base`, règle `em, i`)
- Modify: `app/layout.tsx` (instance `sourceSerifItalic`)
- Test: `lib/motion.test.ts` (créer), `components/notebook/notebook.test.tsx`, `lib/theme-tokens.test.ts`

**Interfaces:**
- Produces: `inkDrawAnimation(reduced: boolean | null): { pathLength: number[] } | undefined`, `noteAnimation(reduced: boolean | null): { y: number[] } | undefined` dans `lib/motion.ts` ; prop `inline?: boolean` sur `MarginNote` (quand `true`, jamais positionnée en marge, même en `xl`) ; prop `vectorEffect?: "non-scaling-stroke"` sur `InkPath`.

- [ ] **Step 1: Écrire les tests qui échouent**

`lib/motion.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { inkDrawAnimation, noteAnimation } from "./motion";

describe("animations du carnet", () => {
	it("tracent l'encre et décalent la note seulement si le mouvement est permis", () => {
		expect(inkDrawAnimation(false)).toEqual({ pathLength: [0, 1] });
		expect(noteAnimation(false)).toEqual({ y: [4, 0] });
	});

	it("ne bougent pas en mouvement réduit ni au rendu serveur (null)", () => {
		expect(inkDrawAnimation(true)).toBeUndefined();
		expect(inkDrawAnimation(null)).toBeUndefined();
		expect(noteAnimation(true)).toBeUndefined();
		expect(noteAnimation(null)).toBeUndefined();
	});
});
```

Ajouter à `components/notebook/notebook.test.tsx` (dans les `describe` existants `MarginNote` et `InkPath`, ou un nouveau `describe("InkUnderline")`) :

```tsx
	it("reste dans le flux quand inline est demandé", () => {
		const html = renderToStaticMarkup(
			<MarginNote inline>essaie « vision »</MarginNote>,
		);
		expect(html).not.toContain("xl:absolute");
	});
```

```tsx
describe("InkUnderline", () => {
	it("garde une épaisseur de trait constante malgré l'étirement", () => {
		const html = renderToStaticMarkup(<InkUnderline>mot</InkUnderline>);
		expect(html).toContain('vector-effect="non-scaling-stroke"');
	});
});
```

Ajouter à `lib/theme-tokens.test.ts` (le fichier lit déjà `app/globals.css` ; réutiliser sa variable de contenu CSS ou relire le fichier avec `readFileSync`) :

```ts
	it("garde la police des titres pour l'italique à l'intérieur d'un titre", () => {
		expect(css).toMatch(
			/:is\(h1, h2, h3, h4\) :is\(em, i\)\s*\{\s*font-family: inherit;/,
		);
	});
```

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `pnpm test lib/motion.test.ts components/notebook lib/theme-tokens.test.ts`
Expected: FAIL (`inkDrawAnimation` introuvable, `xl:absolute` présent, `vector-effect` absent, règle CSS absente).

- [ ] **Step 3: Implémenter**

Ajouter à `lib/motion.ts` :

```ts
/** `useReducedMotion()` vaut `null` au rendu serveur : seul `false` autorise le mouvement. */
export function inkDrawAnimation(reduced: boolean | null) {
	return reduced === false ? { pathLength: [0, 1] } : undefined;
}

export function noteAnimation(reduced: boolean | null) {
	return reduced === false ? { y: [4, 0] } : undefined;
}
```

`InkPath.tsx` : ajouter la prop `vectorEffect?: "non-scaling-stroke"` à `InkPathProps`, la passer à `<motion.path vectorEffect={vectorEffect} …>` et remplacer l'expression de `whileInView` par `whileInView={inkDrawAnimation(reduced)}`.

`MarginNote.tsx` : ajouter `inline?: boolean` (défaut `false`) ; `whileInView={noteAnimation(reduced)}` ; classes :

```tsx
			className={cn(
				"font-hand text-lg leading-snug text-note my-3",
				!inline && "xl:my-0 xl:absolute xl:top-0 xl:w-48",
				!inline &&
					(side === "right" ? "xl:-right-56" : "xl:-left-56 xl:text-right"),
			)}
```

`InkUnderline.tsx` : `<InkPath d="…" strokeWidth={2} vectorEffect="non-scaling-stroke" />`.

`app/globals.css`, dans `@layer base`, juste après la règle `em, i { … }` :

```css
  :is(h1, h2, h3, h4) :is(em, i) {
    font-family: inherit;
  }
```

`app/layout.tsx` : instance `sourceSerifItalic`, `weight: ["400", "600"]` (police variable : même fichier, toujours `preload: false` ; évite le gras italique synthétisé).

- [ ] **Step 4: Lancer les tests, vérifier le succès**

Run: `pnpm test` puis `pnpm exec biome check --write` puis `pnpm lint`
Expected: tout PASS, aucun changement de formatage restant.

- [ ] **Step 5: Commit**

```bash
git add lib/motion.ts lib/motion.test.ts components/notebook app/globals.css app/layout.tsx lib/theme-tokens.test.ts
git commit -m "fix(carnet): primitives — mouvement testable, note en ligne, trait constant, italique des titres"
```

---

### Task 2: Données de la carte — termes de recherche et noms de groupes

**Files:**
- Create: `lib/carnet/terms.ts`, `lib/carnet/terms.test.ts`, `lib/carnet/map-clusters.test.ts`
- Modify: `lib/carnet/corpus.ts` (`CorpusItem.terms`), `lib/carnet/corpus.test.ts`
- Modify: `lib/carnet/map-types.ts` (`terms` dans `MapItemSchema`), `lib/carnet/map-build.ts` (`buildMap` recopie `terms`), `lib/carnet/map-build.test.ts` (fixtures)
- Modify: `content/map-clusters.ts`
- Regenerate: `content/map.json` (`pnpm embeddings`)

**Interfaces:**
- Consumes: `tokenize(text: string): string[]` (`lib/carnet/tokenize.ts`).
- Produces: `extractTerms(...texts: string[]): string[]` ; `CorpusItem.terms: string[]` ; `MapItem.terms: string[]` (obligatoire) ; `clusterLabels` rempli pour `c1`…`c5`. Les tâches 3, 5, 6 et 7 lisent `MapItem.terms`.

- [ ] **Step 1: Écrire les tests qui échouent**

`lib/carnet/terms.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { extractTerms } from "./terms";

describe("extractTerms", () => {
	it("garde les mots utiles du titre et de la description, pliés et dédupliqués", () => {
		expect(
			extractTerms(
				"Neuf agents, neuf jours",
				"Une flotte de neuf agents SRE sur un home-server",
			),
		).toEqual(["neuf", "agents", "jours", "flotte", "sre", "home", "server"]);
	});

	it("écarte les mots vides français et anglais et les mots de moins de 3 lettres", () => {
		expect(
			extractTerms("The search for the best model", "pour les données de la vision"),
		).toEqual(["search", "best", "model", "donnees", "vision"]);
	});

	it("renvoie une liste vide pour un texte vide", () => {
		expect(extractTerms("", "")).toEqual([]);
	});
});
```

Ajouter à `lib/carnet/corpus.test.ts` :

```ts
describe("termes de recherche", () => {
	it("dérive les termes d'un article de son titre et de sa description", () => {
		const item = articleToCorpusItem({
			slug: "x",
			title: "Neuf agents, neuf jours",
			description: "Une flotte SRE",
			tags: ["LLM local"],
		});
		expect(item.terms).toEqual(["neuf", "agents", "jours", "flotte", "sre"]);
	});

	it("dérive les termes d'un projet de son titre et de sa description", () => {
		expect(projectToCorpusItem(baseProject)?.terms).toEqual([
			"p13",
			"fashion",
			"insta",
			"openclassroom",
			"project",
			"vision",
			"task",
		]);
	});
});
```

(« ml » et « ai » sont écartés car de moins de 3 lettres ; « on » est trop court ; vérifier l'attendu à l'exécution et l'ajuster seulement s'il diffère à cause de la liste de mots vides, jamais en changeant `tokenize`.)

`lib/carnet/map-clusters.test.ts` :

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { clusterLabels } from "@/content/map-clusters";
import { MapDataSchema } from "./map-types";

const map = MapDataSchema.parse(
	JSON.parse(
		readFileSync(path.join(process.cwd(), "content", "map.json"), "utf8"),
	),
);

describe("content/map-clusters.ts", () => {
	it("nomme exactement les groupes de la carte", () => {
		expect(Object.keys(clusterLabels).sort()).toEqual(
			map.clusters.map((c) => c.id).sort(),
		);
	});

	it("donne des noms non vides et distincts", () => {
		const labels = Object.values(clusterLabels).map((l) => l.trim());
		expect(labels.every((l) => l.length > 0)).toBe(true);
		expect(new Set(labels).size).toBe(labels.length);
	});

	it("est appliqué à content/map.json (sinon : relancer `pnpm embeddings`)", () => {
		for (const c of map.clusters) expect(c.label).toBe(clusterLabels[c.id]);
	});

	it("donne des termes de recherche à chaque élément", () => {
		for (const item of map.items) expect(item.terms.length).toBeGreaterThan(0);
	});
});
```

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `pnpm test lib/carnet`
Expected: FAIL (`./terms` introuvable, `terms` absent, `clusterLabels` vide).

- [ ] **Step 3: Implémenter**

`lib/carnet/terms.ts` :

```ts
import { tokenize } from "./tokenize";

/** Mots vides (déjà pliés par `tokenize`) écartés des termes de recherche. */
const STOPWORDS = new Set([
	"les", "des", "une", "est", "pour", "par", "sur", "dans", "avec", "sans",
	"qui", "que", "aux", "ses", "son", "leur", "leurs", "cette", "ces", "mais",
	"plus", "tout", "tous", "comme", "entre", "vers", "chez", "elle", "ils",
	"nous", "vous", "donc", "car", "ete", "etre", "fait", "the", "and", "for",
	"with", "from", "that", "this", "into", "are", "was", "its", "your", "our",
	"not", "all", "via", "using", "based",
]);

/** Termes de recherche d'un élément : mots d'au moins 3 lettres, pliés, sans mots vides, dédupliqués dans l'ordre. */
export function extractTerms(...texts: string[]): string[] {
	const seen = new Set<string>();
	for (const text of texts)
		for (const word of tokenize(text))
			if (word.length >= 3 && !STOPWORDS.has(word)) seen.add(word);
	return [...seen];
}
```

(Biome reformatera le tableau ; c'est attendu.)

`lib/carnet/corpus.ts` : ajouter `terms: string[]` à `CorpusItem` ; dans `articleToCorpusItem` : `terms: extractTerms(article.title, article.description)` ; dans `projectToCorpusItem` : `terms: extractTerms(project.title, project.description)`.

`lib/carnet/map-types.ts` : dans `MapItemSchema`, après `keywords`, ajouter `terms: z.array(z.string()),`.

`lib/carnet/map-build.ts` : dans `buildMap`, l'objet de chaque élément reçoit `terms: it.terms,` juste après `keywords: it.keywords,`. Mettre à jour la fabrique `item()` de `map-build.test.ts` pour fournir `terms: []` (ou des termes cohérents) afin que les tests existants compilent.

`content/map-clusters.ts` :

```ts
/**
 * Noms des groupes de la carte (Fig. 1). Clé = identifiant produit par `pnpm embeddings`
 * (c1…c5). Relire l'appartenance des groupes après chaque régénération.
 */
export const clusterLabels: Record<string, string> = {
	c1: "Agents et SRE",
	c2: "Outillage et CI",
	c3: "Web TypeScript",
	c4: "Data science",
	c5: "LLM et NLP",
};
```

- [ ] **Step 4: Régénérer la carte**

Run: `pnpm embeddings`
Expected: `content/map.json : N éléments, groupes : [ { id: 'c1', label: 'Agents et SRE' }, … ]`.

Puis afficher l'appartenance des groupes :

```bash
node -e 'const m=require("./content/map.json");for(const c of m.clusters){console.log(c.id,c.label);for(const i of m.items.filter(i=>i.cluster===c.id))console.log("   ",i.title)}'
```

Appartenance attendue (celle de `main`) : c1 = « Neuf agents, neuf jours » ; c2 = Abricot.co, CLEA - Document Search Platform, Les Petits Plats, p12-phase2-zenassist, whisperx-gb10, ai_corrector, caviarder, code-review, docgen-rs ; c3 = CLEA WebUI, Lazy-Locker, TypeScript REST API Vanilla, OC-P9 Fisheye, P14-NewsFoundry, Syntheo ; c4 = OC-P10 TechNova Livrable, P8 Bottleneck, OC-P7 DataImmo, p12-phase1-zenassist, P13-Fashion-Insta ; c5 = SportSee, Fashion Trend Intelligence, AI Report Maker, LLM Summarizer Trainer, p12-zenassist-training-modernbert-cls.

Si l'appartenance diffère (catalogue modifié en base depuis L0), garder la carte régénérée, ne pas renommer les groupes, et signaler l'écart dans le rapport (statut DONE_WITH_CONCERNS) avec la nouvelle appartenance complète.

Vérifier aussi que `git diff --stat content/map.json` ne montre pas de déplacement massif des coordonnées (graine fixe : seuls `terms`, `label` et `generatedAt` doivent changer si le catalogue est identique).

- [ ] **Step 5: Lancer les tests, vérifier le succès**

Run: `pnpm test` puis `pnpm exec biome check --write` puis `pnpm lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/carnet content/map-clusters.ts content/map.json
git commit -m "feat(carnet): termes de recherche par élément et noms des groupes de la carte"
```

---

### Task 3: Cœur de la recherche (mots-clés, sémantique, placement, score)

**Files:**
- Create: `lib/carnet/search.ts`, `lib/carnet/search.test.ts`

**Interfaces:**
- Consumes: `cosine(a, b): number` (`lib/carnet/static-model.ts`), `foldText`, `tokenize` (`lib/carnet/tokenize.ts`).
- Produces:
  - `interface SearchItem { id: string; title: string; keywords: string[]; terms: string[] }`
  - `interface Scored { id: string; score: number }`
  - `keywordMatches(query: string, items: SearchItem[]): Scored[]` — triés par score décroissant puis `id`
  - `semanticRank(query: ArrayLike<number>, items: { id: string; vector: ArrayLike<number> }[]): Scored[]` — triés par cosinus décroissant
  - `placeQuery(ranked: Scored[], positions: ReadonlyMap<string, { x: number; y: number }>, k?: number): { x: number; y: number } | null`
  - `formatScore(score: number): string` — `0.8234 → "0,82"`

- [ ] **Step 1: Écrire les tests qui échouent**

`lib/carnet/search.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import {
	formatScore,
	keywordMatches,
	placeQuery,
	type SearchItem,
	semanticRank,
} from "./search";

const items: SearchItem[] = [
	{ id: "a", title: "Neuf agents", keywords: ["agents autonomes", "llm local"], terms: ["neuf", "agents", "flotte"] },
	{ id: "b", title: "Fashion", keywords: ["python", "docker"], terms: ["fashion", "vision", "segmentation"] },
	{ id: "c", title: "Go tool", keywords: ["go"], terms: ["outil", "google"] },
];

describe("keywordMatches", () => {
	it("trouve un mot-clé complet en ignorant accents et casse", () => {
		expect(keywordMatches("LLM Local", items).map((m) => m.id)).toEqual(["a"]);
	});

	it("trouve un terme par préfixe à partir de 3 lettres", () => {
		expect(keywordMatches("visi", items).map((m) => m.id)).toEqual(["b"]);
	});

	it("ne confond pas un mot-clé court avec un morceau de mot", () => {
		expect(keywordMatches("google", items).map((m) => m.id)).toEqual(["c"]);
		expect(keywordMatches("going", items)).toEqual([]);
	});

	it("classe par nombre de correspondances", () => {
		const ranked = keywordMatches("agents vision flotte", items);
		expect(ranked.map((m) => m.id)).toEqual(["a", "b"]);
		expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
	});

	it("ne renvoie rien pour une saisie sans mot", () => {
		expect(keywordMatches("  !! ", items)).toEqual([]);
		expect(keywordMatches("a", items)).toEqual([]);
	});
});

describe("semanticRank", () => {
	it("trie par similarité cosinus décroissante", () => {
		const ranked = semanticRank([1, 0], [
			{ id: "x", vector: [0, 1] },
			{ id: "y", vector: [1, 0] },
			{ id: "z", vector: [1, 1] },
		]);
		expect(ranked.map((r) => r.id)).toEqual(["y", "z", "x"]);
		expect(ranked[0].score).toBeCloseTo(1);
	});
});

describe("placeQuery", () => {
	const positions = new Map([
		["p", { x: 0, y: 0 }],
		["q", { x: 1, y: 1 }],
		["r", { x: 1, y: 0 }],
	]);

	it("pondère les positions des plus proches par leur similarité", () => {
		const point = placeQuery(
			[{ id: "p", score: 0.75 }, { id: "q", score: 0.25 }],
			positions,
		);
		expect(point?.x).toBeCloseTo(0.25);
		expect(point?.y).toBeCloseTo(0.25);
	});

	it("ne garde que les k plus proches", () => {
		const point = placeQuery(
			[{ id: "p", score: 0.9 }, { id: "q", score: 0.8 }, { id: "r", score: 0.7 }],
			positions,
			1,
		);
		expect(point).toEqual({ x: 0, y: 0 });
	});

	it("ignore les similarités négatives et retombe sur la moyenne simple", () => {
		const point = placeQuery(
			[{ id: "p", score: -0.2 }, { id: "q", score: -0.4 }],
			positions,
		);
		expect(point).toEqual({ x: 0.5, y: 0.5 });
	});

	it("renvoie null sans élément positionné", () => {
		expect(placeQuery([{ id: "inconnu", score: 1 }], positions)).toBeNull();
	});
});

describe("formatScore", () => {
	it("écrit le score à la française avec deux décimales", () => {
		expect(formatScore(0.8234)).toBe("0,82");
		expect(formatScore(1)).toBe("1,00");
	});
});
```

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `pnpm test lib/carnet/search.test.ts`
Expected: FAIL (`./search` introuvable).

- [ ] **Step 3: Implémenter**

`lib/carnet/search.ts` :

```ts
import { cosine } from "./static-model";
import { foldText, tokenize } from "./tokenize";

export interface SearchItem {
	id: string;
	title: string;
	keywords: string[];
	terms: string[];
}

export interface Scored {
	id: string;
	score: number;
}

const byScore = (a: Scored, b: Scored) =>
	b.score - a.score || a.id.localeCompare(b.id);

/**
 * Repli par mots-clés (spec §7.4) : +2 par mot-clé présent comme mot entier dans la saisie
 * (ou dont un mot commence par un mot saisi de 3 lettres et plus), +1 par mot saisi qui
 * correspond à un terme (préfixe à partir de 3 lettres, égalité en dessous).
 */
export function keywordMatches(query: string, items: SearchItem[]): Scored[] {
	const tokens = [...new Set(tokenize(query))];
	if (tokens.length === 0) return [];
	const padded = ` ${tokens.join(" ")} `;
	const long = tokens.filter((t) => t.length >= 3);
	const out: Scored[] = [];
	for (const item of items) {
		let score = 0;
		for (const keyword of item.keywords) {
			const kw = foldText(keyword).trim();
			if (kw.length < 2) continue;
			if (
				padded.includes(` ${kw} `) ||
				long.some((t) => kw.split(" ").some((part) => part.startsWith(t)))
			)
				score += 2;
		}
		for (const token of tokens) {
			const hit = item.terms.some((term) =>
				token.length >= 3 ? term.startsWith(token) : term === token,
			);
			if (hit) score += 1;
		}
		if (score > 0) out.push({ id: item.id, score });
	}
	return out.sort(byScore);
}

export function semanticRank(
	query: ArrayLike<number>,
	items: { id: string; vector: ArrayLike<number> }[],
): Scored[] {
	return items
		.map((item) => ({ id: item.id, score: cosine(query, item.vector) }))
		.sort(byScore);
}

/** Point de la requête : moyenne des positions des k plus proches, pondérée par la similarité (spec §7.4). */
export function placeQuery(
	ranked: Scored[],
	positions: ReadonlyMap<string, { x: number; y: number }>,
	k = 5,
): { x: number; y: number } | null {
	const top: { score: number; x: number; y: number }[] = [];
	for (const r of ranked) {
		const p = positions.get(r.id);
		if (p) top.push({ score: r.score, x: p.x, y: p.y });
		if (top.length === k) break;
	}
	if (top.length === 0) return null;
	const weights = top.map((t) => Math.max(t.score, 0));
	const total = weights.reduce((s, w) => s + w, 0);
	let x = 0;
	let y = 0;
	top.forEach((t, i) => {
		const w = total > 0 ? weights[i] / total : 1 / top.length;
		x += t.x * w;
		y += t.y * w;
	});
	return { x, y };
}

const SCORE_FORMAT = new Intl.NumberFormat("fr-FR", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

export function formatScore(score: number): string {
	return SCORE_FORMAT.format(score);
}
```

Note : `keywordMatches("going", …)` doit être vide alors que le terme `google` existe — « going » ne commence pas `google`, et le mot-clé `go` n'est pas un mot entier de la saisie. Pour `"google"`, le terme `google` correspond (+1) ; le mot-clé `go` n'est pas compté car « google » n'est pas « go » en mot entier et la règle de préfixe porte sur les mots du mot-clé qui commencent par le mot saisi (« go » ne commence pas par « google »).

- [ ] **Step 4: Lancer les tests, vérifier le succès**

Run: `pnpm test` puis `pnpm exec biome check --write` puis `pnpm lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/carnet/search.ts lib/carnet/search.test.ts
git commit -m "feat(carnet): recherche par mots-clés, rang sémantique et placement de la requête"
```

---

### Task 4: Chargement du modèle, moteur et Web Worker

**Files:**
- Create: `lib/carnet/engine.ts`, `lib/carnet/engine.test.ts`, `lib/carnet/worker-protocol.ts`, `lib/carnet/carnet.worker.ts`
- Modify: `next.config.ts`
- Test: `next.config.test.ts` (créer, à la racine)

**Interfaces:**
- Consumes: `createStaticModel`, `embedText`, `StaticModel`, `StaticModelMeta` (`lib/carnet/static-model.ts`) ; `semanticRank`, `Scored` (tâche 3).
- Produces:
  - `MODEL_BASE_URL = "/models/carnet-static"`
  - `modelUrl(base: string, file: string, version: string): string` → `${base}/${file}?v=${version}`
  - `versionOf(mapModel: string): string` — `"carnet-static@f63393960f37" → "f63393960f37"`
  - `type FetchLike = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown>; arrayBuffer(): Promise<ArrayBuffer> }>`
  - `loadStaticModel(base: string, version: string, fetchFn: FetchLike): Promise<StaticModel>` — rejette si un fichier répond `!ok` ou si `meta.version !== version`
  - `interface SearchEngine { query(text: string): Scored[] | null }` ; `createSearchEngine(model, items: { id: string; vector: number[] }[]): SearchEngine` — `null` quand aucun mot n'est connu
  - `worker-protocol.ts` : `type WorkerRequest = { type: "init" } | { type: "query"; seq: number; text: string }` ; `type WorkerResponse = { type: "ready" } | { type: "error"; message: string } | { type: "result"; seq: number; ranked: Scored[] | null }`

- [ ] **Step 1: Écrire les tests qui échouent**

`lib/carnet/engine.test.ts` :

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	createSearchEngine,
	type FetchLike,
	loadStaticModel,
	MODEL_BASE_URL,
	modelUrl,
	versionOf,
} from "./engine";
import { MapDataSchema } from "./map-types";

const dir = path.join(process.cwd(), "public", "models", "carnet-static");
const map = MapDataSchema.parse(
	JSON.parse(
		readFileSync(path.join(process.cwd(), "content", "map.json"), "utf8"),
	),
);

const diskFetch: FetchLike = async (url) => {
	const file = url.slice(MODEL_BASE_URL.length + 1).split("?")[0];
	const buf = readFileSync(path.join(dir, file));
	return {
		ok: true,
		status: 200,
		json: async () => JSON.parse(buf.toString("utf8")),
		arrayBuffer: async () =>
			buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
	};
};

describe("engine", () => {
	it("lit la version du modèle dans l'identifiant de la carte", () => {
		expect(versionOf("carnet-static@f63393960f37")).toBe("f63393960f37");
	});

	it("ajoute la version aux URL pour un cache immuable", () => {
		expect(modelUrl(MODEL_BASE_URL, "vocab.json", "abc")).toBe(
			"/models/carnet-static/vocab.json?v=abc",
		);
	});

	it("charge le modèle publié et classe tous les éléments de la carte", async () => {
		const model = await loadStaticModel(
			MODEL_BASE_URL,
			versionOf(map.model),
			diskFetch,
		);
		const engine = createSearchEngine(model, map.items);
		const ranked = engine.query("agents autonomes et LLM local");
		expect(ranked).not.toBeNull();
		expect(ranked?.length).toBe(map.items.length);
		const scores = ranked?.map((r) => r.score) ?? [];
		expect([...scores].sort((a, b) => b - a)).toEqual(scores);
	});

	it("renvoie null quand aucun mot de la requête n'est connu", async () => {
		const model = await loadStaticModel(
			MODEL_BASE_URL,
			versionOf(map.model),
			diskFetch,
		);
		expect(createSearchEngine(model, map.items).query("zzqx qqwv")).toBeNull();
	});

	it("rejette quand un fichier est introuvable", async () => {
		const failing: FetchLike = async (url) =>
			url.includes("vectors.i8")
				? { ok: false, status: 404, json: async () => null, arrayBuffer: async () => new ArrayBuffer(0) }
				: diskFetch(url);
		await expect(
			loadStaticModel(MODEL_BASE_URL, versionOf(map.model), failing),
		).rejects.toThrow("vectors.i8 : HTTP 404");
	});

	it("rejette un modèle d'une autre version que la carte", async () => {
		await expect(
			loadStaticModel(MODEL_BASE_URL, "autre-version", diskFetch),
		).rejects.toThrow("autre-version");
	});
});
```

`next.config.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("next.config", () => {
	it("sert les fichiers du modèle avec un cache immuable", async () => {
		const rules = (await nextConfig.headers?.()) ?? [];
		const rule = rules.find((r) => r.source === "/models/carnet-static/:file*");
		expect(rule?.headers).toContainEqual({
			key: "Cache-Control",
			value: "public, max-age=31536000, immutable",
		});
	});
});
```

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `pnpm test lib/carnet/engine.test.ts next.config.test.ts`
Expected: FAIL (`./engine` introuvable ; `headers` indéfini).

- [ ] **Step 3: Implémenter**

`lib/carnet/engine.ts` :

```ts
import { type Scored, semanticRank } from "./search";
import {
	createStaticModel,
	embedText,
	type StaticModel,
	type StaticModelMeta,
} from "./static-model";

export const MODEL_BASE_URL = "/models/carnet-static";

export type FetchLike = (url: string) => Promise<{
	ok: boolean;
	status: number;
	json(): Promise<unknown>;
	arrayBuffer(): Promise<ArrayBuffer>;
}>;

export function modelUrl(base: string, file: string, version: string): string {
	return `${base}/${file}?v=${version}`;
}

export function versionOf(mapModel: string): string {
	const at = mapModel.lastIndexOf("@");
	return at >= 0 ? mapModel.slice(at + 1) : mapModel;
}

export async function loadStaticModel(
	base: string,
	version: string,
	fetchFn: FetchLike,
): Promise<StaticModel> {
	const get = async (file: string) => {
		const res = await fetchFn(modelUrl(base, file, version));
		if (!res.ok) throw new Error(`${file} : HTTP ${res.status}`);
		return res;
	};
	const [metaRes, vocabRes, vectorsRes, scalesRes] = await Promise.all(
		["meta.json", "vocab.json", "vectors.i8", "scales.f32"].map(get),
	);
	const meta = (await metaRes.json()) as StaticModelMeta;
	if (meta.version !== version)
		throw new Error(`modèle ${meta.version} ≠ carte ${version}`);
	const words = (await vocabRes.json()) as string[];
	const vectors = new Int8Array(await vectorsRes.arrayBuffer());
	const scales = new Float32Array(await scalesRes.arrayBuffer());
	return createStaticModel(meta, words, vectors, scales);
}

export interface SearchEngine {
	query(text: string): Scored[] | null;
}

export function createSearchEngine(
	model: StaticModel,
	items: { id: string; vector: number[] }[],
): SearchEngine {
	return {
		query(text) {
			const vector = embedText(model, text);
			return vector ? semanticRank(vector, items) : null;
		},
	};
}
```

`lib/carnet/worker-protocol.ts` :

```ts
import type { Scored } from "./search";

export type WorkerRequest =
	| { type: "init" }
	| { type: "query"; seq: number; text: string };

export type WorkerResponse =
	| { type: "ready" }
	| { type: "error"; message: string }
	| { type: "result"; seq: number; ranked: Scored[] | null };
```

`lib/carnet/carnet.worker.ts` (adaptateur sans logique propre ; les vecteurs de la carte sont importés ici, donc chargés seulement avec le Worker) :

```ts
import mapJson from "@/content/map.json";
import {
	createSearchEngine,
	loadStaticModel,
	MODEL_BASE_URL,
	type SearchEngine,
	versionOf,
} from "./engine";
import type { WorkerRequest, WorkerResponse } from "./worker-protocol";

const scope = self as unknown as {
	postMessage(message: WorkerResponse): void;
	onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
};

let engine: Promise<SearchEngine> | null = null;

scope.onmessage = (event) => {
	const message = event.data;
	if (message.type === "init") {
		engine ??= loadStaticModel(MODEL_BASE_URL, versionOf(mapJson.model), (url) =>
			fetch(url),
		).then((model) => createSearchEngine(model, mapJson.items));
		engine.then(
			() => scope.postMessage({ type: "ready" }),
			(error: unknown) =>
				scope.postMessage({
					type: "error",
					message: error instanceof Error ? error.message : String(error),
				}),
		);
		return;
	}
	if (message.type === "query" && engine) {
		engine.then(
			(e) =>
				scope.postMessage({
					type: "result",
					seq: message.seq,
					ranked: e.query(message.text),
				}),
			() => {},
		);
	}
};
```

`next.config.ts` :

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				// Les URL portent ?v=<version du modèle> (lib/carnet/engine.ts) : cache immuable sans risque.
				source: "/models/carnet-static/:file*",
				headers: [
					{ key: "Cache-Control", value: "public, max-age=31536000, immutable" },
				],
			},
		];
	},
};

export default nextConfig;
```

- [ ] **Step 4: Lancer les tests et le build**

Run: `pnpm test` puis `pnpm exec biome check --write` puis `pnpm lint` puis `pnpm build`
Expected: PASS ; build OK (le Worker n'est encore référencé par aucune page : seule la vérification de types le couvre ici).

- [ ] **Step 5: Commit**

```bash
git add lib/carnet/engine.ts lib/carnet/engine.test.ts lib/carnet/worker-protocol.ts lib/carnet/carnet.worker.ts next.config.ts next.config.test.ts
git commit -m "feat(carnet): chargement versionné du modèle, moteur sémantique et Web Worker"
```

---

### Task 5: Rendu de la carte (SVG serveur, légende, liste équivalente, entrée orchestrée)

**Files:**
- Create: `lib/carnet/map-view.ts`, `lib/carnet/map-view.test.ts`
- Create: `components/carnet/MapSvg.tsx`, `components/carnet/MapLegend.tsx`, `components/carnet/MapItemList.tsx`, `components/carnet/map.test.tsx`
- Modify: `app/globals.css` (tokens `--cluster-1`…`--cluster-5` clair et sombre ; classes et keyframes de la carte)
- Modify: `lib/theme-tokens.test.ts`

**Interfaces:**
- Consumes: `MapData`, `MapItem` (`lib/carnet/map-types.ts`, avec `terms` de la tâche 2) ; `SearchItem` (tâche 3) ; `clusterLabels` (`content/map-clusters.ts`).
- Produces:
  - `interface MapPoint { id: string; kind: "article" | "project"; title: string; href: string; x: number; y: number; cluster: number }` (`cluster` = rang 1…5 du groupe dans `map.clusters`)
  - `interface MapCluster { id: string; label: string; index: number; count: number }`
  - `toMapView(map: MapData, labels: Record<string, string>): { points: MapPoint[]; clusters: MapCluster[] }` (aucun vecteur)
  - `toSearchItems(map: MapData): SearchItem[]`
  - `toPercent(v: number): number` → `6 + v * 88` (coordonnée dans le `viewBox` 0–100 et en % pour l'info-bulle)
  - `<MapSvg points highlighted? queryPoint? activeId? onHover? onSelect? />`
  - `<MapLegend clusters />`
  - `<MapItemList points onFocusItem? />`

- [ ] **Step 1: Écrire les tests qui échouent**

`lib/carnet/map-view.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import type { MapData } from "./map-types";
import { toMapView, toPercent, toSearchItems } from "./map-view";

const map: MapData = {
	model: "carnet-static@x",
	generatedAt: "2026-10-07T00:00:00Z",
	clusters: [
		{ id: "c1", label: "auto 1" },
		{ id: "c2", label: "auto 2" },
	],
	items: [
		{ id: "article:a", kind: "article", title: "A", href: "/articles/a", x: 0, y: 1, cluster: "c2", keywords: ["llm"], terms: ["alpha"], vector: [1, 0] },
		{ id: "project:1", kind: "project", title: "P", href: "https://github.com/x/p", x: 0.5, y: 0.5, cluster: "c1", keywords: ["python"], terms: ["pi"], vector: [0, 1] },
	],
};

describe("toMapView", () => {
	it("numérote les groupes dans l'ordre de la carte et applique les noms manuels", () => {
		const view = toMapView(map, { c1: "Data science" });
		expect(view.clusters).toEqual([
			{ id: "c1", label: "Data science", index: 1, count: 1 },
			{ id: "c2", label: "auto 2", index: 2, count: 1 },
		]);
		expect(view.points[0]).toEqual({
			id: "article:a", kind: "article", title: "A", href: "/articles/a", x: 0, y: 1, cluster: 2,
		});
	});

	it("n'expose aucun vecteur aux composants", () => {
		expect(JSON.stringify(toMapView(map, {}))).not.toContain("vector");
	});
});

describe("toSearchItems", () => {
	it("garde id, titre, mots-clés et termes", () => {
		expect(toSearchItems(map)[1]).toEqual({ id: "project:1", title: "P", keywords: ["python"], terms: ["pi"] });
	});
});

describe("toPercent", () => {
	it("laisse une marge de 6 % autour de la carte", () => {
		expect(toPercent(0)).toBe(6);
		expect(toPercent(1)).toBe(94);
	});
});
```

`components/carnet/map.test.tsx` :

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { MapCluster, MapPoint } from "@/lib/carnet/map-view";
import MapItemList from "./MapItemList";
import MapLegend from "./MapLegend";
import MapSvg from "./MapSvg";

const points: MapPoint[] = [
	{ id: "article:a", kind: "article", title: "Neuf agents", href: "/articles/a", x: 0, y: 0, cluster: 1 },
	{ id: "project:1", kind: "project", title: "Fashion", href: "https://github.com/x/f", x: 1, y: 1, cluster: 2 },
	{ id: "project:2", kind: "project", title: "Syntheo", href: "https://github.com/x/s", x: 0.5, y: 0.5, cluster: 2 },
];
const clusters: MapCluster[] = [
	{ id: "c1", label: "Agents et SRE", index: 1, count: 1 },
	{ id: "c2", label: "Data science", index: 2, count: 2 },
];

describe("MapSvg", () => {
	it("est une image décrite : carrés pour les articles, ronds pour les projets", () => {
		const html = renderToStaticMarkup(<MapSvg points={points} />);
		expect(html).toContain('role="img"');
		expect(html).toContain("<title");
		expect(html).toContain("<desc");
		expect(html.match(/<rect[^>]*carnet-point/g)?.length).toBe(1);
		expect(html.match(/<circle[^>]*carnet-point/g)?.length).toBe(2);
	});

	it("place les points avec la marge de 6 % et décale l'entrée par groupe", () => {
		const html = renderToStaticMarkup(<MapSvg points={points} />);
		expect(html).toContain('cx="94"');
		expect(html).toContain("--i:1");
	});

	it("allume les résultats et pose le point de la requête", () => {
		const html = renderToStaticMarkup(
			<MapSvg points={points} highlighted={new Set(["project:1"])} queryPoint={{ x: 0.5, y: 0.25 }} />,
		);
		expect(html.match(/data-hit="true"/g)?.length).toBe(1);
		expect(html).toContain("carnet-query");
	});

	it("n'a pas de point de requête au repos et ne cache rien", () => {
		const html = renderToStaticMarkup(<MapSvg points={points} />);
		expect(html).not.toContain("carnet-query");
		expect(html).not.toContain("opacity:0");
	});

	it("garde les liens des points hors de l'ordre de tabulation", () => {
		const html = renderToStaticMarkup(<MapSvg points={points} />);
		expect(html).toContain('href="/articles/a"');
		expect(html.match(/tabindex="-1"/g)?.length).toBe(3);
	});
});

describe("MapLegend", () => {
	it("liste les groupes avec leur teinte et leur effectif", () => {
		const html = renderToStaticMarkup(<MapLegend clusters={clusters} />);
		expect(html).toContain("Agents et SRE");
		expect(html).toContain("var(--cluster-2)");
		expect(html).toContain("font-mono");
	});
});

describe("MapItemList", () => {
	it("double la carte par des liens navigables au clavier", () => {
		const html = renderToStaticMarkup(<MapItemList points={points} />);
		expect(html).toContain("<details");
		expect(html).toContain("Les 3 éléments de la carte");
		expect(html).toContain('href="/articles/a"');
		expect(html).toContain('target="_blank"');
		expect(html).toContain('rel="noopener noreferrer"');
	});
});
```

Ajouter à `lib/theme-tokens.test.ts` :

```ts
	it("définit cinq teintes de groupe en clair et en sombre", () => {
		for (let i = 1; i <= 5; i++)
			expect(css.match(new RegExp(`--cluster-${i}:`, "g"))?.length).toBe(2);
	});

	it("neutralise toute animation de la carte en mouvement réduit", () => {
		expect(css).toMatch(
			/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.carnet-axis,\s*\.carnet-point,\s*\.carnet-query\s*\{\s*animation: none;/,
		);
	});
```

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `pnpm test lib/carnet/map-view.test.ts components/carnet lib/theme-tokens.test.ts`
Expected: FAIL (modules introuvables, tokens absents).

- [ ] **Step 3: Implémenter `lib/carnet/map-view.ts`**

```ts
import type { MapData } from "./map-types";
import type { SearchItem } from "./search";

export interface MapPoint {
	id: string;
	kind: "article" | "project";
	title: string;
	href: string;
	x: number;
	y: number;
	cluster: number;
}

export interface MapCluster {
	id: string;
	label: string;
	index: number;
	count: number;
}

/** Coordonnée [0, 1] → viewBox 0–100 avec 6 % de marge (aussi utilisée en % pour l'info-bulle). */
export function toPercent(v: number): number {
	return 6 + v * 88;
}

export function toMapView(
	map: MapData,
	labels: Record<string, string>,
): { points: MapPoint[]; clusters: MapCluster[] } {
	const index = new Map(map.clusters.map((c, i) => [c.id, i + 1]));
	const points = map.items.map((item) => ({
		id: item.id,
		kind: item.kind,
		title: item.title,
		href: item.href,
		x: item.x,
		y: item.y,
		cluster: index.get(item.cluster) ?? 1,
	}));
	const clusters = map.clusters.map((c, i) => ({
		id: c.id,
		label: labels[c.id] ?? c.label,
		index: i + 1,
		count: map.items.filter((item) => item.cluster === c.id).length,
	}));
	return { points, clusters };
}

export function toSearchItems(map: MapData): SearchItem[] {
	return map.items.map((item) => ({
		id: item.id,
		title: item.title,
		keywords: item.keywords,
		terms: item.terms,
	}));
}
```

- [ ] **Step 4: Implémenter les composants**

`components/carnet/MapSvg.tsx` (sans `"use client"` : composant pur, réutilisé par l'îlot) :

```tsx
import type { CSSProperties } from "react";
import { type MapPoint, toPercent } from "@/lib/carnet/map-view";

interface MapSvgProps {
	points: MapPoint[];
	highlighted?: ReadonlySet<string>;
	queryPoint?: { x: number; y: number } | null;
	activeId?: string | null;
	onHover?: (id: string | null) => void;
}

const isExternal = (href: string) => href.startsWith("http");

/** Fig. 1 : carte des projets (ronds) et articles (carrés). Rendue côté serveur. */
export default function MapSvg({
	points,
	highlighted,
	queryPoint,
	activeId,
	onHover,
}: Readonly<MapSvgProps>) {
	return (
		<svg
			viewBox="0 0 100 100"
			role="img"
			aria-labelledby="carnet-map-title carnet-map-desc"
			className="h-full w-full overflow-visible text-ink-soft"
		>
			<title id="carnet-map-title">Carte de mes projets et articles</title>
			<desc id="carnet-map-desc">
				{`${points.length} éléments placés selon la proximité de leur sujet, calculée par un modèle d'embeddings. La liste des éléments sous la carte en donne l'équivalent.`}
			</desc>
			<path className="carnet-axis" d="M4 96 H98" pathLength={1} stroke="currentColor" strokeWidth={0.3} fill="none" />
			<path className="carnet-axis" d="M4 96 V2" pathLength={1} stroke="currentColor" strokeWidth={0.3} fill="none" />
			{points.map((p) => {
				const cx = toPercent(p.x);
				const cy = toPercent(p.y);
				const hit = highlighted?.has(p.id) ?? false;
				const style = {
					"--i": p.cluster - 1,
					fill: `var(--cluster-${p.cluster})`,
				} as CSSProperties;
				const common = {
					className: "carnet-point",
					"data-hit": hit ? "true" : undefined,
					"data-active": activeId === p.id ? "true" : undefined,
					style,
				};
				return (
					<a
						key={p.id}
						href={p.href}
						tabIndex={-1}
						target={isExternal(p.href) ? "_blank" : undefined}
						rel={isExternal(p.href) ? "noopener noreferrer" : undefined}
						onPointerEnter={onHover ? () => onHover(p.id) : undefined}
						onPointerLeave={onHover ? () => onHover(null) : undefined}
					>
						{p.kind === "article" ? (
							<rect {...common} x={cx - 1.6} y={cy - 1.6} width={3.2} height={3.2} />
						) : (
							<circle {...common} cx={cx} cy={cy} r={1.7} />
						)}
					</a>
				);
			})}
			{queryPoint ? (
				<g className="carnet-query" aria-hidden="true">
					<circle cx={toPercent(queryPoint.x)} cy={toPercent(queryPoint.y)} r={3.2} fill="none" stroke="var(--primary)" strokeWidth={0.4} strokeDasharray="1 1" />
					<circle cx={toPercent(queryPoint.x)} cy={toPercent(queryPoint.y)} r={1.3} fill="var(--primary)" />
				</g>
			) : null}
		</svg>
	);
}
```

Si `renderToStaticMarkup` sérialise `style` avec un espace (`--i: 1`), adapter l'attendu du test en conséquence (`--i:1` ou `--i: 1`), sans changer le composant.

`components/carnet/MapLegend.tsx` :

```tsx
import type { MapCluster } from "@/lib/carnet/map-view";

/** Légende des groupes : teinte d'encre + nom en Fira Code (les groupes ne sont pas contigus sur la carte). */
export default function MapLegend({ clusters }: Readonly<{ clusters: MapCluster[] }>) {
	return (
		<ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-ink-soft">
			{clusters.map((c) => (
				<li key={c.id} className="flex items-center gap-1.5">
					<span aria-hidden="true" className="inline-block size-2.5 rounded-full" style={{ background: `var(--cluster-${c.index})` }} />
					{c.label} <span className="opacity-70">({c.count})</span>
				</li>
			))}
		</ul>
	);
}
```

`components/carnet/MapItemList.tsx` :

```tsx
import type { MapPoint } from "@/lib/carnet/map-view";

interface MapItemListProps {
	points: MapPoint[];
	onFocusItem?: (id: string | null) => void;
}

const isExternal = (href: string) => href.startsWith("http");

/** Équivalent textuel et clavier de la carte (spec §7.5). */
export default function MapItemList({ points, onFocusItem }: Readonly<MapItemListProps>) {
	const sorted = [...points].sort((a, b) => a.title.localeCompare(b.title, "fr"));
	return (
		<details className="mt-4 text-sm">
			<summary className="cursor-pointer font-mono text-xs text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
				Les {points.length} éléments de la carte
			</summary>
			<ul className="mt-2 grid gap-1 sm:grid-cols-2">
				{sorted.map((p) => (
					<li key={p.id}>
						<a
							href={p.href}
							target={isExternal(p.href) ? "_blank" : undefined}
							rel={isExternal(p.href) ? "noopener noreferrer" : undefined}
							className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							onFocus={onFocusItem ? () => onFocusItem(p.id) : undefined}
							onBlur={onFocusItem ? () => onFocusItem(null) : undefined}
							onMouseEnter={onFocusItem ? () => onFocusItem(p.id) : undefined}
							onMouseLeave={onFocusItem ? () => onFocusItem(null) : undefined}
						>
							{p.title}
							<span className="ml-1 font-mono text-[11px] text-ink-soft">
								{p.kind === "article" ? "article" : "projet"}
							</span>
						</a>
					</li>
				))}
			</ul>
		</details>
	);
}
```

- [ ] **Step 5: Tokens et animation CSS**

`app/globals.css` — dans le bloc des tokens clairs (là où sont `--paper-grid`, `--ink-soft`, `--note` clairs) :

```css
  --cluster-1: oklch(0.5 0.13 270);
  --cluster-2: oklch(0.52 0.1 200);
  --cluster-3: oklch(0.55 0.12 150);
  --cluster-4: oklch(0.55 0.13 60);
  --cluster-5: oklch(0.52 0.14 15);
```

et dans le bloc `.dark` :

```css
  --cluster-1: oklch(0.75 0.13 270);
  --cluster-2: oklch(0.78 0.1 200);
  --cluster-3: oklch(0.8 0.12 150);
  --cluster-4: oklch(0.8 0.12 70);
  --cluster-5: oklch(0.76 0.13 20);
```

Ces teintes doivent atteindre 3:1 sur `--background` dans chaque thème (contraste des éléments graphiques, WCAG 1.4.11) : le vérifier en calculant le contraste à partir des valeurs oklch (convertir en sRGB, luminance relative) et ajuster la luminosité L si besoin ; consigner les ratios dans le rapport.

Dans `@layer components`, après `.paper::before` :

```css
  /* Fig. 1 (spec §5.3) : les axes se tracent, puis les points arrivent groupe par groupe (~1,2 s),
     puis respirent. Animation CSS minutée, sans observateur ; rien en mouvement réduit. */
  .carnet-axis {
    stroke-dasharray: 1;
    animation: carnet-draw 0.6s cubic-bezier(0.65, 0, 0.35, 1) both;
  }
  .carnet-point {
    transform-box: fill-box;
    transform-origin: center;
    transition: fill 0.2s, transform 0.2s;
    animation:
      carnet-pop 0.3s ease-out backwards calc(0.6s + var(--i, 0) * 0.08s),
      carnet-breathe 6s ease-in-out calc(1.2s + var(--i, 0) * 0.5s) infinite;
  }
  .carnet-point[data-hit="true"],
  .carnet-point[data-active="true"] {
    fill: var(--primary) !important;
    transform: scale(1.35);
  }
  .carnet-query {
    animation: carnet-pop 0.25s ease-out backwards;
  }
  @keyframes carnet-draw {
    from { stroke-dashoffset: 1; }
    to { stroke-dashoffset: 0; }
  }
  @keyframes carnet-pop {
    from { opacity: 0; transform: scale(0.4); }
  }
  @keyframes carnet-breathe {
    50% { opacity: 0.8; }
  }
  @media (prefers-reduced-motion: reduce) {
    .carnet-axis,
    .carnet-point,
    .carnet-query {
      animation: none;
      transition: none;
    }
  }
```

(`!important` est nécessaire car la teinte du groupe est posée en `style` inline.)

- [ ] **Step 6: Lancer les tests, vérifier le succès**

Run: `pnpm test` puis `pnpm exec biome check --write` puis `pnpm lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/carnet/map-view.ts lib/carnet/map-view.test.ts components/carnet app/globals.css lib/theme-tokens.test.ts
git commit -m "feat(carnet): carte SVG serveur, légende, liste équivalente et entrée orchestrée"
```

---

### Task 6: État de l'explorateur et îlot client `CarnetExplorer`

**Files:**
- Create: `lib/carnet/explorer.ts`, `lib/carnet/explorer.test.ts`
- Create: `components/carnet/CarnetExplorer.tsx`, `components/carnet/explorer.test.tsx`

**Interfaces:**
- Consumes: `keywordMatches`, `placeQuery`, `formatScore`, `SearchItem`, `Scored` (tâche 3) ; `WorkerRequest`, `WorkerResponse` (tâche 4) ; `MapPoint`, `MapCluster`, `toPercent` (tâche 5) ; `MapSvg`, `MapLegend`, `MapItemList` (tâche 5) ; `FigureCaption` (L1) ; `tokenize` (`lib/carnet/tokenize.ts`).
- Produces:
  - `type EngineStatus = "idle" | "loading" | "ready" | "failed"`
  - `interface ExplorerState { query: string; seq: number; status: EngineStatus; semantic: { seq: number; ranked: Scored[] | null } | null }`
  - `type ExplorerAction = { type: "activate" } | { type: "ready" } | { type: "failed" } | { type: "input"; query: string } | { type: "result"; seq: number; ranked: Scored[] | null }`
  - `initialExplorerState`, `explorerReducer(state, action): ExplorerState`
  - `interface ExplorerView { mode: "rest" | "keyword" | "semantic"; hits: Set<string>; results: { id: string; score: number | null }[]; queryPoint: { x: number; y: number } | null }`
  - `computeView(state: ExplorerState, items: SearchItem[], positions: ReadonlyMap<string, { x: number; y: number }>): ExplorerView`
  - `<CarnetExplorer points clusters searchItems intro note />` (`intro`, `note` : `ReactNode` rendus dans la colonne gauche)

- [ ] **Step 1: Écrire les tests qui échouent**

`lib/carnet/explorer.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import {
	computeView,
	type ExplorerState,
	explorerReducer,
	initialExplorerState,
} from "./explorer";
import type { SearchItem } from "./search";

const items: SearchItem[] = [
	{ id: "a", title: "Agents", keywords: ["agents autonomes"], terms: ["agents", "flotte"] },
	{ id: "b", title: "Vision", keywords: ["python"], terms: ["vision"] },
	{ id: "c", title: "Web", keywords: ["typescript"], terms: ["site"] },
	{ id: "d", title: "Data", keywords: ["python"], terms: ["donnees"] },
];
const positions = new Map([
	["a", { x: 0, y: 0 }],
	["b", { x: 1, y: 0 }],
	["c", { x: 0, y: 1 }],
	["d", { x: 1, y: 1 }],
]);
const typed = (state: ExplorerState, query: string) =>
	explorerReducer(state, { type: "input", query });

describe("explorerReducer", () => {
	it("n'active le chargement qu'une fois", () => {
		const loading = explorerReducer(initialExplorerState, { type: "activate" });
		expect(loading.status).toBe("loading");
		const ready = explorerReducer(loading, { type: "ready" });
		expect(explorerReducer(ready, { type: "activate" }).status).toBe("ready");
	});

	it("numérote chaque saisie et oublie le résultat précédent", () => {
		const s1 = typed(initialExplorerState, "agents");
		const s2 = explorerReducer(s1, { type: "result", seq: s1.seq, ranked: [] });
		const s3 = typed(s2, "vision");
		expect(s3.seq).toBe(s1.seq + 1);
		expect(s3.semantic).toBeNull();
	});

	it("ignore une réponse périmée (frappe rapide)", () => {
		const s1 = typed(initialExplorerState, "age");
		const s2 = typed(s1, "agents");
		const late = explorerReducer(s2, { type: "result", seq: s1.seq, ranked: [{ id: "c", score: 1 }] });
		expect(late.semantic).toBeNull();
	});
});

describe("computeView", () => {
	const ready = explorerReducer(
		explorerReducer(initialExplorerState, { type: "activate" }),
		{ type: "ready" },
	);

	it("reste au repos pour une saisie vide, d'une lettre ou de ponctuation", () => {
		for (const q of ["", "   ", "a", "?!"]) {
			const view = computeView(typed(ready, q), items, positions);
			expect(view).toEqual({ mode: "rest", hits: new Set(), results: [], queryPoint: null });
		}
	});

	it("cherche par mots-clés tant que le modèle n'est pas prêt", () => {
		const view = computeView(typed(initialExplorerState, "python"), items, positions);
		expect(view.mode).toBe("keyword");
		expect([...view.hits].sort()).toEqual(["b", "d"]);
		expect(view.results.every((r) => r.score === null)).toBe(true);
		expect(view.queryPoint).toBeNull();
	});

	it("passe en sémantique quand le modèle répond : 3 résultats, scores, point posé", () => {
		const s = typed(ready, "agents");
		const done = explorerReducer(s, {
			type: "result",
			seq: s.seq,
			ranked: [
				{ id: "a", score: 0.9 },
				{ id: "b", score: 0.5 },
				{ id: "c", score: 0.3 },
				{ id: "d", score: 0.1 },
			],
		});
		const view = computeView(done, items, positions);
		expect(view.mode).toBe("semantic");
		expect(view.results).toEqual([
			{ id: "a", score: 0.9 },
			{ id: "b", score: 0.5 },
			{ id: "c", score: 0.3 },
		]);
		expect([...view.hits]).toEqual(["a", "b", "c"]);
		expect(view.queryPoint?.x).toBeGreaterThan(0);
	});

	it("retombe sur les mots-clés quand aucun mot n'est connu du modèle (ranked null)", () => {
		const s = typed(ready, "agents");
		const done = explorerReducer(s, { type: "result", seq: s.seq, ranked: null });
		expect(computeView(done, items, positions).mode).toBe("keyword");
	});

	it("reste en mots-clés si le modèle n'a pas pu être chargé", () => {
		const failed = explorerReducer(
			explorerReducer(initialExplorerState, { type: "activate" }),
			{ type: "failed" },
		);
		expect(computeView(typed(failed, "vision"), items, positions).mode).toBe("keyword");
	});
});
```

`components/carnet/explorer.test.tsx` :

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { MapCluster, MapPoint } from "@/lib/carnet/map-view";
import CarnetExplorer from "./CarnetExplorer";

const points: MapPoint[] = [
	{ id: "article:a", kind: "article", title: "Neuf agents", href: "/articles/a", x: 0.2, y: 0.3, cluster: 1 },
];
const clusters: MapCluster[] = [{ id: "c1", label: "Agents et SRE", index: 1, count: 1 }];

describe("CarnetExplorer (rendu serveur)", () => {
	const html = renderToStaticMarkup(
		<CarnetExplorer
			points={points}
			clusters={clusters}
			searchItems={[{ id: "article:a", title: "Neuf agents", keywords: [], terms: ["agents"] }]}
			intro={<h1>Carnet de labo</h1>}
			note={<p>essaie</p>}
		/>,
	);

	it("rend la présentation, un champ étiqueté et la carte dès le HTML", () => {
		expect(html).toContain("<h1>Carnet de labo</h1>");
		expect(html).toContain('placeholder="Décris un sujet : vision, LLM local, agents…"');
		expect(html).toMatch(/<label[^>]*for="carnet-query"/);
		expect(html).toContain('role="img"');
		expect(html).toContain("Fig. 1 · ");
	});

	it("prépare une région annoncée, vide au repos, sans mention sémantique", () => {
		expect(html).toContain('aria-live="polite"');
		expect(html).not.toContain("recherche sémantique active");
		expect(html).not.toContain("carnet-query");
	});
});
```

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `pnpm test lib/carnet/explorer.test.ts components/carnet/explorer.test.tsx`
Expected: FAIL (modules introuvables).

- [ ] **Step 3: Implémenter `lib/carnet/explorer.ts`**

```ts
import { keywordMatches, placeQuery, type Scored, type SearchItem } from "./search";
import { tokenize } from "./tokenize";

export type EngineStatus = "idle" | "loading" | "ready" | "failed";

export interface ExplorerState {
	query: string;
	seq: number;
	status: EngineStatus;
	semantic: { seq: number; ranked: Scored[] | null } | null;
}

export type ExplorerAction =
	| { type: "activate" }
	| { type: "ready" }
	| { type: "failed" }
	| { type: "input"; query: string }
	| { type: "result"; seq: number; ranked: Scored[] | null };

export const initialExplorerState: ExplorerState = {
	query: "",
	seq: 0,
	status: "idle",
	semantic: null,
};

export function explorerReducer(
	state: ExplorerState,
	action: ExplorerAction,
): ExplorerState {
	switch (action.type) {
		case "activate":
			return state.status === "idle" ? { ...state, status: "loading" } : state;
		case "ready":
			return { ...state, status: "ready" };
		case "failed":
			return { ...state, status: "failed" };
		case "input":
			return { ...state, query: action.query, seq: state.seq + 1, semantic: null };
		case "result":
			return action.seq === state.seq
				? { ...state, semantic: { seq: action.seq, ranked: action.ranked } }
				: state;
	}
}

export interface ExplorerView {
	mode: "rest" | "keyword" | "semantic";
	hits: Set<string>;
	results: { id: string; score: number | null }[];
	queryPoint: { x: number; y: number } | null;
}

export function computeView(
	state: ExplorerState,
	items: SearchItem[],
	positions: ReadonlyMap<string, { x: number; y: number }>,
): ExplorerView {
	if (tokenize(state.query).length === 0)
		return { mode: "rest", hits: new Set(), results: [], queryPoint: null };
	const ranked = state.semantic?.ranked;
	if (state.status === "ready" && ranked && ranked.length > 0) {
		const top = ranked.slice(0, 3);
		return {
			mode: "semantic",
			hits: new Set(top.map((r) => r.id)),
			results: top.map((r) => ({ id: r.id, score: r.score })),
			queryPoint: placeQuery(ranked, positions),
		};
	}
	const matches = keywordMatches(state.query, items);
	return {
		mode: "keyword",
		hits: new Set(matches.map((m) => m.id)),
		results: matches.slice(0, 3).map((m) => ({ id: m.id, score: null })),
		queryPoint: null,
	};
}
```

- [ ] **Step 4: Implémenter `components/carnet/CarnetExplorer.tsx`**

```tsx
"use client";

import {
	type ReactNode,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from "react";
import FigureCaption from "@/components/notebook/FigureCaption";
import {
	computeView,
	explorerReducer,
	initialExplorerState,
} from "@/lib/carnet/explorer";
import { type MapCluster, type MapPoint, toPercent } from "@/lib/carnet/map-view";
import { formatScore, type SearchItem } from "@/lib/carnet/search";
import type { WorkerRequest, WorkerResponse } from "@/lib/carnet/worker-protocol";
import MapItemList from "./MapItemList";
import MapLegend from "./MapLegend";
import MapSvg from "./MapSvg";

interface CarnetExplorerProps {
	points: MapPoint[];
	clusters: MapCluster[];
	searchItems: SearchItem[];
	intro: ReactNode;
	note: ReactNode;
}

const isExternal = (href: string) => href.startsWith("http");

/** Fig. 1 (spec §6.2, §7.4) : saisie, carte, résultats. Seul îlot client de l'accueil. */
export default function CarnetExplorer({
	points,
	clusters,
	searchItems,
	intro,
	note,
}: Readonly<CarnetExplorerProps>) {
	const [state, dispatch] = useReducer(explorerReducer, initialExplorerState);
	const [hoverId, setHoverId] = useState<string | null>(null);
	const workerRef = useRef<Worker | null>(null);

	const positions = useMemo(
		() => new Map(points.map((p) => [p.id, { x: p.x, y: p.y }])),
		[points],
	);
	const byId = useMemo(() => new Map(points.map((p) => [p.id, p])), [points]);
	const view = computeView(state, searchItems, positions);

	const send = (message: WorkerRequest) => workerRef.current?.postMessage(message);

	const activate = () => {
		if (workerRef.current || state.status !== "idle") return;
		dispatch({ type: "activate" });
		try {
			const worker = new Worker(
				new URL("../../lib/carnet/carnet.worker.ts", import.meta.url),
				{ type: "module" },
			);
			worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
				const message = event.data;
				if (message.type === "ready") dispatch({ type: "ready" });
				else if (message.type === "error") dispatch({ type: "failed" });
				else dispatch({ type: "result", seq: message.seq, ranked: message.ranked });
			};
			worker.onerror = () => dispatch({ type: "failed" });
			workerRef.current = worker;
			worker.postMessage({ type: "init" } satisfies WorkerRequest);
		} catch {
			dispatch({ type: "failed" });
		}
	};

	// Seul endroit qui interroge le Worker : à chaque saisie, et quand le modèle devient prêt.
	useEffect(() => {
		if (state.status === "ready" && state.query.trim())
			send({ type: "query", seq: state.seq, text: state.query });
	}, [state.status, state.seq, state.query]);

	useEffect(() => () => workerRef.current?.terminate(), []);

	const tooltip = hoverId ? byId.get(hoverId) : undefined;

	return (
		<div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
			<div className="relative">
				{intro}
				<label
					htmlFor="carnet-query"
					className="mt-8 block font-mono text-xs uppercase tracking-[0.14em] text-ink-soft"
				>
					Explorer le carnet
				</label>
				<input
					id="carnet-query"
					type="search"
					autoComplete="off"
					spellCheck={false}
					value={state.query}
					placeholder="Décris un sujet : vision, LLM local, agents…"
					onFocus={activate}
					onPointerEnter={activate}
					onChange={(event) => dispatch({ type: "input", query: event.target.value })}
					className="mt-2 w-full rounded-md border border-border bg-background/80 px-4 py-3 text-base shadow-sm placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				/>
				{note}
			</div>

			<figure className="relative m-0">
				<div
					className="relative mx-auto aspect-square w-full max-w-[560px]"
					onPointerDown={activate}
				>
					<MapSvg
						points={points}
						highlighted={view.hits}
						queryPoint={view.queryPoint}
						activeId={hoverId}
						onHover={setHoverId}
					/>
					{tooltip ? (
						<div
							className="pointer-events-none absolute z-10 max-w-[14rem] -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-sm border border-border bg-background px-2 py-1 font-mono text-[11px] leading-tight shadow-sm"
							style={{ left: `${toPercent(tooltip.x)}%`, top: `${toPercent(tooltip.y)}%` }}
						>
							<span className="block text-foreground">{tooltip.title}</span>
							<span className="text-ink-soft">
								{tooltip.kind === "article" ? "article" : "projet"}
							</span>
						</div>
					) : null}
				</div>
				<FigureCaption number={1}>Carte de mes projets et articles</FigureCaption>
				<MapLegend clusters={clusters} />

				<div aria-live="polite" className="mt-4 min-h-[5.5rem]">
					{view.mode !== "rest" && view.results.length === 0 ? (
						<p className="text-sm text-ink-soft">
							Aucun élément ne correspond. Essaie un autre mot.
						</p>
					) : null}
					{view.results.length > 0 ? (
						<ol className="space-y-1.5">
							{view.results.map((r) => {
								const p = byId.get(r.id);
								if (!p) return null;
								return (
									<li key={r.id} className="flex items-baseline gap-3">
										<span className="w-10 shrink-0 font-mono text-xs text-primary">
											{r.score === null ? "mot" : formatScore(r.score)}
										</span>
										<a
											href={p.href}
											target={isExternal(p.href) ? "_blank" : undefined}
											rel={isExternal(p.href) ? "noopener noreferrer" : undefined}
											className="min-w-0 truncate rounded-sm font-display font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										>
											{p.title}
										</a>
										<span className="shrink-0 font-mono text-[11px] text-ink-soft">
											{p.kind === "article" ? "article" : "projet"}
										</span>
									</li>
								);
							})}
						</ol>
					) : null}
				</div>
				{state.status === "ready" ? (
					<p className="mt-2 font-mono text-[11px] text-ink-soft">
						recherche sémantique active
					</p>
				) : null}
				<MapItemList points={points} onFocusItem={setHoverId} />
			</figure>
		</div>
	);
}
```

Notes pour l'implémenteur :
- La mention « recherche sémantique active » est hors de la région `aria-live` pour ne pas être annoncée à chaque frappe.
- `useEffect` dépend de `state.query` : biome peut signaler `send` comme dépendance manquante ; le déclarer à l'intérieur de l'effet (`workerRef.current?.postMessage(…)`) plutôt que d'ajouter un `biome-ignore`.
- Si Turbopack refuse `new URL("../../lib/carnet/carnet.worker.ts", import.meta.url)` au build, essayer `new URL("@/lib/carnet/carnet.worker.ts", import.meta.url)` ; consigner la forme retenue dans le rapport.

- [ ] **Step 5: Lancer les tests, vérifier le succès**

Run: `pnpm test` puis `pnpm exec biome check --write` puis `pnpm lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/carnet/explorer.ts lib/carnet/explorer.test.ts components/carnet/CarnetExplorer.tsx components/carnet/explorer.test.tsx
git commit -m "feat(carnet): explorateur de la Fig. 1 — mots-clés immédiats, sémantique dans un Worker"
```

---

### Task 7: Intégration à l'accueil et retrait de `HeroPrompt`

**Files:**
- Modify: `app/page.tsx` (devient composant serveur)
- Delete: `components/animation/HeroPrompt.tsx` (et le dossier `components/animation/` s'il devient vide)
- Modify: `components/Header/Header.tsx`, `components/Header/NavMenu.tsx` (retrait de `highlightContact` et `contactBtnRef`)
- Modify: `app/About/page.tsx`, `app/Contact/page.tsx`, `app/articles/layout.tsx` (appels à `<Header />` sans props ; retrait des `useRef` devenus inutiles)
- Test: `app/home.test.ts` (créer)

**Interfaces:**
- Consumes: `CarnetExplorer` (tâche 6) ; `toMapView`, `toSearchItems` (tâche 5) ; `MapDataSchema` ; `clusterLabels` ; `MarginNote` avec `inline` (tâche 1).
- Produces: `Header()` sans props ; `NavMenu()` sans props.

- [ ] **Step 1: Écrire le test qui échoue**

`app/home.test.ts` :

```ts
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) =>
	readFileSync(path.join(process.cwd(), file), "utf8");

describe("accueil L2", () => {
	it("est un composant serveur qui monte la Fig. 1", () => {
		const page = read("app/page.tsx");
		expect(page).not.toContain('"use client"');
		expect(page).toContain("CarnetExplorer");
	});

	it("a retiré l'animation du message vers Contact", () => {
		expect(existsSync(path.join(process.cwd(), "components/animation/HeroPrompt.tsx"))).toBe(false);
		for (const file of [
			"app/page.tsx",
			"components/Header/Header.tsx",
			"components/Header/NavMenu.tsx",
			"app/About/page.tsx",
			"app/Contact/page.tsx",
			"app/articles/layout.tsx",
		]) {
			expect(read(file)).not.toMatch(/HeroPrompt|highlightContact|contactBtnRef/);
		}
	});
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `pnpm test app/home.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

`app/page.tsx` (remplacement complet) :

```tsx
import CarnetExplorer from "@/components/carnet/CarnetExplorer";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import MarginNote from "@/components/notebook/MarginNote";
import ProjectGrid from "@/components/ProjectGrid/ProjectGrid";
import SkillsStack from "@/components/Skills/SkillsStack";
import { clusterLabels } from "@/content/map-clusters";
import mapJson from "@/content/map.json";
import { MapDataSchema } from "@/lib/carnet/map-types";
import { toMapView, toSearchItems } from "@/lib/carnet/map-view";

const map = MapDataSchema.parse(mapJson);
const view = toMapView(map, clusterLabels);
const searchItems = toSearchItems(map);

export default function Home() {
	return (
		<main className="relative flex min-h-screen flex-col">
			<div className="sticky top-0 z-50 w-full">
				<Header />
			</div>

			<section
				aria-labelledby="carnet-title"
				className="mx-auto w-full max-w-6xl px-4 pt-10 pb-16 sm:px-6 lg:pt-16"
			>
				<CarnetExplorer
					points={view.points}
					clusters={view.clusters}
					searchItems={searchItems}
					intro={
						<>
							<h1
								id="carnet-title"
								className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
							>
								Carnet de labo
							</h1>
							<p className="mt-4 max-w-prose text-lg leading-relaxed">
								William Derue, développeur IA en parcours AI Engineer. Ce
								carnet consigne mes expériences : modèles entraînés, agents,
								infrastructure.
							</p>
						</>
					}
					note={
						<MarginNote inline>
							essaie « vision », « agents » ou « LLM local » : la carte cherche
							avec un vrai modèle d'embeddings, dans ton navigateur
						</MarginNote>
					}
				/>
			</section>

			<hr />
			<div className="flex flex-col py-10">
				<h2 className="m-auto text-center text-2xl font-bold">
					Mes skills à travers les stacks
				</h2>
				<SkillsStack />
			</div>
			<section id="realisations" className="h-fit px-4 sm:px-8 lg:px-30">
				<ProjectGrid />
			</section>
			<Footer />
		</main>
	);
}
```

`components/Header/Header.tsx` : supprimer `HeaderProps` et les paramètres ; `export default function Header()` ; `<NavMenu />`.

`components/Header/NavMenu.tsx` : supprimer `NavMenuProps`, les paramètres, `isContact`, `ref={…}` et la branche `isContact && highlightContact && …` de `cn(…)`.

`app/About/page.tsx`, `app/Contact/page.tsx` : `<Header />` ; supprimer `const contactBtnRef = useRef…` et l'import `useRef` s'il n'est plus utilisé (attention : `app/Contact/page.tsx` peut utiliser `useRef` ailleurs — ne retirer que ce qui devient inutilisé ; si le fichier n'a plus besoin de `"use client"`, le laisser tel quel, hors périmètre).

`app/articles/layout.tsx` : `<Header />`.

Supprimer `components/animation/HeroPrompt.tsx` (`git rm`), puis le dossier s'il est vide.

- [ ] **Step 4: Lancer tests et build**

Run: `pnpm test` puis `pnpm exec biome check --write` puis `pnpm lint` puis `pnpm build`
Expected: PASS ; dans la sortie du build, `/` reste statique (`○`).

- [ ] **Step 5: Essai dans un navigateur réel**

Run: `pnpm start -p 3312` (en arrière-plan), puis avec les outils Playwright du MCP :
1. Ouvrir `http://localhost:3312/` à 1280×800 : la carte et la légende sont visibles, les points apparaissent groupe par groupe.
2. Taper `python` immédiatement (avant le chargement du modèle, si possible) : des points s'allument, la liste affiche « mot » à la place du score.
3. Attendre la mention « recherche sémantique active », taper `agents autonomes` : trois résultats avec un score « 0,xx », un point de requête à l'accent sur la carte.
4. Taper `zzqx` : message « Aucun élément ne correspond. Essaie un autre mot. »
5. Vider le champ : la carte revient au repos.
6. Console du navigateur : aucune erreur.
Arrêter le serveur. Consigner les observations dans le rapport.

- [ ] **Step 6: Commit**

```bash
git add -A app components lib
git commit -m "feat(accueil): ouverture Fig. 1 et retrait de HeroPrompt"
```

---

### Task 8: Vérification visuelle, mesures et PR

**Files:**
- Aucun fichier de code, sauf correctifs découverts pendant la vérification (chacun dans un commit `fix(…)` dédié, testé).

**Interfaces:**
- Consumes: la branche complète.

- [ ] **Step 1: Vérifications complètes**

Run: `pnpm test && pnpm exec biome check && pnpm lint && pnpm build`
Expected: tout PASS.

- [ ] **Step 2: Revue visuelle**

`pnpm start -p 3312`, puis captures Playwright de `/` à 390×844 et 1280×800, thème clair puis sombre (bouton de thème, ou `localStorage.theme`), plus une capture à 1280 en `prefers-reduced-motion: reduce` (`browser_emulate_media`). Enregistrer les captures dans le dossier de travail SDD du plan (pas dans le dépôt). Vérifier : rien ne déborde à 390 px (titres longs des résultats tronqués), la grille du papier reste visible, la note de marge est dans le flux, les teintes de groupes sont lisibles dans les deux thèmes, en mouvement réduit `getComputedStyle(document.querySelector(".carnet-point")).animationName === "none"`.

- [ ] **Step 3: Mesure 4G de la première réponse sémantique (spec §1, §7.2)**

Avec `browser_run_code_unsafe` (Playwright MCP), sur `http://localhost:3312/` :

```js
async (page) => {
	const client = await page.context().newCDPSession(page);
	await client.send("Network.enable");
	await client.send("Network.setCacheDisabled", { cacheDisabled: true });
	await client.send("Network.emulateNetworkConditions", {
		offline: false,
		latency: 150,
		downloadThroughput: (9 * 1024 * 1024) / 8,
		uploadThroughput: (9 * 1024 * 1024) / 8,
	});
	await page.goto("http://localhost:3312/", { waitUntil: "load" });
	const t0 = Date.now();
	await page.focus("#carnet-query");
	await page.getByText("recherche sémantique active").waitFor({ timeout: 15000 });
	const ready = Date.now() - t0;
	await page.fill("#carnet-query", "agents autonomes");
	await page.locator("[aria-live=polite] li").first().waitFor();
	const answered = Date.now() - t0;
	return { readyMs: ready, firstSemanticAnswerMs: answered };
}
```

Faire 3 passes ; seuil : médiane de `firstSemanticAnswerMs` ≤ 3000. Si le seuil n'est pas tenu, ne rien changer au modèle : consigner les chiffres et signaler (statut DONE_WITH_CONCERNS).

- [ ] **Step 4: Lighthouse**

La prévisualisation Vercel est protégée par Vercel Authentication. Mesurer en local : `pnpm start -p 3313` sur la branche et, dans un worktree temporaire de `origin/main`, `pnpm install --frozen-lockfile && pnpm build && pnpm start -p 3314` ; puis 3 passes chacun :

```bash
npx lighthouse http://localhost:3313/ --only-categories=performance --form-factor=mobile --chrome-flags="--headless" --quiet --output=json --output-path=./lh-l2-1.json
```

Relever la médiane du score de performance et du LCP pour la branche et pour `main`. Seuils de la spec : pas de régression face à `main`, LCP mobile < 2,5 s. Supprimer le worktree temporaire et arrêter les serveurs. Ne pas committer les JSON.

- [ ] **Step 5: Push et PR**

```bash
git push -u origin feat/v2-l2-fig1
gh pr create --base main --title "feat(carnet): L2 — Fig. 1, carte interactive et recherche sémantique dans le navigateur" --body-file <fichier>
```

Corps de PR (en français) : résumé de la livraison ; décisions (légende plutôt qu'étiquettes sur la carte, entrée orchestrée en CSS, Worker et cache immuable versionné, termes de recherche, noms des groupes) ; mesures (4G, Lighthouse branche et `main`, LCP, ratios de contraste des teintes) ; ce qui reste pour L3/L4 ; avertissement que la mesure Lighthouse est locale (prévisualisation protégée) et sera refaite en production après merge. Dernière ligne : `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

Ne pas merger.
