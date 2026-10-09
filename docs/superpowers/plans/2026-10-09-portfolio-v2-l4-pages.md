# Portfolio V2 — L4 « Articles, À propos, Contact » Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire entrer les pages Articles, À propos et Contact dans le carnet de labo :
- typographie de lecture ;
- entrées datées ;
- figures numérotées automatiquement et graphiques à l'encre sur grille ;
- notes de marge MDX `<Note>` ;
- « Sur la carte » en fin d'article ;
- chronologie d'À propos tracée à l'encre au fil du défilement ;
- Contact réhabillé en fiche (logique d'envoi inchangée).

Solder aussi les reports de L3.

**Architecture:**
- **Logique pure et testée :**
  - numérotation des figures : transformation de la source MDX avant compilation (`lib/articles/figures.ts`) ;
  - voisins sur la carte (`lib/carnet/neighbors.ts`) ;
  - données du parcours (`lib/about.ts`).
- **Composants serveur :** articles, « Sur la carte », chronologie et en-têtes de page. Contact reste un composant client pour son formulaire.
- **Animations :** CSS pur. Le tracé de la chronologie utilise `animation-timeline: view()` en amélioration progressive : sans support du navigateur, ou en mouvement réduit, la ligne est entièrement tracée.

**Tech Stack:** Next.js 16.1.4 (App Router, Turbopack), React 19.2, Tailwind CSS v4, next-mdx-remote 6 (`compileMDX`, RSC), Vitest 4 (environnement `node`, `renderToStaticMarkup`), Biome 2.3, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-07-portfolio-v2-carnet-de-labo-design.md`. Sections concernées : §4.3, §5, §8.2, §8.3, §8.4, §9, et la ligne « L4 » de la section 10.

**Base :** `main` à `75ce9f7` (L0 à L3 mergées). Worktree : `/home/will/dev-project/portfolio-l4`, branche `feat/v2-l4-pages`.

## Global Constraints

- **Dépendances :** aucune nouvelle dépendance npm.
- **Animations :**
  - pas de `framer-motion` sur les pages touchées : il sort d'About et de Contact ;
  - animations en CSS pur ;
  - contenu complet au repos : aucune `opacity:0` en attente d'un observateur ;
  - `prefers-reduced-motion: reduce` affiche l'état final, sans aucun mouvement.
- **Contenu :**
  - le texte des articles existants est inchangé : seul leur rendu change ;
  - le contenu du parcours est inchangé (PR #5 : diplôme RNCP 6 obtenu en juillet 2026, parcours AI Engineer RNCP 7 **en cours**, jamais présenté comme obtenu).
- **Formulaire de contact :** sa logique (`sendEmail`, validation zod, toasts) est inchangée.
- **Accessibilité :**
  - AA dans les deux thèmes, focus visible ;
  - hiérarchie de titres sans saut sur chaque page : un seul h1, puis h2, puis h3 ;
  - notes de marge lues comme du texte normal, préfixées « Note : » pour les lecteurs d'écran ;
  - figures décrites.
- **Rédaction :**
  - textes en français, avec accents et typographie française ;
  - dates en Fira Code.
- **Poids de l'accueil :**
  - le HTML de l'accueil reste sous 14 600 octets compressés (`gzip -6`), mesuré sur `.next/server/app/index.html` ;
  - une marge d'environ 2 Ko existe : ne pas la consommer sans raison.
- **Commits :**
  - avant chaque commit : `pnpm exec biome check --write`, tests verts et `pnpm exec tsc --noEmit` vide ;
  - message au style du dépôt, terminé par `Co-Authored-By: <le modèle qui a réellement écrit le commit> <noreply@anthropic.com>`.

## Review Focus

1. **Article sans figure, ou dont le slug manque dans `map.json`.** Aucun numéro orphelin ; la section « Sur la carte » est simplement omise (tâches 3 et 5).
2. **`<Note>` sur mobile et sous lecteur d'écran.** La note est dans le flux, lisible, et annoncée comme « Note : … » (tâche 4).
3. **Navigateur sans `animation-timeline` (Firefox, Safari ancien) et mouvement réduit.** La ligne de la chronologie est entièrement visible, aucune étape n'est masquée (tâche 6).
4. **Contact avec JavaScript lent ou en erreur.** Le formulaire reste soumissible (action serveur) et les erreurs de champ restent lisibles sans animation (tâche 7).
5. **Recherche dans le registre, frappe rapide.**
   - une seule requête après une pause d'environ 300 ms, pas une par touche ;
   - le champ garde son texte et son focus ;
   - « Réinitialiser » renvoie le focus au champ (tâche 1).

---

### Task 1: Reports de L3 — recherche du registre, données de recherche, focus

**Files:**
- Modify: `components/register/FilterBar.tsx`, `components/carnet/CarnetExplorer.tsx`, `lib/carnet/explorer.ts` (si besoin), `biome.json`, `package.json`
- Create: `lib/debounce.ts`, `lib/debounce.test.ts`
- Test: `lib/carnet/explorer.test.ts` (étendre)

**Interfaces:**
- Produces: `debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): ((...args: A) => void) & { cancel(): void; flush(): void }`

- [ ] **Step 1: Tests qui échouent**

`lib/debounce.test.ts` :

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debounce } from "./debounce";

describe("debounce", () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it("n'appelle qu'une fois, avec les derniers arguments, après la pause", () => {
		const fn = vi.fn();
		const d = debounce(fn, 300);
		d("a");
		d("ag");
		vi.advanceTimersByTime(299);
		expect(fn).not.toHaveBeenCalled();
		d("age");
		vi.advanceTimersByTime(300);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith("age");
	});

	it("peut être annulé ou exécuté immédiatement", () => {
		const fn = vi.fn();
		const d = debounce(fn, 300);
		d("x");
		d.cancel();
		vi.advanceTimersByTime(300);
		expect(fn).not.toHaveBeenCalled();
		d("y");
		d.flush();
		expect(fn).toHaveBeenCalledWith("y");
		vi.advanceTimersByTime(300);
		expect(fn).toHaveBeenCalledTimes(1);
	});
});
```

Si `computeView` (`lib/carnet/explorer.ts`) a besoin d'un nouvel état pour l'échec de chargement (voir step 3), ajouter le test correspondant : un état « échec de chargement des données de recherche » sans résultat sémantique reste `pending` et n'affiche pas « Aucun élément ne correspond ».

- [ ] **Step 2: Vérifier l'échec** — Run: `pnpm test lib/debounce.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implémenter**

`lib/debounce.ts` :

```ts
export function debounce<A extends unknown[]>(
	fn: (...args: A) => void,
	ms: number,
): ((...args: A) => void) & { cancel(): void; flush(): void } {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let pending: A | undefined;
	const run = () => {
		timer = undefined;
		if (pending) {
			const args = pending;
			pending = undefined;
			fn(...args);
		}
	};
	const debounced = (...args: A) => {
		pending = args;
		if (timer) clearTimeout(timer);
		timer = setTimeout(run, ms);
	};
	debounced.cancel = () => {
		if (timer) clearTimeout(timer);
		timer = undefined;
		pending = undefined;
	};
	debounced.flush = () => {
		if (timer) clearTimeout(timer);
		run();
	};
	return debounced;
}
```

`components/register/FilterBar.tsx` :
- **Texte de recherche en état local :** le champ « search » garde son texte dans un `useState`, initialisé depuis l'URL et resynchronisé quand le paramètre `search` de l'URL change de l'extérieur (Réinitialiser, navigation).
- **Mise à jour de l'URL différée :** `updateSearchParams("search", value)` passe par `debounce(…, 300)`, mémorisé avec `useMemo` ou `useRef`. Le timer est annulé au démontage.
- **Réinitialiser :**
  - annule le debounce ;
  - vide l'état local ;
  - remet le focus sur le champ de recherche (`ref`), parce que le bouton disparaît une fois les filtres vides.
- Les filtres par listes déroulantes restent immédiats.

`components/carnet/CarnetExplorer.tsx`, sur l'échec de `import("@/content/search-items.json")` :
- ne plus faire `setSearchItems([])` : laisser l'état « en attente » (aucun message « Aucun élément ») ;
- autoriser une nouvelle tentative au prochain focus du champ, avec un drapeau `searchItemsFailed` qui relance l'import dans `activate` même si le Worker est déjà lancé.

`biome.json` : ajouter `"!content/search-items.json"` à `files.includes`, à côté de `"!content/map.json"`.

`package.json` : ajouter le script `"carnet:search-items": "tsx scripts/carnet/build-search-items.ts"`.

- [ ] **Step 4: Vérifier**
  - Run: `pnpm test`, biome, lint, `pnpm exec tsc --noEmit`, `pnpm build` — Expected: PASS.
  - Essai navigateur :
    - démarrer `pnpm start -p 3330` et noter les PID du `sh -c next start` **et** de son enfant `next-server` ;
    - taper vite « python » dans la recherche du registre : une seule requête serveur (onglet réseau, ou compteur des requêtes POST `/`), le champ garde son focus ;
    - « Réinitialiser » : le focus revient au champ ;
    - arrêter les deux PID et vérifier que le port ne répond plus.

- [ ] **Step 5: Commit** — `git commit -m "fix(registre): recherche différée, focus après réinitialisation ; données de recherche relancées après échec"`

---

### Task 2: Typographie de lecture et liste des entrées

**Files:**
- Modify: `app/articles/articles.css`, `app/articles/page.tsx`, `app/articles/[slug]/page.tsx`, `components/home/LatestEntries.tsx`
- Test: `components/home/home-sections.test.tsx` (étendre), `app/articles/articles-pages.test.ts` (créer)

**Interfaces:**
- Produces: `LatestEntries` reçoit `showAllLink?: boolean` (défaut `true`) et `headingLevel?: 2 | 3` (défaut `3`).

- [ ] **Step 1: Tests qui échouent**

Ajouter à `components/home/home-sections.test.tsx` :

```tsx
	it("peut servir de liste complète : sans lien « Toutes les entrées », titres en h2", () => {
		const html = renderToStaticMarkup(
			<LatestEntries articles={[article("a", "2026-10-07")]} showAllLink={false} headingLevel={2} />,
		);
		expect(html).not.toContain('href="/articles"');
		expect(html).toContain("<h2");
		expect(html).not.toContain("<h3");
	});
```

`app/articles/articles-pages.test.ts` :

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (f: string) => readFileSync(path.join(process.cwd(), f), "utf8");

describe("pages articles (carnet)", () => {
	it("la liste réutilise les entrées datées de l'accueil", () => {
		expect(read("app/articles/page.tsx")).toContain("<LatestEntries");
	});

	it("la prose n'a plus de dégradé décoratif et lit en Source Serif", () => {
		const css = read("app/articles/articles.css");
		expect(css).not.toContain("linear-gradient");
		expect(css).toMatch(/\.article-prose\s*\{[^}]*font-family:\s*var\(--font-serif\)/);
	});

	it("la date de l'article est en Fira Code", () => {
		expect(read("app/articles/[slug]/page.tsx")).toMatch(/<time[^>]*font-mono|font-mono[^>]*>\s*<time/);
	});
});
```

(Adapter la dernière expression régulière à la forme réellement écrite, sans affaiblir l'intention : la date de l'en-tête d'article est rendue dans un élément `font-mono`.)

- [ ] **Step 2: Vérifier l'échec** — Run: `pnpm test components/home app/articles` — Expected: FAIL.

- [ ] **Step 3: Implémenter**

`components/home/LatestEntries.tsx` :
- `showAllLink` conditionne le lien « Toutes les entrées → » ;
- `headingLevel` choisit `h2` ou `h3` pour le titre de chaque entrée ;
- utiliser un composant de titre dynamique, `const Heading = headingLevel === 2 ? "h2" : "h3";`.

`app/articles/page.tsx` :
- garder `metadata` et l'en-tête ;
- remplacer le kicker « Journal de bord » par `font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft` avec le texte « Carnet · entrées » ;
- remplacer la liste de cartes par `<LatestEntries articles={articles} showAllLink={false} headingLevel={2} />` ;
- conserver le message « Aucun article pour le moment. » quand la liste est vide.

`app/articles/[slug]/page.tsx`, dans l'en-tête :
- remplacer `<ArticleMetaLine>` par une ligne `font-mono text-xs text-ink-soft` : `<time dateTime={article.date}>{formatDateFr(article.date)}</time>`, puis la période si elle existe, puis `formatReadingTime` ;
- garder `ArticleTags` ;
- passer le kicker de statut en `font-mono` comme ci-dessus.

`app/articles/articles.css` :
- `.article-prose` gagne `font-family: var(--font-serif);` ;
- `.article-prose > h2` et `h3` gagnent `font-family: var(--font-display);` ;
- `.article-prose > h2::before` : le dégradé devient un trait d'encre plein, `background: var(--primary);`, avec la même taille ;
- `.article-prose > blockquote` passe en encre secondaire, `border-color: var(--ink-soft)` ;
- les graphiques (`.chart-grid`, `.chart-axis`, `.chart-tick`, `.chart-label`) passent à l'encre :
  - `.chart-grid { stroke: var(--paper-grid) }` ;
  - `.chart-axis { stroke: var(--ink-soft) }` ;
  - textes en `fill: var(--ink-soft)` et `font-family: var(--font-mono)` ;
- `.article-figure figcaption` passe en `font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-soft);`.

Vérifier les contrastes : `--ink-soft` sur `--background` vaut 7,2:1 en clair et 9,5:1 en sombre (déjà mesuré). Les nouvelles paires doivent rester au moins AA.

- [ ] **Step 4: Vérifier** — Run: `pnpm test`, biome, lint, tsc, build — Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "feat(articles): typographie de lecture du carnet et entrées datées"`

---

### Task 3: Figures numérotées automatiquement

**Files:**
- Create: `lib/articles/figures.ts`, `lib/articles/figures.test.ts`
- Modify: `components/articles/mdx/TasksChart.tsx`, `components/articles/mdx/TokensChart.tsx`, `components/articles/mdx/FaultBuckets.tsx`, `app/articles/[slug]/page.tsx`
- Test: `components/articles/mdx/figures.test.tsx` (créer)

**Interfaces:**
- Produces:
  - `FIGURE_COMPONENTS = ["TasksChart", "TokensChart", "FaultBuckets"] as const`
  - `numberFigures(source: string): { source: string; count: number }` ajoute ` figureNumber={n}` à chaque balise ouvrante `<TasksChart`, `<TokensChart` ou `<FaultBuckets` dans l'ordre d'apparition, en partant de 1. Il ignore les blocs de code clôturés (```…```) et le code en ligne.
  - Prop `figureNumber?: number` sur les trois composants. Quand elle est présente, la légende commence par « Fig. N · ».

- [ ] **Step 1: Tests qui échouent**

`lib/articles/figures.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { numberFigures } from "./figures";

describe("numberFigures", () => {
	it("numérote les figures dans l'ordre d'apparition", () => {
		const src = 'Intro\n\n<TasksChart days={[]} caption="A" />\n\ntexte\n\n<TokensChart\n  profiles={[]}\n/>\n\n<FaultBuckets items={[]} />\n';
		const out = numberFigures(src);
		expect(out.count).toBe(3);
		expect(out.source).toContain("<TasksChart figureNumber={1} days={[]}");
		expect(out.source).toContain("<TokensChart figureNumber={2}\n  profiles={[]}");
		expect(out.source).toContain("<FaultBuckets figureNumber={3} items={[]}");
	});

	it("ne touche ni aux autres composants ni au code cité", () => {
		const src = "<KeyFigures items={[]} />\n\n```mdx\n<TasksChart days={[]} />\n```\n\nEt `<TokensChart />` en ligne.\n";
		const out = numberFigures(src);
		expect(out.count).toBe(0);
		expect(out.source).toBe(src);
	});

	it("ne confond pas un nom qui commence pareil", () => {
		expect(numberFigures("<TasksChartLegend />").count).toBe(0);
	});
});
```

`components/articles/mdx/figures.test.tsx` : rendre chacun des trois composants avec des données minimales valides (lire leurs props dans les fichiers), une fois avec `figureNumber={2}` et une `caption`, une fois sans. Vérifier deux choses :
- avec le numéro, le HTML contient `Fig. 2 · ` dans un `<figcaption` ;
- sans numéro, le HTML ne contient pas « Fig. ».

`FaultBuckets` n'a pas de prop `caption` aujourd'hui. Lui en ajouter une, facultative. Avec un numéro mais sans légende, la légende vaut « Fig. N · Répartition des échecs d'outils ».

- [ ] **Step 2: Vérifier l'échec** — Run: `pnpm test lib/articles/figures.test.ts components/articles` — Expected: FAIL.

- [ ] **Step 3: Implémenter**

`lib/articles/figures.ts` :

```ts
export const FIGURE_COMPONENTS = ["TasksChart", "TokensChart", "FaultBuckets"] as const;

const FENCE = /^(```|~~~)/;
const OPEN_TAG = new RegExp(`<(${FIGURE_COMPONENTS.join("|")})(?=[\\s/>]|$)`, "g");

/** Numérote les figures d'un article (spec §8.2) en injectant `figureNumber` dans la source MDX. */
export function numberFigures(source: string): { source: string; count: number } {
	let count = 0;
	let inFence = false;
	const lines = source.split("\n").map((line) => {
		if (FENCE.test(line.trimStart())) {
			inFence = !inFence;
			return line;
		}
		if (inFence) return line;
		// Ignorer le code en ligne : ne remplacer qu'en dehors des segments `…`.
		return line
			.split(/(`[^`]*`)/)
			.map((part) =>
				part.startsWith("`")
					? part
					: part.replace(OPEN_TAG, (_m, name: string) => `<${name} figureNumber={${++count}}`),
			)
			.join("");
	});
	return { source: lines.join("\n"), count };
}
```

Les trois composants :
- ajouter `figureNumber?: number` (et `caption?: string` pour `FaultBuckets`) ;
- rendre `<figcaption>{figureNumber ? `Fig. ${figureNumber} · ` : ""}{caption}</figcaption>` quand une légende ou un numéro existe ;
- pour `FaultBuckets`, mettre `<figcaption>` comme dernier enfant de la `<figure>`.

`app/articles/[slug]/page.tsx` :
- `const { source, count: figureCount } = numberFigures(article.content);` ;
- compiler `source` au lieu de `article.content` ;
- garder `figureCount` pour la tâche 5.

- [ ] **Step 4: Vérifier** — Run: `pnpm test`, biome, lint, tsc, build — Expected: PASS. Vérifier dans le HTML construit de `/articles/neuf-agents-neuf-jours` (`.next/server/app/articles/neuf-agents-neuf-jours.html`) la présence de « Fig. 1 · », « Fig. 2 · » et « Fig. 3 · ».

- [ ] **Step 5: Commit** — `git commit -m "feat(articles): figures numérotées automatiquement"`

---

### Task 4: Composant MDX `<Note>`

**Files:**
- Create: `components/articles/mdx/Note.tsx`
- Modify: `components/articles/mdx/index.tsx` (enregistrer `Note`), `app/articles/articles.css` (si besoin de position)
- Test: `components/articles/mdx/note.test.tsx`

**Interfaces:**
- Consumes: `MarginNote` (`components/notebook/MarginNote.tsx`, props `children`, `side?`, `inline?`). La police manuscrite y est déjà différée après le montage.
- Produces: `<Note side?="right" | "left">…</Note>` utilisable dans le MDX.

- [ ] **Step 1: Test qui échoue**

`components/articles/mdx/note.test.tsx` :

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { mdxComponents } from "./index";
import Note from "./Note";

describe("Note", () => {
	it("est disponible dans le MDX", () => {
		expect(mdxComponents.Note).toBe(Note);
	});

	it("annonce la note comme du texte normal, préfixé pour les lecteurs d'écran", () => {
		const html = renderToStaticMarkup(<Note>le scan revenait toutes les 10 min</Note>);
		expect(html).toContain('<span class="sr-only">Note : </span>');
		expect(html).toContain("le scan revenait toutes les 10 min");
		expect(html).not.toContain("aria-hidden");
		expect(html).not.toContain("opacity:0");
	});

	it("se place en marge sur grand écran et dans le flux sur mobile", () => {
		const html = renderToStaticMarkup(<Note>x</Note>);
		expect(html).toContain("xl:absolute");
		expect(html).toContain("relative");
	});
});
```

- [ ] **Step 2: Vérifier l'échec** — Run: `pnpm test components/articles/mdx/note.test.tsx` — Expected: FAIL.

- [ ] **Step 3: Implémenter**

`components/articles/mdx/Note.tsx` :

```tsx
import type { ReactNode } from "react";
import MarginNote from "@/components/notebook/MarginNote";

/**
 * Annotation manuscrite d'un article (spec §8.2) : en marge à partir de `xl`, dans le flux sinon.
 * À placer juste après le paragraphe qu'elle commente ; le texte reste lu normalement.
 */
export default function Note({ children, side = "right" }: Readonly<{ children: ReactNode; side?: "left" | "right" }>) {
	return (
		<div className="relative">
			<MarginNote side={side}>
				<span className="sr-only">Note : </span>
				{children}
			</MarginNote>
		</div>
	);
}
```

Enregistrer `Note` dans `mdxComponents`. Vérifier à 1280 px que la marge droite de l'article (`max-w-[44rem]` centré) laisse la place à une note de `w-48` décalée de `-right-56` sans débordement horizontal. Si la place manque, n'ancrer en marge qu'à partir de `2xl`, en ajoutant une prop `breakpoint` à `MarginNote` ou une classe sur le conteneur, et consigner la décision.

Ne pas modifier le contenu de l'article existant : aucune `<Note>` n'y est ajoutée dans ce plan, car le spec interdit de toucher au contenu des articles existants. Le composant sert aux prochains articles.

- [ ] **Step 4: Vérifier** — Run: `pnpm test`, biome, lint, tsc — Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "feat(articles): composant MDX Note — annotation en marge"`

---

### Task 5: « Sur la carte » en fin d'article

**Files:**
- Create: `lib/carnet/neighbors.ts`, `lib/carnet/neighbors.test.ts`, `components/articles/OnTheMap.tsx`, `components/articles/on-the-map.test.tsx`
- Modify: `lib/register.ts` (`mapNeighbors` délègue à `nearestTo`), `app/articles/[slug]/page.tsx`

**Interfaces:**
- Consumes: `MapData` ; `cosine` ; `toMapView`, `MapPoint`, `isExternalHref` ; `clusterLabels` ; `MiniMap` (`components/register/MiniMap.tsx`, props `points`, `focusId`, `neighborIds`) ; `FigureCaption`.
- Produces:
  - `nearestTo(map: MapData, id: string, k?: number): MapData["items"]` renvoie les k éléments (défaut 3) les plus proches, lui-même exclu, par cosinus décroissant, puis `id` en cas d'égalité. Renvoie `[]` si `id` est absent de la carte.
  - `<OnTheMap articleId points neighbors figureNumber />`. `neighbors` est de type `{ id: string; title: string; href: string; kind: "article" | "project" }[]`.

- [ ] **Step 1: Tests qui échouent**

`lib/carnet/neighbors.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import type { MapData } from "./map-types";
import { nearestTo } from "./neighbors";

const item = (id: string, vector: number[]) => ({
	id, kind: (id.startsWith("article") ? "article" : "project") as "article" | "project",
	title: id, href: `/${id}`, x: 0, y: 0, cluster: "c1", keywords: [], terms: [], vector,
});
const map: MapData = {
	model: "m", generatedAt: "2026-10-09T00:00:00Z", clusters: [{ id: "c1", label: "g" }],
	items: [item("article:a", [1, 0]), item("project:1", [0.9, 0.1]), item("project:2", [0, 1]), item("project:3", [0.7, 0.3])],
};

describe("nearestTo", () => {
	it("donne les k plus proches, lui-même exclu", () => {
		expect(nearestTo(map, "article:a", 2).map((i) => i.id)).toEqual(["project:1", "project:3"]);
	});

	it("renvoie une liste vide pour un élément absent de la carte", () => {
		expect(nearestTo(map, "article:absent")).toEqual([]);
	});
});
```

`components/articles/on-the-map.test.tsx` :

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import OnTheMap from "./OnTheMap";

const points = [
	{ id: "article:a", kind: "article" as const, title: "A", href: "/articles/a", x: 0.2, y: 0.2, cluster: 1 },
	{ id: "project:1", kind: "project" as const, title: "P1", href: "https://github.com/x/p1", x: 0.3, y: 0.2, cluster: 2 },
];

describe("OnTheMap", () => {
	const html = renderToStaticMarkup(
		<OnTheMap articleId="article:a" points={points} figureNumber={4}
			neighbors={[{ id: "project:1", title: "P1", href: "https://github.com/x/p1", kind: "project" }]} />,
	);

	it("titre la section et numérote sa figure", () => {
		expect(html).toContain("<h2");
		expect(html).toContain("Sur la carte");
		expect(html).toContain("Fig. 4 · ");
	});

	it("liste les voisins en liens, externes ouverts dans un nouvel onglet", () => {
		expect(html).toContain('href="https://github.com/x/p1"');
		expect(html).toContain('rel="noopener noreferrer"');
		expect(html).toContain("projet");
	});

	it("ne rend rien sans voisin", () => {
		expect(renderToStaticMarkup(<OnTheMap articleId="article:a" points={points} figureNumber={1} neighbors={[]} />)).toBe("");
	});
});
```

- [ ] **Step 2: Vérifier l'échec** — Run: `pnpm test lib/carnet/neighbors.test.ts components/articles/on-the-map.test.tsx` — Expected: FAIL.

- [ ] **Step 3: Implémenter**

`lib/carnet/neighbors.ts` :

```ts
import type { MapData } from "./map-types";
import { cosine } from "./static-model";

export function nearestTo(map: MapData, id: string, k = 3): MapData["items"] {
	const self = map.items.find((i) => i.id === id);
	if (!self) return [];
	return map.items
		.filter((other) => other.id !== id)
		.map((other) => ({ other, score: cosine(self.vector, other.vector) }))
		.sort((a, b) => b.score - a.score || a.other.id.localeCompare(b.other.id))
		.slice(0, k)
		.map((s) => s.other);
}
```

`lib/register.ts` : `mapNeighbors` devient `Object.fromEntries(map.items.filter((i) => i.kind === "project").map((i) => [i.id, nearestTo(map, i.id, k).map((n) => n.id)]))`. Son test existant doit rester vert.

`components/articles/OnTheMap.tsx`, composant serveur :

```tsx
import FigureCaption from "@/components/notebook/FigureCaption";
import MiniMap from "@/components/register/MiniMap";
import { isExternalHref, type MapPoint } from "@/lib/carnet/map-view";

interface Neighbor { id: string; title: string; href: string; kind: "article" | "project" }

/** « Sur la carte » (spec §8.2) : l'article parmi ses trois voisins les plus proches dans map.json. */
export default function OnTheMap({ articleId, points, neighbors, figureNumber }: Readonly<{
	articleId: string; points: MapPoint[]; neighbors: Neighbor[]; figureNumber: number;
}>) {
	if (neighbors.length === 0) return null;
	return (
		<section aria-labelledby="on-the-map" className="mt-14 border-t border-border pt-8">
			<h2 id="on-the-map" className="font-display text-xl font-semibold">Sur la carte</h2>
			<div className="mt-5 grid gap-6 sm:grid-cols-[10rem_1fr] sm:items-start">
				<figure className="m-0">
					<div className="aspect-square w-40">
						<MiniMap points={points} focusId={articleId} neighborIds={neighbors.map((n) => n.id)} />
					</div>
					<FigureCaption number={figureNumber}>Cette entrée parmi ses voisins</FigureCaption>
				</figure>
				<ol className="space-y-3">
					{neighbors.map((n) => (
						<li key={n.id}>
							<a
								href={n.href}
								{...(isExternalHref(n.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
								className="rounded-sm font-display font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								{n.title}
							</a>
							<span className="ml-2 font-mono text-[11px] text-ink-soft">{n.kind === "article" ? "article" : "projet"}</span>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
```

Les liens internes vers d'autres articles restent des `<a>` simples, sans `next/link`, pour garder un composant serveur sans dépendance de navigation. Biome peut l'accepter ; s'il ne l'accepte pas, utiliser `next/link` pour les liens internes.

`app/articles/[slug]/page.tsx`, au niveau module : `const map = MapDataSchema.parse(mapJson); const view = toMapView(map, clusterLabels);`. Dans la page :
- `const articleId = \`article:${article.slug}\`;` ;
- `const near = nearestTo(map, articleId, 3);` ;
- rendre `<OnTheMap articleId={articleId} points={view.points} neighbors={near.map(({ id, title, href, kind }) => ({ id, title, href, kind }))} figureNumber={figureCount + 1} />` entre `.article-prose` et le pied d'article.

Vérifier que le HTML de l'**accueil** ne grossit pas : ces imports ne concernent que la page article.

- [ ] **Step 4: Vérifier** — Run: `pnpm test`, biome, lint, tsc, build — Expected: PASS. Dans le HTML construit de l'article, vérifier la présence de « Sur la carte », de « Fig. 4 · » et de trois liens.

- [ ] **Step 5: Commit** — `git commit -m "feat(articles): « Sur la carte » en fin d'article"`

---

### Task 6: À propos — chronologie de carnet tracée à l'encre

**Files:**
- Create: `lib/about.ts`, `lib/about.test.ts`, `components/about/Chronology.tsx`, `components/about/chronology.test.tsx`
- Modify: `app/About/page.tsx` (composant serveur, sans framer-motion), `app/globals.css` (classes de la chronologie)

**Interfaces:**
- Produces:
  - `interface Step { year: string; title: string; description: string }` ;
  - `PARCOURS: Step[]`, le contenu exact de `timelineItems` d'aujourd'hui, déplacé tel quel ;
  - `ageOn(date: Date, birth?: string): number`, la logique de `getAge`, rendue pure et testable ;
  - `<Chronology steps />`.

- [ ] **Step 1: Tests qui échouent**

`lib/about.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { ageOn, PARCOURS } from "./about";

describe("about", () => {
	it("calcule l'âge à une date donnée, anniversaire compris", () => {
		expect(ageOn(new Date("2026-04-30T12:00:00Z"))).toBe(32);
		expect(ageOn(new Date("2026-05-01T12:00:00Z"))).toBe(33);
	});

	it("garde le parcours de la PR #5, RNCP 7 jamais présenté comme obtenu", () => {
		expect(PARCOURS).toHaveLength(6);
		const last = PARCOURS[PARCOURS.length - 1];
		expect(last.title).toBe("Parcours AI Engineer");
		expect(last.year).toContain("en cours");
		expect(last.description).not.toMatch(/obtenu|diplômé/i);
		expect(PARCOURS.some((s) => s.description.includes("RNCP42641"))).toBe(true);
	});
});
```

`components/about/chronology.test.tsx` :

```tsx
import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PARCOURS } from "@/lib/about";
import Chronology from "./Chronology";

describe("Chronology", () => {
	const html = renderToStaticMarkup(<Chronology steps={PARCOURS} />);

	it("est une liste ordonnée d'étapes datées, titres en h2", () => {
		expect(html).toContain("<ol");
		expect(html.match(/<h2/g)?.length).toBe(PARCOURS.length);
		expect(html).toContain("font-mono");
		expect(html).toContain(PARCOURS[0].year);
	});

	it("numérote les étapes (vraie chronologie) et ne cache rien au repos", () => {
		expect(html).toContain("01");
		expect(html).not.toContain("opacity:0");
	});

	it("trace la ligne au défilement seulement là où c'est supporté, et jamais en mouvement réduit", () => {
		const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
		expect(css).toMatch(/@supports \(animation-timeline: view\(\)\)/);
		expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.chrono-ink[\s\S]*animation: none/);
	});

	it("la page À propos n'utilise plus framer-motion", () => {
		const page = readFileSync(path.join(process.cwd(), "app/About/page.tsx"), "utf8");
		expect(page).not.toContain("framer-motion");
		expect(page).not.toContain('"use client"');
	});
});
```

- [ ] **Step 2: Vérifier l'échec** — Run: `pnpm test lib/about.test.ts components/about` — Expected: FAIL.

- [ ] **Step 3: Implémenter**

`lib/about.ts` : déplacer `timelineItems` en `PARCOURS`, en recopiant le contenu caractère pour caractère, et `getAge` en `ageOn(date, birth = "1993-05-01")`. Calculer en UTC pour que le test soit déterministe.

`components/about/Chronology.tsx` :

```tsx
import type { Step } from "@/lib/about";

/** Chronologie du carnet (spec §8.3) : une ligne d'encre qui se trace au défilement, dates en Fira Code. */
export default function Chronology({ steps }: Readonly<{ steps: Step[] }>) {
	return (
		<ol className="relative ml-3 sm:ml-40">
			<span aria-hidden="true" className="chrono-ink absolute top-1 bottom-1 left-0 w-0.5 origin-top bg-primary" />
			{steps.map((step, i) => (
				<li key={step.title} className="relative pb-10 pl-8 last:pb-0">
					<span aria-hidden="true" className="absolute top-1.5 -left-[5px] size-3 rounded-full border-2 border-primary bg-background" />
					<p className="font-mono text-xs text-ink-soft sm:absolute sm:top-1 sm:-left-40 sm:w-32 sm:text-right">
						<span className="mr-2 text-primary">{String(i + 1).padStart(2, "0")}</span>
						{step.year}
					</p>
					<h2 className="mt-1 font-display text-xl font-semibold sm:mt-0">{step.title}</h2>
					<p className="mt-2 max-w-prose text-base leading-relaxed">{step.description}</p>
				</li>
			))}
		</ol>
	);
}
```

`app/globals.css`, dans `@layer components` :

```css
  /* Chronologie (spec §8.3) : ligne entière par défaut ; tracée au défilement si le navigateur sait faire. */
  @supports (animation-timeline: view()) {
    .chrono-ink {
      animation: chrono-draw linear both;
      animation-timeline: view();
      animation-range: entry 10% cover 60%;
    }
  }
  @keyframes chrono-draw {
    from { transform: scaleY(0); }
    to { transform: scaleY(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .chrono-ink { animation: none; }
  }
```

(Si la ligne n'est jamais entièrement tracée quand la liste tient dans l'écran, ajuster `animation-range` jusqu'à ce qu'elle atteigne `scaleY(1)` en fin de liste. Vérifier dans Chromium.)

`app/About/page.tsx` devient un composant serveur, sans `"use client"`, sans `framer-motion` ni `BookOpenText` :
- en-tête : kicker `font-mono` « Carnet · parcours », h1 « William Derue », sous-titre « Développeur IA · parcours AI Engineer », ligne `{ageOn(new Date())} ans — Sud de la France` ;
- puis `<Chronology steps={PARCOURS} />`.

L'âge est figé au build : la page est statique et se reconstruit à chaque déploiement, ce qui est acceptable. Garder `Header` et `Footer`.

- [ ] **Step 4: Vérifier**
  - Run: `pnpm test`, biome, lint, tsc, build — Expected: PASS ; `/About` est statique.
  - Essai navigateur à 390 et 1280 px dans Chromium : la ligne se trace en défilant.
  - Avec `prefers-reduced-motion`, la ligne est entière.
  - Arrêter le serveur (wrapper et enfant).

- [ ] **Step 5: Commit** — `git commit -m "feat(about): chronologie de carnet tracée à l'encre"`

---

### Task 7: Contact — fiche du carnet

**Files:**
- Modify: `app/Contact/page.tsx`
- Test: `app/contact.test.ts` (créer)

- [ ] **Step 1: Test qui échoue**

`app/contact.test.ts` :

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(path.join(process.cwd(), "app/Contact/page.tsx"), "utf8");

describe("Contact (fiche du carnet)", () => {
	it("n'utilise plus framer-motion", () => {
		expect(page).not.toContain("framer-motion");
		expect(page).not.toContain("motion.");
	});

	it("garde la logique d'envoi et de validation", () => {
		expect(page).toContain("useActionState(sendEmail");
		expect(page).toContain("useFormValidation");
		expect(page).toContain("<ThemedToaster />");
	});

	it("annonce les erreurs de champ et les relie aux champs", () => {
		expect(page).toContain('role="alert"');
		expect(page).toContain("aria-describedby");
		expect(page).toContain("aria-invalid");
	});

	it("se présente comme une fiche du carnet", () => {
		expect(page).toContain("Fiche");
		expect(page).toContain("font-mono");
	});
});
```

- [ ] **Step 2: Vérifier l'échec** — Run: `pnpm test app/contact.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implémenter** — dans `app/Contact/page.tsx`, sans toucher à `sendEmail`, au schéma zod, à `useFormValidation` ni aux toasts :
- **En-tête :**
  - supprimer l'en-tête animé (`motion.div`, icône `UserRoundPen`) ;
  - le remplacer par un kicker `font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft` « Carnet · fiche contact », le h1 « Formulaire de contact » et une phrase « Une question sur un projet, une expérience ou un article ? Je réponds sous quelques jours. ».
- **Formulaire, présenté comme une fiche du carnet :**
  - bordure `border-border`, fond `bg-background/80` ;
  - en-tête de fiche en Fira Code : « Fiche n° — à remplir » à gauche, la date du jour au format `formatDateFr` à droite, en texte sans animation ;
  - libellés de champs en `font-mono text-xs uppercase tracking-[0.12em] text-ink-soft` ;
  - champs soulignés par une ligne d'encre : `border-0 border-b border-ink-soft/50 rounded-none bg-transparent focus:border-primary`, tout en gardant un anneau de focus visible (`focus-visible:ring-2`).
- **Erreurs de champ :**
  - les `motion.p` deviennent des `<p id="<champ>-error" role="alert" className="mt-1.5 text-xs text-destructive">` ;
  - chaque champ reçoit `aria-invalid={isFieldInvalid(...)}` et `aria-describedby` pointant vers l'erreur quand elle existe.
- Le bouton d'envoi garde son comportement (`isPending`, `Loader2`) et prend le style du site (bouton principal).
- Vérifier que `framer-motion` n'est plus importé par aucune page publique : `grep -rln "framer-motion" app components`. Seuls `components/notebook/InkPath.tsx` (et les tests qui le moquent) peuvent rester.

- [ ] **Step 4: Vérifier**
  - Run: `pnpm test`, biome, lint, tsc, build — Expected: PASS.
  - Essai navigateur :
    - soumettre vide : erreurs lisibles, annoncées, focus visible ;
    - ne pas envoyer de vrai message : ne pas remplir un formulaire valide.
  - Arrêter le serveur (wrapper et enfant).

- [ ] **Step 5: Commit** — `git commit -m "feat(contact): fiche du carnet, erreurs annoncées, sans framer-motion"`

---

### Task 8: Vérification, mesures et PR

**Files:** aucun fichier de code, sauf les correctifs trouvés pendant la vérification (commits `fix(…)` dédiés et testés).

- [ ] **Step 1:** `pnpm test && pnpm exec biome check && pnpm lint && pnpm exec tsc --noEmit && pnpm build` — tout PASS. Mesurer `gzip -6c .next/server/app/index.html | wc -c` : la valeur doit rester inférieure à 14 600 ; la reporter.
- [ ] **Step 2: Revue visuelle**
  - démarrer `pnpm start -p 3331` et noter les PID du wrapper et de l'enfant ;
  - captures pleine page de `/articles`, `/articles/neuf-agents-neuf-jours`, `/About` et `/Contact` à 390×844 et 1280×800, en clair et en sombre, plus `/About` à 1280 en `prefers-reduced-motion: reduce` ;
  - ranger les captures dans le dossier de travail SDD (`screens/`), pas dans le dépôt ;
  - vérifier sur chaque page :
    - un seul h1, aucun saut de niveau de titre ;
    - aucun débordement horizontal à 390 px ;
    - figures « Fig. 1 » à « Fig. 3 » et « Sur la carte » « Fig. 4 » dans l'article ;
    - ligne de la chronologie visible ;
    - fiche Contact lisible dans les deux thèmes.
- [ ] **Step 3: Lighthouse local, mobile** — 3 passes sur `/articles/neuf-agents-neuf-jours`, `/About` et `/Contact` (`npx lighthouse … --only-categories=performance,accessibility --form-factor=mobile --chrome-flags="--headless" --quiet --output=json`). Relever les scores de performance et d'accessibilité, le LCP et le CLS. Pour l'accueil, une passe de contrôle suffit, puisque L4 ne le touche que via la tâche 1.
- [ ] **Step 4: Push et PR**
  - `git push -u origin feat/v2-l4-pages`, puis `gh pr create --base main --title "feat(pages): L4 — articles, À propos et Contact au carnet de labo"` ;
  - corps de PR en français : livraison, décisions, mesures, ce qui reste ;
  - dernière ligne : `🤖 Generated with [Claude Code](https://claude.com/claude-code)` ;
  - ne pas merger ;
  - arrêter les serveurs lancés (wrapper et enfant) et vérifier que les ports ne répondent plus.
