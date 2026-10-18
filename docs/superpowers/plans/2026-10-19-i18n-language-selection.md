# Sélecteur de langue fr/en/zh — plan d'implémentation

> **Pour les agents :** SOUS-SKILL REQUIS : utiliser `superpowers:subagent-driven-development` (recommandé) ou
> `superpowers:executing-plans` pour exécuter ce plan tâche par tâche. Les étapes utilisent des cases à cocher
> (`- [ ]`) pour le suivi.

**Objectif :** ajouter un sélecteur de langue au portfolio — français par défaut sans préfixe d'URL, anglais et
chinois préfixés — en couvrant l'interface publique, les dictionnaires `lib/` et les articles MDX.

**Architecture :** `next-intl` 4.14 avec `localePrefix: 'as-needed'`. Les routes publiques passent sous
`app/[locale]/` qui devient le root layout portant `<html lang={locale}>`. Le back-office gagne son propre root
layout `app/(admin)/layout.tsx` en `lang="fr"`, ce qui libère la suppression de `app/layout.tsx`. `proxy.ts`
compose le middleware next-intl avec le contrôle NextAuth existant. Les dictionnaires `lib/`, consommés hors de
React, deviennent des fonctions prenant un traducteur.

**Stack technique :** Next.js 16.3.8 (App Router, `proxy.ts`), React 19, next-intl 4.14.9, TypeScript, Tailwind v4,
Vitest 4, Biome.

**État de départ :** 77 fichiers de test, 506 tests, tous verts sur `feat/i18n-language-selection`.

**Référence :** `docs/superpowers/specs/2026-10-19-i18n-language-selection-design.md`, issue [#24](https://github.com/WillIsback/Portfolio/issues/24).

---

## Convention de travail

Toutes les commandes de ce plan s'exécutent **depuis la racine du worktree** :

```bash
cd /home/will/dev-project/portfolio/.worktrees/i18n-language-selection
```

Les tests ciblés se lancent avec `pnpm vitest run <fichier>` ; la suite complète avec `pnpm test` ; le formatage avec
`pnpm exec biome check --write <chemins>` ; le typecheck et la compilation avec `pnpm build`.

Ne **jamais** exécuter de commande git sans ce `workdir` : le dépôt principal est sur une autre branche, avec des
modifications non commitées qui ne doivent pas être touchées.

---

## Cartographie des fichiers

### Créés

| Fichier | Rôle |
|---|---|
| `i18n/routing.ts` | `defineRouting` : locales, défaut, stratégie de préfixe. Source de vérité unique. |
| `i18n/request.ts` | `getRequestConfig` : résout la locale et charge le dictionnaire. |
| `i18n/navigation.ts` | `createNavigation(routing)` : `Link`, `useRouter`, `usePathname` conscient de la locale. |
| `messages/fr.json` | Dictionnaire français, référence du projet. |
| `messages/en.json` | Dictionnaire anglais. |
| `messages/zh.json` | Dictionnaire chinois. |
| `app/[locale]/layout.tsx` | Root layout public : `<html lang={locale}>`, polices, `metadata`. |
| `app/[locale]/not-found.tsx` | 404 localisée. |
| `app/(admin)/layout.tsx` | Root layout admin : `<html lang="fr">` + `<body>`. |
| `components/LocaleSwitcher/LocaleSwitcher.tsx` | Sélecteur de langue (client). |
| `components/LocaleSwitcher/locale-switcher.test.tsx` | Test de rendu du sélecteur. |
| `tests/i18n-render.tsx` | Helper de rendu SSR avec `NextIntlClientProvider`. |
| `messages/message-parity.test.ts` | Parité des clés fr/en/zh, dérivée de `routing.locales`. |
| `i18n/locale-dirs.test.ts` | Résolution du répertoire d'articles par locale. |

### Modifiés

| Fichier | Nature de la modification |
|---|---|
| `package.json` | Ajout de `next-intl`. |
| `next.config.ts` | Ajout du plugin `createNextIntlPlugin()`. |
| `proxy.ts` | Composition `auth` + middleware next-intl. |
| `lib/status.ts`, `training.ts`, `practices.ts`, `domains.ts`, `register.ts`, `about.ts`, `instruments.ts` | Constantes de libellés → fonctions de traducteur. |
| `lib/articles/format.ts` | Locale paramétrée. |
| `lib/articles/loader.ts` | Résolution par locale avec repli. |
| `lib/carnet/search.ts`, `lib/carnet/explorer.ts` | Locale paramétrée. |
| `lib/contact-form.ts` | `errorSummary` → message ICU. |
| `content/map-clusters.ts` | Libellés de clusters → fonctions. |
| `components/Header/NavMenu.tsx`, `Header.tsx`, `Footer/Footer.tsx` | Libellés + `Link` localisé. |
| `components/register/FilterBar.tsx`, `RegisterView.tsx` | Libellés. |
| `app/[locale]/articles/[slug]/page.tsx` | `generateStaticParams` croisé, metadata. |
| Tests existants | Assertions redirigées vers `messages/fr.json`. |

### Déplacés (git mv, URLs préservées)

| De | Vers |
|---|---|
| `app/page.tsx` | `app/[locale]/page.tsx` |
| `app/articles/` | `app/[locale]/articles/` |
| `app/About/` | `app/[locale]/About/` |
| `app/Contact/` | `app/[locale]/Contact/` |
| `app/admin/login/` | `app/(admin)/login/` |

---

## Tâche 1 — Dépendance et squelette i18n

**Fichiers :**
- Modifier : `package.json`, `next.config.ts`
- Créer : `i18n/routing.ts`, `i18n/request.ts`, `i18n/navigation.ts`
- Créer : `messages/fr.json`

- [x] **Étape 1 : installer next-intl**

```bash
pnpm add next-intl@^4.14.9
```

Attendu : `next-intl 4.14.x` ajouté aux `dependencies`.

> next-intl 4.14.9 a déjà été installé dans ce worktree pendant la vérification du plan ; la commande est idempotente.
> La version installée est à contrôler avec `pnpm list next-intl`.

- [x] **Étape 2 : écrire le test de parité des clés (il doit échouer)**

Créer `messages/message-parity.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import fr from "@/messages/fr.json";
import en from "@/messages/en.json";
import zh from "@/messages/zh.json";

/** Aplatit un dictionnaire imbriqué en chemins pointés : {a: {b: 1}} → ["a.b"]. */
function keys(value: unknown, prefix = ""): string[] {
	if (typeof value !== "object" || value === null) return [prefix];
	return Object.entries(value)
		.flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k))
		.sort();
}

const base = keys(fr);

describe("parité des messages", () => {
	it("fr est le dictionnaire de référence non vide", () => {
		expect(base.length).toBeGreaterThan(0);
	});

	it.each([
		["en", en],
		["zh", zh],
	])("%s couvre exactement les mêmes clés que fr", (_locale, dict) => {
		expect(keys(dict)).toEqual(base);
	});
});
```

Créer `messages/en.json` et `messages/zh.json` avec `{}` pour que le fichier existe, et `messages/fr.json` avec
au moins une clé :

```json
{
	"meta": {
		"title": "William Derue | Développeur IA · parcours AI Engineer"
	}
}
```

- [x] **Étape 3 : exécuter le test et vérifier qu'il échoue**

```bash
pnpm vitest run messages/message-parity.test.ts
```

Attendu : ÉCHEC sur le cas `en`, `["meta.title"]` attendu mais `[]` reçu.

- [x] **Étape 4 : créer `i18n/routing.ts`**

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
	locales: ["fr", "en", "zh"],
	defaultLocale: "fr",
	localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
```

- [x] **Étape 5 : créer `i18n/request.ts`**

```ts
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
	let locale = await requestLocale;

	if (!locale || !hasLocale(routing.locales, locale)) {
		locale = routing.defaultLocale;
	}

	return { locale, messages: (await import(`../messages/${locale}.json`)).default };
});
```

- [x] **Étape 6 : créer `i18n/navigation.ts`**

```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
	createNavigation(routing);
```

- [x] **Étape 7 : brancher le plugin next-intl dans `next.config.ts`**

Remplacer le fichier par :

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withWorkflow } from "workflow/next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

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

export default withWorkflow(withNextIntl(baseConfig));
```

> **L'ordre est obligatoire et ne doit pas être « corrigé ».** `withWorkflow` renvoie une **fonction de
> configuration** asynchrone `(phase, ctx) => Promise<NextConfig>` — c'est la forme valide côté Next. `withNextIntl`,
> lui, lit `nextConfig.turbopack`, `.webpack`, `.basePath` et `.env` sur un **objet simple**, puis renvoie
> `Object.assign({}, nextConfig, …)`. Lui passer une fonction produit un objet sans aucune propriété : `images`,
> `headers()` et toute la configuration workflow seraient silencieusement perdues. `tsc` remonte l'erreur
> `TS2559: Type '(phase: string, ctx: …) => Promise<NextConfig>' has no properties in common with type 'NextConfig'`.
> Les deux se composent sans conflit : next-intl pose `turbopack.resolveAlias`, `withWorkflow` conserve un
> `turbopack` existant en y ajoutant ses `rules`.

- [x] **Étape 8 : réécrire les trois dictionnaires en parité**

`messages/fr.json` (contenu de référence) :

```json
{
	"meta": {
		"title": "William Derue | Développeur IA · parcours AI Engineer"
	}
}
```

`messages/en.json` :

```json
{
	"meta": {
		"title": "William Derue | AI Developer · AI Engineer track"
	}
}
```

`messages/zh.json` :

```json
{
	"meta": {
		"title": "William Derue | AI 开发工程师 · AI Engineer 方向"
	}
}
```

- [x] **Étape 9 : exécuter le test et vérifier qu'il passe**

```bash
pnpm vitest run messages/message-parity.test.ts
```

Attendu : 3 tests PASSENT (`fr` non vide, `en` en parité, `zh` en parité).

- [x] **Étape 10 : commiter**

```bash
pnpm exec biome check --write i18n messages next.config.ts package.json
git add package.json pnpm-lock.yaml next.config.ts i18n messages
git commit -m "feat(i18n): squelette next-intl et dictionnaires fr/en/zh en parité"
```

---

## Tâche 2 — Proxy composé

**Fichiers :**
- Modifier : `proxy.ts`
- Créer : `proxy.test.ts`

- [ ] **Étape 1 : écrire le test qui échoue**

Créer `proxy.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import proxy, { config } from "./proxy";

describe("proxy", () => {
	it("couvre les routes admin et les routes publiques, hors api et assets", () => {
		expect(config.matcher).toContain("/admin/:path*");
		expect(config.matcher).toContain("/((?!api|_next|_vercel|.*\\..*).*)");
	});

	it("laisse passer une URL française sans préfixe", async () => {
		const res = await proxy(
			new NextRequest(new URL("https://willisback.fr/articles"), {
				headers: { "accept-language": "fr-FR,fr;q=0.9" },
			}),
		);
		expect(res.status).toBe(200);
	});

	it("préserve le préfixe de locale sur une URL déjà préfixée", async () => {
		const res = await proxy(
			new NextRequest(new URL("https://willisback.fr/en/articles"), {
				headers: { "accept-language": "fr-FR,fr;q=0.9" },
			}),
		);
		expect(res.status).toBe(200);
	});
});
```

- [ ] **Étape 2 : vérifier l'échec**

```bash
pnpm vitest run proxy.test.ts
```

Attendu : ÉCHEC — `./proxy` n'exporte pas de `config` compatible ni ne gère les locales.

- [ ] **Étape 3 : réécrire `proxy.ts`**

```ts
import createMiddleware from "next-intl/middleware";
import { auth } from "@/auth";
import { routing } from "@/i18n/routing";

const intlProxy = createMiddleware(routing);

export default auth((req) => intlProxy(req));

export const config = {
	matcher: ["/admin/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Étape 4 : vérifier le succès**

```bash
pnpm vitest run proxy.test.ts
```

Attendu : 3 tests PASSENT.

> Si `auth` exige `AUTH_SECRET` au chargement en environnement de test, ajouter `vi.mock("@/auth", …)` dans le
> test plutôt que de toucher à `auth.ts`.

- [ ] **Étape 5 : commiter**

```bash
pnpm exec biome check --write proxy.ts proxy.test.ts
git add proxy.ts proxy.test.ts
git commit -m "feat(i18n): proxy composé du contrôle NextAuth et du routage de locale"
```

---

## Tâche 3 — Restructuration des routes et des root layouts

> **Tâche bloquante.** Entre l'étape 2 et l'étape 12, le dépôt ne compile pas. Ne pas s'arrêter au milieu.

**Fichiers :**
- Créer : `app/[locale]/layout.tsx`, `app/(admin)/layout.tsx`, `app/[locale]/not-found.tsx`
- Déplacer : `app/page.tsx` → `app/[locale]/page.tsx`, `app/articles/` → `app/[locale]/articles/`,
  `app/About/` → `app/[locale]/About/`, `app/Contact/` → `app/[locale]/Contact/`,
  `app/admin/login/` → `app/(admin)/login/`
- Supprimer : `app/layout.tsx`
- Créer : `app/(admin)/layout.tsx`

- [ ] **Étape 1 : déplacer les routes avec git mv**

`git mv` échoue si le répertoire cible n'existe pas : le créer d'abord.

```bash
mkdir -p "app/[locale]" "app/(admin)"
git mv app/articles "app/[locale]/articles"
git mv app/About "app/[locale]/About"
git mv app/Contact "app/[locale]/Contact"
git mv app/page.tsx "app/[locale]/page.tsx"
git mv app/admin/login "app/(admin)/login"
rmdir app/admin 2>/dev/null || true
```

- [ ] **Étape 2 : créer `app/[locale]/layout.tsx`**

Le contenu est celui de l'ancien `app/layout.tsx`, avec trois différences : `<html lang={locale}>` au lieu de
`lang="fr"`, l'appel à `setRequestLocale`, et le `metadata` rendu par une fonction qui prend la locale en compte.

```tsx
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import {
	Bricolage_Grotesque,
	Caveat,
	Fira_Code,
	Source_Serif_4,
} from "next/font/google";
import { notFound } from "next/navigation";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { routing } from "@/i18n/routing";

import "../globals.css";

const bricolage = Bricolage_Grotesque({
	subsets: ["latin"],
	weight: ["600", "700"],
	variable: "--font-bricolage",
	display: "swap",
});
const sourceSerif = Source_Serif_4({
	subsets: ["latin"],
	weight: ["400", "600"],
	style: "normal",
	variable: "--font-source-serif",
	display: "swap",
});
const sourceSerifItalic = Source_Serif_4({
	subsets: ["latin"],
	weight: ["400", "600"],
	style: "italic",
	variable: "--font-source-serif-italic",
	preload: false,
	display: "swap",
});
const caveat = Caveat({
	subsets: ["latin"],
	weight: ["500"],
	variable: "--font-caveat",
	preload: false,
	display: "swap",
});
const firaCode = Fira_Code({
	subsets: ["latin"],
	weight: ["400", "500"],
	variable: "--font-fira",
	preload: false,
	display: "swap",
});

/** Locale OpenGraph : `fr` → `fr_FR`. */
function ogLocale(locale: string): string {
	return locale === "fr" ? "fr_FR" : locale === "en" ? "en_US" : "zh_CN";
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "meta" });

	return {
		title: t("title"),
		description: t("description"),
		keywords: t.raw("keywords"),
		authors: [{ name: "William Derue" }],
		creator: "William Derue",
		metadataBase: new URL("https://www.willisback.fr"),
		openGraph: {
			type: "website",
			locale: ogLocale(locale),
			url: "https://www.willisback.fr",
			title: t("title"),
			description: t("description"),
			siteName: "Portfolio WillisBack",
		},
		twitter: {
			card: "summary_large_image",
			title: t("title"),
			description: t("description"),
		},
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				"max-video-preview": -1,
				"max-image-preview": "large",
				"max-snippet": -1,
			},
		},
	};
}

/** Sans cela, le segment `[locale]` serait rendu dynamiquement et chaque page perdrait son export statique. */
export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();

	setRequestLocale(locale);

	return (
		<html
			lang={locale}
			suppressHydrationWarning
			className={`${bricolage.variable} ${sourceSerif.variable} ${sourceSerifItalic.variable} ${caveat.variable} ${firaCode.variable}`}
		>
			<body className="paper antialiased">
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
```

- [ ] **Étape 3 : supprimer `app/layout.tsx`**

```bash
git rm app/layout.tsx
```

- [ ] **Étape 4 : créer `app/(admin)/layout.tsx`**

Ce layout rend `html` et `body` et **rien d'autre** : un second `<html>` ou un second `<body>` dans le même arbre
fait échouer la compilation Next.

```tsx
import "../globals.css";

export default function AdminRootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="fr" suppressHydrationWarning>
			<body className="antialiased">{children}</body>
		</html>
	);
}
```

- [ ] **Étape 5 : vérifier qu'il ne reste qu'un seul `metadata` racine**

```bash
pnpm exec biome check --write "app/[locale]" "app/(admin)"
pnpm build 2>&1 | tail -30
```

Attendu : la compilation avance au-delà de l'étape « Collecting page data ». Les erreurs résiduelles attendues à
ce stade sont celles liées aux liens et aux metadata par page, traitées en tâche 3 étape 8.

- [ ] **Étape 6 : créer `app/[locale]/not-found.tsx`**

```tsx
import { useTranslations } from "next-intl";
import Link from "@/i18n/navigation";

export default function LocaleNotFound() {
	const t = useTranslations("notFound");

	return (
		<main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 px-6">
			<h1 className="font-display text-3xl font-bold">{t("title")}</h1>
			<p className="text-ink-soft">{t("body")}</p>
			<Link href="/" className="text-primary underline underline-offset-4">
				{t("back")}
			</Link>
		</main>
	);
}
```

- [ ] **Étape 7 : ajouter les clés `meta` et `notFound` aux trois dictionnaires**

`messages/fr.json` :

```json
{
	"meta": {
		"title": "William Derue | Développeur IA · parcours AI Engineer",
		"description": "Portfolio de William Derue - Développeur IA en parcours AI Engineer : projets de machine learning, LLM et infrastructure, et retours d'expérience.",
		"keywords": [
			"développeur fullstack",
			"AI engineer",
			"machine learning",
			"IA",
			"intelligence artificielle",
			"React",
			"Next.js",
			"TypeScript",
			"portfolio"
		]
	},
	"notFound": {
		"title": "Page introuvable",
		"body": "Cette page n'existe pas ou a été déplacée.",
		"back": "Retour à l'accueil"
	}
}
```

`messages/en.json` :

```json
{
	"meta": {
		"title": "William Derue | AI Developer · AI Engineer track",
		"description": "Portfolio of William Derue - AI developer on the AI Engineer track: machine learning, LLM and infrastructure projects, and field notes.",
		"keywords": [
			"fullstack developer",
			"AI engineer",
			"machine learning",
			"AI",
			"artificial intelligence",
			"React",
			"Next.js",
			"TypeScript",
			"portfolio"
		]
	},
	"notFound": {
		"title": "Page not found",
		"body": "This page does not exist or has been moved.",
		"back": "Back to home"
	}
}
```

`messages/zh.json` :

```json
{
	"meta": {
		"title": "William Derue | AI 开发工程师 · AI Engineer 方向",
		"description": "William Derue 的作品集 —— AI Engineer 方向的 AI 开发工程师：机器学习、大语言模型与基础设施项目，以及实践复盘。",
		"keywords": [
			"全栈开发",
			"AI 工程师",
			"机器学习",
			"人工智能",
			"React",
			"Next.js",
			"TypeScript",
			"作品集"
		]
	},
	"notFound": {
		"title": "页面不存在",
		"body": "该页面不存在或已被移动。",
		"back": "返回首页"
	}
}
```

- [ ] **Étape 8 : localiser les liens internes des pages déplacées**

Remplacer dans tous les fichiers de `app/[locale]/` les imports `next/link` et `next/navigation` :
`Link` vient désormais de `@/i18n/navigation` ; `redirect` aussi.

```bash
grep -rn 'from "next/link"' "app/[locale]" components/Header components/Footer
```

Pour chaque occurrence dans `app/[locale]/` :
`import Link from "next/link";` → `import Link from "@/i18n/navigation";`

- [ ] **Étape 9 : supprimer les `metadata` statiques en doublon des layouts**

`app/[locale]/About/layout.tsx`, `app/[locale]/Contact/layout.tsx` et
`app/[locale]/articles/page.tsx` portent chacun un bloc `metadata` codé en dur. Les supprimer : le root layout
fournit désormais `meta.title`/`meta.description`, et les pages ne doivent plus dupliquer ces chaînes.

- [ ] **Étape 10 : vérifier la compilation**

```bash
pnpm build 2>&1 | tail -30
```

Attendu : compilation réussie. Si Next signale « multiple root layouts », c'est qu'un `html`/`body` traîne encore
dans `app/(admin)/admin/layout.tsx` ou dans `app/[locale]/*/layout.tsx` — les layouts imbriqués ne doivent rendre
que des `div`.

- [ ] **Étape 11 : commiter**

```bash
pnpm exec biome check --write "app" i18n messages
git add -A app messages i18n
git commit -m "refactor(routes): segment [locale] et deux root layouts (public + admin)"
```

---

## Tâche 4 — Helper de rendu et repointage des tests existants

**Fichiers :**
- Créer : `tests/i18n-render.tsx`
- Modifier : `app/home.test.ts`, `app/contact.test.ts`, `app/toaster.test.ts`,
  `app/articles/articles-pages.test.ts`

- [ ] **Étape 1 : créer le helper de rendu**

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import fr from "@/messages/fr.json";

/**
 * Rend un composant serveur en français avec les messages réels, pour que les
 * tests de rendu restent alignés sur le dictionnaire.
 */
export function renderFr(element: React.ReactElement): string {
	return renderToStaticMarkup(
		<NextIntlClientProvider locale="fr" messages={fr}>
			{element}
		</NextIntlClientProvider>,
	);
}
```

- [ ] **Étape 2 : repointer les tests qui lisent les sources**

Dans `app/home.test.ts`, remplacer les chemins lus :
`"app/page.tsx"` → `"app/[locale]/page.tsx"`, `"app/About/page.tsx"` → `"app/[locale]/About/page.tsx"`,
`"app/Contact/page.tsx"` → `"app/[locale]/Contact/page.tsx"`, `"app/articles/layout.tsx"` →
`"app/[locale]/articles/layout.tsx"`.

Dans `app/articles/articles-pages.test.ts` et `app/contact.test.ts`, appliquer la même règle aux chemins `app/…`.

- [ ] **Étape 3 : exécuter les tests de lecture de source**

```bash
pnpm vitest run app/home.test.ts app/contact.test.ts app/toaster.test.ts app/articles/articles-pages.test.ts
```

Attendu : PASSENT.

- [ ] **Étape 4 : exécuter la suite complète**

```bash
pnpm test 2>&1 | tail -15
```

Attendu : 506 tests passent, plus les nouveaux. Aucun test ne doit échouer sur le seul déplacement de fichiers.

- [ ] **Étape 5 : commiter**

```bash
pnpm exec biome check --write tests "app/[locale]"
git add tests "app"
git commit -m "test(i18n): helper de rendu localisé et repointage des tests de source"
```

---

## Tâche 5 — Sélecteur de langue

**Fichiers :**
- Créer : `components/LocaleSwitcher/LocaleSelect.tsx`, `components/LocaleSwitcher/LocaleSwitcher.tsx`,
  `components/LocaleSwitcher/locale-select.test.tsx`
- Modifier : `components/Header/Header.tsx`
- [ ] **Étape 1 : ajouter le bloc `locale` aux trois dictionnaires**

`fr.json`, dans la racine :

```json
	"locale": {
		"label": "Langue",
		"names": {
			"fr": "Français",
			"en": "English",
			"zh": "中文"
		}
	},
```

`en.json` :

```json
	"locale": {
		"label": "Language",
		"names": {
			"fr": "Français",
			"en": "English",
			"zh": "中文"
		}
	},
```

`zh.json` :

```json
	"locale": {
		"label": "语言",
		"names": {
			"fr": "Français",
			"en": "English",
			"zh": "中文"
		}
	},
```

Les noms natifs sont volontairement identiques dans les trois dictionnaires : un utilisateur qui cherche sa langue
la reconnaît dans la liste quelle que soit la langue courante.

- [ ] **Étape 2 : écrire le test qui échoue**

Créer `components/LocaleSwitcher/locale-select.test.tsx` — le test porte sur `LocaleSelect`, le composant pur, pas
sur `LocaleSwitcher` : ce dernier appelle `useRouter`/`usePathname` et ne peut pas être rendu sans contexte de
routeur.

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import fr from "@/messages/fr.json";
import { routing } from "@/i18n/routing";
import LocaleSelect from "./LocaleSelect";

describe("LocaleSelect", () => {
	const labels = Object.fromEntries(
		routing.locales.map((code) => [code, fr.locale.names[code as keyof typeof fr.locale.names]]),
	);

	const html = renderToStaticMarkup(
		<LocaleSelect
			id="locale-switcher"
			value="fr"
			locales={routing.locales}
			labels={labels}
			label={fr.locale.label}
			onChange={() => {}}
		/>,
	);

	it("propose les trois langues avec leur nom natif", () => {
		expect(html).toContain('value="fr"');
		expect(html).toContain('value="en"');
		expect(html).toContain('value="zh"');
		expect(html).toContain(fr.locale.names.fr);
		expect(html).toContain(fr.locale.names.en);
		expect(html).toContain(fr.locale.names.zh);
	});

	it("marque la langue active", () => {
		expect(html).toMatch(/<option[^>]*value="fr"[^>]*selected/);
	});

	it("expose un libellé étiqueté pour les lecteurs d'écran", () => {
		expect(html).toMatch(/<label[^>]*for="locale-switcher"/);
		expect(html).toContain('id="locale-switcher"');
		expect(html).toContain(`aria-label="${fr.locale.label}"`);
	});

	it("reste compatible avec les trois locales du routage", () => {
		expect(routing.locales).toEqual(["fr", "en", "zh"]);
		expect(Object.keys(labels)).toEqual(["fr", "en", "zh"]);
	});
});
```

- [ ] **Étape 3 : vérifier l'échec**

```bash
pnpm vitest run components/LocaleSwitcher/locale-select.test.tsx
```

Attendu : ÉCHEC — le module `./LocaleSwitcher` n'existe pas.

- [ ] **Étape 4 : créer le composant pur `LocaleSelect.tsx`**

Le composant est **scindé** : `LocaleSelect` ne connaît ni le routeur ni la locale, il ne prend que des props.
C'est ce qui le rend testable — `usePathname`/`useRouter` de `next/navigation` exigent un `AppRouterContext`
qui n'existe pas dans un `renderToStaticMarkup` nu, ce qui est précisément pourquoi `components/register/register.test.tsx`
ne teste jamais `FilterBar` et seulement ses sous-composants.

Créer `components/LocaleSwitcher/LocaleSelect.tsx` :

```tsx
"use client";

export interface LocaleSelectProps {
	id: string;
	/** Code de la langue active. */
	value: string;
	locales: readonly string[];
	/** Libellé traduit de chaque langue, indexé par code. */
	labels: Record<string, string>;
	/** Texte du `<label>` masqué et de `aria-label`. */
	label: string;
	disabled?: boolean;
	onChange: (locale: string) => void;
}

export default function LocaleSelect({
	id,
	value,
	locales,
	labels,
	label,
	disabled,
	onChange,
}: LocaleSelectProps) {
	return (
		<>
			<label htmlFor={id} className="sr-only">
				{label}
			</label>
			<select
				id={id}
				value={value}
				disabled={disabled}
				aria-label={label}
				onChange={(event) => onChange(event.target.value)}
				className="rounded-none border border-border/70 bg-background px-1.5 py-1 font-mono text-xs text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				{locales.map((code) => (
					<option key={code} value={code}>
						{labels[code]}
					</option>
				))}
			</select>
		</>
	);
}
```

- [ ] **Étape 5 : créer le composant connecté `LocaleSwitcher.tsx`**

```tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import LocaleSelect from "./LocaleSelect";

export default function LocaleSwitcher() {
	const t = useTranslations("locale");
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();
	const [pending, startTransition] = useTransition();

	const labels = Object.fromEntries(
		routing.locales.map((code) => [code, t(`names.${code}`)]),
	) as Record<string, string>;

	function change(next: string) {
		startTransition(() => {
			router.replace(pathname, { locale: next });
		});
	}

	return (
		<LocaleSelect
			id="locale-switcher"
			value={locale}
			locales={routing.locales}
			labels={labels}
			label={t("label")}
			disabled={pending}
			onChange={change}
		/>
	);
}
```

- [ ] **Étape 6 : vérifier le succès du test**

```bash
pnpm vitest run components/LocaleSwitcher/locale-select.test.tsx
```

Attendu : 2 tests PASSENT.

- [ ] **Étape 7 : monter le sélecteur dans l'en-tête**

Dans `components/Header/Header.tsx`, importer et insérer à côté de `ThemeToggle` :

```tsx
import LocaleSwitcher from "@/components/LocaleSwitcher/LocaleSwitcher";
```

et, dans le `<div className="flex items-center gap-1 sm:gap-2">` :

```tsx
					<LocaleSwitcher />
					<ThemeToggle />
```

- [ ] **Étape 8 : commiter**

```bash
pnpm exec biome check --write components/LocaleSwitcher components/Header messages
git add components/LocaleSwitcher components/Header messages
git commit -m "feat(i18n): sélecteur de langue dans l'en-tête"
```

---

## Tâche 6 — Dictionnaires `lib/` : constantes → fonctions

> Ces modules sont consommés hors de React (composants serveur, tests), donc ils ne peuvent pas appeler de hook.
> Ils reçoivent un traducteur.

**Fichiers :**
- Créer : `i18n/translator.ts`
- Modifier : `lib/status.ts`, `lib/training.ts`, `lib/practices.ts`, `lib/domains.ts`, `lib/register.ts`,
  `lib/about.ts`, `lib/instruments.ts`, `content/map-clusters.ts`
- Modifier : `messages/fr.json`, `messages/en.json`, `messages/zh.json`
- Modifier : les tests `lib/status.test.ts`, `lib/training.test.ts`, `lib/about.test.ts`, `lib/carnet/map-build.test.ts`

- [ ] **Étape 1 : créer le type `Translator` partagé**

`tsconfig.json` est en `strict: true`, donc `strictFunctionTypes` est actif : un paramètre
`(key: string) => string` **refuserait** le traducteur réel de next-intl, dont la signature est
`(key: "status.done") => string`. Sous variance contravariant, `string` n'est pas assignable à `"status.done"`.

Le type est donc volontairement permissif, défini une seule fois :

`i18n/translator.ts` :

```ts
/**
 * Traducteur next-intl réduit à sa forme appelable, pour que les modules de `lib/`
 * puissent recevoir un traducteur sans dépendre de `next-intl`.
 *
 * Le paramètre est `any` et non `string` à dessein : le traducteur fourni par
 * `getTranslations()` est typé par clé (`(key: "status.done") => string`) et ne serait
 * pas assignable à `(key: string) => string` sous `strictFunctionTypes`.
 */
// biome-ignore lint/suspicious/noExplicitAny: cf. explication ci-dessus
export type Translator = (key: any) => string;
```

Tous les modules modifiés dans cette tâche importent ce type au lieu de le redéclarer.

- [ ] **Étape 2 : écrire le test qui échoue**

Dans `lib/status.test.ts`, remplacer les assertions sur les constantes par :

```ts
import { describe, expect, it } from "vitest";
import { createTranslator } from "next-intl";
import { PROJECT_STATUSES, statusLabels } from "./status";
import fr from "@/messages/fr.json";

const t = createTranslator({ locale: "fr", messages: fr });

describe("libellés de statut", () => {
	it("traduit chaque statut dans les trois langues", () => {
		expect(PROJECT_STATUSES).toEqual(["InProgress", "Done", "Archived"]);
		expect(statusLabels(t)).toEqual({
			InProgress: "en cours",
			Done: "terminé",
			Archived: "archivé",
		});
	});
});
```

- [ ] **Étape 3 : vérifier l'échec**

```bash
pnpm vitest run lib/status.test.ts
```

Attendu : ÉCHEC — `statusLabels` n'est pas exporté.

- [ ] **Étape 4 : convertir `lib/status.ts`**

```ts
export const PROJECT_STATUSES = ["InProgress", "Done", "Archived"] as const;

export type ProjectStatusValue = (typeof PROJECT_STATUSES)[number];

export const statusLabels = (t: Translator) => ({
	InProgress: t("status.inProgress"),
	Done: t("status.done"),
	Archived: t("status.archived"),
});
```

- [ ] **Étape 5 : vérifier le succès**

```bash
pnpm vitest run lib/status.test.ts
```

Attendu : PASS.

- [ ] **Étape 6 : convertir les autres modules de libellés**

Même transformation, signature `(t: Translator) => Record<…, string>` :

```ts
// lib/training.ts
export const TRAININGS = ["FullstackAI", "AIEngineer"] as const;
export type Training = (typeof TRAININGS)[number];

export const trainingLabels = (t: Translator) => ({
	FullstackAI: t("training.labels.fullstackAI"),
	AIEngineer: t("training.labels.aiEngineer"),
});

/** Message ICU : le gabarit est traduit, les paramètres sont injectés par next-intl. */
export const trainingBadge = (t: Translator, training: Training) =>
	t("training.badge", { course: trainingLabels(t)[training] });

export const trainingBadgeShort = (t: Translator, training: Training) =>
	t("training.badgeShort", { course: trainingLabels(t)[training] });

export const isTraining = (v: unknown): v is Training =>
	typeof v === "string" && (TRAININGS as readonly string[]).includes(v);

export const looksLikeOpenClassrooms = (repoName: string) =>
	/^(oc[-_]|p\d+[-_])/i.test(repoName);
```

```ts
// lib/practices.ts — PRACTICE_FAMILY, PRACTICES, PRACTICES_OF restent inchangés
import type { Translator } from "@/i18n/translator";

export const practiceLabels = (t: Translator) => ({
	ContinuousIntegration: t("practices.continuousIntegration"),
	Containerization: t("practices.containerization"),
	ContinuousDeployment: t("practices.continuousDeployment"),
	AutomatedTesting: t("practices.automatedTesting"),
	Observability: t("practices.observability"),
	DependencyUpdates: t("practices.dependencyUpdates"),
	StaticAnalysis: t("practices.staticAnalysis"),
	SecretsManagement: t("practices.secretsManagement"),
	Hardening: t("practices.hardening"),
	ExperimentTracking: t("practices.experimentTracking"),
	ModelRegistry: t("practices.modelRegistry"),
	DataVersioning: t("practices.dataVersioning"),
	ModelServing: t("practices.modelServing"),
	LlmEvaluation: t("practices.llmEvaluation"),
});
```

```ts
// lib/domains.ts — AI_DOMAINS, AiDomain et isAiDomain inchangés
import type { Translator } from "@/i18n/translator";

export const domainLabels = (t: Translator) => ({
	DataAnalysis: t("domains.dataAnalysis"),
	ML: "ML",
	Classifier: t("domains.classifier"),
	Regressor: t("domains.regressor"),
	LLM: "LLM",
	Vision: "Vision",
	NLP: "NLP",
	Agents: t("domains.agents"),
	Speech: t("domains.speech"),
});
```

`ML`, `LLM`, `Vision` et `NLP` restent en dur : ce sont des acronymes и anglicismes techniques identiques dans les
trois langues, les traduire n'apporterait rien et risquerait de les déformer.

```ts
// content/map-clusters.ts
export const clusterLabels = (t: Translator): Record<string, string> => ({
	c1: t("clusters.c1"),
	c2: t("clusters.c2"),
	c3: t("clusters.c3"),
	c4: t("clusters.c4"),
	c5: t("clusters.c5"),
});
```

- [ ] **Étape 7 : convertir `PARCOURS` et `INSTRUMENTS`**

`PARCOURS` devient une fonction qui prend les traductions, car ce sont des paragraphes :

```ts
// lib/about.ts
export const ageOn = (date: Date, birth = "1993-05-01"): number => {
	const born = new Date(birth);
	let age = date.getUTCFullYear() - born.getUTCFullYear();
	const monthDiff = date.getUTCMonth() - born.getUTCMonth();
	if (
		monthDiff < 0 ||
		(monthDiff === 0 && date.getUTCDate() < born.getUTCDate())
	) {
		age--;
	}
	return age;
};

export const parcours = (t: Translator): Step[] =>
	["2015-2022", "2023-2024", "2024-11", "2025-2026", "2026-01"].map(
		(year, index) => ({
			year,
			title: t(`parcours.step${index}.title`),
			description: t(`parcours.step${index}.description`),
		}),
	);
```

`INSTRUMENTS` garde sa structure de groupement (les noms d'outils sont des marques) et ne traduit que les 4 titres
de groupe :

```ts
// lib/instruments.ts
export const instrumentGroupLabels = (t: Translator) => ({
	dataMl: t("instruments.dataMl"),
	backend: t("instruments.backend"),
	frontend: t("instruments.frontend"),
	devops: t("instruments.devops"),
});
```

- [ ] **Étape 8 : alimenter les clés dans les trois dictionnaires**

Ajouter à `fr.json` : `status`, `training`, `practices`, `domains`, `clusters`, `instruments`, `parcours`.

Ajouter à `en.json` et `zh.json` les mêmes clés, traduites. Exemple pour `training` :

```json
	"training": {
		"labels": {
			"fullstackAI": "Développeur FullStack IA",
			"aiEngineer": "AI Engineer"
		},
		"badge": "Projet de formation · OpenClassrooms · {course}",
		"badgeShort": "Formation OC · {course}"
	},
```

```json
	"training": {
		"labels": {
			"fullstackAI": "Full-Stack AI Developer",
			"aiEngineer": "AI Engineer"
		},
		"badge": "Training project · OpenClassrooms · {course}",
		"badgeShort": "OC training · {course}"
	},
```

```json
	"training": {
		"labels": {
			"fullstackAI": "全栈 AI 开发工程师",
			"aiEngineer": "AI 工程师"
		},
		"badge": "培训项目 · OpenClassrooms · {course}",
		"badgeShort": "OC 培训 · {course}"
	},
```

> ICU utilise des apostrophes simples comme échappement. Si une traduction française contient une apostrophe dans
> un message paramétré, l'échapper en `''` ou utiliser `{'}'`.

- [ ] **Étape 9 : mettre à jour les appelants**

Dans chaque composant serveur qui consommait ces constantes :

```tsx
import { getTranslations } from "next-intl/server";

const t = await getTranslations("status");
const labels = statusLabels(t);
```

et remplacer `STATUS_LABELS[x]` par `labels[x]`, `PRACTICE_LABELS[x]` par `practices[x]`, etc.

Pour `content/map-clusters.ts`, les appelants (`app/[locale]/articles/[slug]/page.tsx` et le composant carnet)
deviennent :

```tsx
const t = await getTranslations("clusters");
const view = toMapView(map, clusterLabels(t));
```

- [ ] **Étape 10 : mettre à jour les tests des dictionnaires**

`lib/training.test.ts`, `lib/about.test.ts` et `lib/carnet/map-build.test.ts` doivent construire leur traducteur
comme à l'étape 1 et asserter sur `messages/fr.json`.

- [ ] **Étape 11 : vérifier**

```bash
pnpm vitest run lib/status.test.ts lib/training.test.ts lib/about.test.ts lib/carnet/map-build.test.ts
pnpm test 2>&1 | tail -15
```

Attendu : tout passe.

- [ ] **Étape 12 : commiter**

```bash
pnpm exec biome check --write lib content messages
git add lib content messages
git commit -m "refactor(lib): libellés exportés en fonctions de traducteur"
```

---

## Tâche 7 — Formatage régionalisé

**Fichiers :**
- Modifier : `lib/articles/format.ts`, `lib/carnet/search.ts`, `lib/carnet/explorer.ts`,
  `components/carnet/MapItemList.tsx`, `lib/contact-form.ts`

- [ ] **Étape 1 : écrire le test qui échoue**

Créer `lib/articles/format.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { formatDate, formatNumber, formatPercent, formatReadingTime } from "./format";

describe("formatage régionalisé", () => {
	it("formate une date selon la locale", () => {
		expect(formatDate("2026-10-07", "fr")).toBe("7 octobre 2026");
		expect(formatDate("2026-10-07", "en")).toBe("October 7, 2026");
	});

	it("formate un nombre selon la locale", () => {
		expect(formatNumber(1234, 0, "fr")).toBe("1 234");
		expect(formatNumber(1234, 0, "en")).toBe("1,234");
	});

	it("formate un pourcentage selon la locale", () => {
		expect(formatPercent(199, 428, "fr")).toBe("46 %");
		expect(formatPercent(199, 428, "en")).toBe("46%");
	});

	it("compose le temps de lecture", () => {
		expect(formatReadingTime(4, "fr")).toBe("4 min de lecture");
		expect(formatReadingTime(4, "en")).toBe("4 min read");
		expect(formatReadingTime(4, "zh")).toBe("阅读时长 4 分钟");
	});
});
```

- [ ] **Étape 2 : vérifier l'échec**

```bash
pnpm vitest run lib/articles/format.test.ts
```

Attendu : ÉCHEC — `formatDate` n'est pas exporté.

- [ ] **Étape 3 : réécrire `lib/articles/format.ts`**

```ts
const dateFormatter = (locale: string) =>
	new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	});

/** "2026-10-07" → "7 octobre 2026" (fr) / "October 7, 2026" (en). */
export function formatDate(isoDate: string, locale: string): string {
	return dateFormatter(locale).format(new Date(`${isoDate}T00:00:00Z`));
}

/** 19.4 → "19,4" (fr) ; 1234 → "1 234" (fr) / "1,234" (en). */
export function formatNumber(
	value: number,
	maxFractionDigits = 1,
	locale = "fr",
): string {
	return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
}

/** (199, 428) → "46 %" (fr, espace insécable) / "46%" (en). */
export function formatPercent(
	part: number,
	total: number,
	locale = "fr",
): string {
	const pct = total > 0 ? Math.round((part / total) * 100) : 0;
	if (pct === 0 && part > 0) return formatNumber(0, 0, locale).replace("0", "< 1");
	return `${formatNumber(pct, 0, locale)} %`;
}

export function formatReadingTime(minutes: number, locale = "fr"): string {
	if (locale === "zh") return `阅读时长 ${minutes} 分钟`;
	return locale === "en" ? `${minutes} min read` : `${minutes} min de lecture`;
}
```

Ajouter à `fr.json` / `en.json` / `zh.json` :

```json
	"readingTime": { "minutes": "{minutes} min de lecture" }
```

```json
	"readingTime": { "minutes": "{minutes} min read" }
```

```json
	"readingTime": { "minutes": "阅读时长 {minutes} 分钟" }
```

- [ ] **Étape 4 : vérifier le succès**

```bash
pnpm vitest run lib/articles/format.test.ts
```

Attendu : PASS.

- [ ] **Étape 5 : mettre à jour `lib/carnet/search.ts` et `lib/carnet/explorer.ts`**

Dans `lib/carnet/search.ts:85`, remplacer la constante de module par une fonction :

```ts
export const scoreFormat = (locale: string) => new Intl.NumberFormat(locale);
```

Dans `lib/carnet/explorer.ts:105-110`, `announcement()` devient :

```ts
import type { Translator } from "@/i18n/translator";

export function announcement(view: ExplorerView, t: Translator): string {
	if (view.mode === "rest") return t("carnet.noResults");
	return t("carnet.resultCount", { count: view.results.length });
}
```

avec, dans les dictionnaires :

```json
	"carnet": {
		"noResults": "Aucun résultat",
		"resultCount": "{count, plural, =0 {Aucun résultat} one {# résultat} other {# résultats}}"
	}
```

La version anglaise :

```json
	"carnet": {
		"noResults": "No results",
		"resultCount": "{count, plural, =0 {No results} one {# result} other {# results}}"
	}
```

La version chinoise n'a pas de plurielfelon les règles de ICU, on utilise donc un message simple :

```json
	"carnet": {
		"noResults": "没有结果",
		"resultCount": "{count} 条结果"
	}
```

- [ ] **Étape 6 : mettre à jour `components/carnet/MapItemList.tsx`**

La seule modification nécessaire est le tri, qui passe de `localeCompare(x, "fr")` à la locale active :

```tsx
import { useLocale } from "next-intl";

export default function MapItemList({ items }: { items: MapPoint[] }) {
	const locale = useLocale();
	const sorted = [...items].sort((a, b) =>
		a.title.localeCompare(b.title, locale),
	);
	// …le reste du rendu de MapItemList est inchangé.
}
```

> `localeCompare` avec la locale n'est pas cosmétique : sans le deuxième argument, `zh` trie selon ses propres
> règles de collation, qui ordonnent autrement qu'en français.

- [ ] **Étape 7 : mettre à jour `lib/contact-form.ts`**

```ts
/** Résumé annoncé. Le pluriel est porté par ICU, pas par une condition. */
export function errorSummary(count: number, t: Translator): string {
	if (count <= 0) return "";
	return t("contact.errorSummary", { count });
}
```

```json
	"contact": { "errorSummary": "{count, plural, one {# champ à corriger} other {# champs à corriger}}" }
```

Équivalent anglais : `"{count, plural, one {# field to fix} other {# fields to fix}}"` ; chinois :
`"需修正 {count} 个字段"`.

- [ ] **Étape 8 : mettre à jour les appelants et vérifier**

```bash
grep -rn "formatDateFr\|formatNumberFr\|formatPercentFr\|formatReadingTime" "app/[locale]" components lib
```

Remplacer chaque appel par la version paramétrée, en passant la locale active
(`getLocale()` côté serveur, `useLocale()` côté client).

```bash
pnpm test 2>&1 | tail -15
pnpm build 2>&1 | tail -20
```

- [ ] **Étape 9 : commiter**

```bash
pnpm exec biome check --write lib components messages "app/[locale]"
git add lib components messages "app"
git commit -m "feat(i18n): formatage des dates, nombres et pluriels par locale"
```

---

## Tâche 8 — Littéraux JSX du site public

**Fichiers :**
- Modifier : `components/register/FilterBar.tsx`, `components/register/RegisterView.tsx`,
  `app/[locale]/Contact/page.tsx`, `app/[locale]/page.tsx`, `components/carnet/CarnetExplorer.tsx`,
  `components/Header/NavMenu.tsx`, `components/Header/Header.tsx`, `components/Footer/Footer.tsx`,
  `components/articles/*`, `components/theme/ThemeToggle.tsx`, `components/ErrorBoundary.tsx`,
  `components/ui/multi-select.tsx`, `components/notebook/FigureCaption.tsx`,
  `components/articles/mdx/*`
- Modifier : les trois dictionnaires

- [ ] **Étape 1 : naviguer et naturel**

Traiter les composants du plus dense au moins dense, en committant après chacun :
`FilterBar.tsx` (~20 chaînes) → `Contact/page.tsx` (~15) → `app/[locale]/page.tsx` (~7) →
`CarnetExplorer.tsx` (~6) → `Header`/`Footer` (~6) → le reste.

Pour un composant serveur :

```tsx
import { getTranslations } from "next-intl/server";

export default async function Page() {
	const t = await getTranslations("filterBar");
	return <input placeholder={t("searchPlaceholder")} />;
}
```

Pour un composant client :

```tsx
"use client";

import { useTranslations } from "next-intl";

export default function FilterBar() {
	const t = useTranslations("filterBar");
	return <input placeholder={t("searchPlaceholder")} />;
}
```

- [ ] **Étape 2 : traiter `NavMenu.tsx` (noms de navigation)**

Les libellés sortent du tableau de liens, qui devient une fonction :

```tsx
"use client";

import { useTranslations } from "next-intl";
import Link from "@/i18n/navigation";
import { usePathname } from "next-intl/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NavMenu() {
	const t = useTranslations("nav");
	const pathname = usePathname() ?? "/";

	const links = [
		{ href: "/", label: t("home") },
		{ href: "/articles", label: t("articles") },
		{ href: "/About", label: t("about") },
		{ href: "/Contact", label: t("contact") },
	];

	const isActive = (href: string) =>
		href === "/" ? pathname === "/" : pathname.startsWith(href);

	return (
		<nav aria-label={t("mainLabel")}>
			<ul className="flex flex-wrap items-center gap-0.5 sm:gap-1">
				{links.map((link) => {
					const active = isActive(link.href);
					return (
						<li key={link.href}>
							<Button
								asChild
								variant="ghost"
								size="sm"
								className={cn(
									"rounded-none border-b-2 border-transparent px-2 font-display text-sm font-semibold transition-colors sm:px-3",
									active
										? "border-primary text-foreground"
										: "text-ink-soft hover:border-paper-grid hover:text-foreground",
								)}
							>
								<Link
									href={link.href}
									aria-current={active ? "page" : undefined}
								>
									{link.label}
								</Link>
							</Button>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
```

> `usePathname` vient de `@/i18n/navigation` : il renvoie le chemin **sans** le préfixe de locale, ce qui est ce
> que veut `isActive`. Avec `usePathname` de `next/navigation`, `/en/articles` ne serait jamais reconnu comme actif.

et dans les dictionnaires :

```json
	"nav": {
		"mainLabel": "Navigation principale",
		"home": "Carnet",
		"articles": "Articles",
		"about": "À propos",
		"contact": "Contact"
	}
```

Version anglaise : `"mainLabel": "Main navigation"`, `"home": "Notebook"`, `"articles": "Articles"`,
`"about": "About"`, `"contact": "Contact"`.

Version chinoise : `"mainLabel": "主导航"`, `"home": "实验笔记"`, `"articles": "文章"`, `"about": "关于"`,
`"contact": "联系"`.

- [ ] **Étape 3 : traiter `Footer.tsx`**

```tsx
import Link from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function Footer() {
	const t = await getTranslations("footer");
	return (
		<footer className="mt-16 w-full border-t border-border/70">
			<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 font-mono text-xs text-ink-soft sm:px-6">
				<p>{t("credit", { year: new Date().getFullYear() })}</p>
				<nav
					aria-label={t("linksLabel")}
					className="flex items-center gap-4"
				>
					<Link
						href="/articles"
						className="rounded-sm hover:text-primary focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						{t("articles")}
					</Link>
					<a
						href="https://github.com/WillIsback/"
						className="rounded-sm hover:text-primary focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						GitHub
					</a>
				</nav>
			</div>
		</footer>
	);
}
```

et le dictionnaire :

```json
	"footer": {
		"credit": "Carnet tenu par William Derue · © {year}",
		"linksLabel": "Liens du pied de page",
		"articles": "Articles"
	}
```

Version anglaise : `"credit": "Lab notebook by William Derue · © {year}"`,
`"linksLabel": "Footer links"`, `"articles": "Articles"`.

Version chinoise : `"credit": "实验笔记由 William Derue 记录 · © {year}"`,
`"linksLabel": "页脚链接"`, `"articles": "文章"`.

`credit` devient un message ICU paramétré :
fr `"Carnet tenu par William Derue · © {year}"`,
en `"Lab notebook by William Derue · © {year}"`,
zh `"实验笔记由 William Derue 记录 · © {year}"`.

> Le lien GitHub reste un `<a>` : il pointe vers un site externe, pas vers une route interne.

- [ ] **Étape 4 : traiter `FigureCaption.tsx` et les composants MDX**

`Fig. {n} · ` devient un message :

```json
	"figure": { "label": "Fig. {n} · " }
```

```json
	"figure": { "label": "Fig. {n} · " }
```

```json
	"figure": { "label": "图 {n} · " }
```

Dans `components/articles/mdx/*.tsx`, les constantes `SCANS_LABEL`, `OTHER_LABEL`, les valeurs par défaut de
`caption` et `ariaLabel`, ainsi que `components/ui/multi-select.tsx:41` passent par `t`.

- [ ] **Étape 5 : mettre à jour les tests de rendu concernés**

`components/register/register.test.tsx`, `register-view.test.tsx`,
`components/carnet/explorer.test.tsx`, `components/carnet/map.test.tsx`,
`components/home/home-sections.test.tsx`, `components/notebook/notebook.test.tsx`,
`components/articles/mdx/figures.test.tsx` utilisent désormais `renderFr` et asserent sur les valeurs de
`messages/fr.json` plutôt que sur des chaînes magic.

Exemple :

```tsx
import fr from "@/messages/fr.json";
import { renderFr } from "@/tests/i18n-render";

const html = renderFr(<FilterBar /* … */ />);

it("affiche le libellé de recherche localisé", () => {
	expect(html).toContain(`placeholder="${fr.register.searchPlaceholder}"`);
});
```

- [ ] **Étape 6 : vérifier l'égalité des clés et la suite complète**

```bash
pnpm vitest run messages/message-parity.test.ts
pnpm test 2>&1 | tail -15
```

Attendu : parité OK, suite complète verte.

- [ ] **Étape 7 : commiter, un commit par composant traité**

```bash
pnpm exec biome check --write components messages
git add components messages
git commit -m "feat(i18n): libellés de la barre de filtres localisés"
```

Répéter pour `Contact`, l'accueil, le carnet, l'en-tête et le pied de page, le MDX.

---

## Tâche 9 — Articles par locale avec repli français

**Fichiers :**
- Modifier : `lib/articles/loader.ts`
- Modifier : `app/[locale]/articles/page.tsx`, `app/[locale]/articles/[slug]/page.tsx`
- Créer : `i18n/locale-dirs.test.ts`

- [ ] **Étape 1 : écrire le test qui échoue**

Créer `i18n/locale-dirs.test.ts` :

```ts
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { articlesDir, listArticleSlugs, readArticle } from "@/lib/articles/loader";

const root = process.cwd();

describe("répertoires d'articles par locale", () => {
	it("résout un dossier de locale existant, sinon le dossier français", () => {
		expect(articlesDir("fr")).toBe(path.join(root, "content", "articles"));
	});

	it("liste les slugs français à la racine", () => {
		const slugs = listArticleSlugs("fr");
		expect(slugs).toContain("neuf-agents-neuf-jours");
	});

	it("retombe sur le français quand la locale n'a pas de dossier", () => {
		expect(articlesDir("zh")).toBe(path.join(root, "content", "articles"));
	});

	it("signale qu'un article n'est pas traduit dans la locale demandée", () => {
		const result = readArticle("neuf-agents-neuf-jours", "en");
		expect(result.fallback).toBe(true);
		expect(result.article).not.toBeNull();
	});

	it("ne signale pas de repli pour le français", () => {
		const result = readArticle("neuf-agents-neuf-jours", "fr");
		expect(result.fallback).toBe(false);
	});

	it("lit une traduction quand elle existe", () => {
		if (!fs.existsSync(path.join(root, "content", "articles", "en"))) return;
		const result = readArticle("neuf-agents-neuf-jours", "en");
		expect(result.fallback).toBe(false);
	});
});
```

- [ ] **Étape 2 : vérifier l'échec**

```bash
pnpm vitest run i18n/locale-dirs.test.ts
```

Attendu : ÉCHEC — `articlesDir`, `listArticleSlugs` et `readArticle` n'existent pas.

- [ ] **Étape 3 : implémenter la résolution par locale dans `lib/articles/loader.ts`**

Ajouter en tête de fichier :

```ts
import { routing, type Locale } from "@/i18n/routing";

export const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

/** Dossier d'une locale, ou `null` si cette locale n'a pas encore de traductions. */
export function localeDir(locale: string): string | null {
	if (locale === routing.defaultLocale) return null;
	const dir = path.join(ARTICLES_DIR, locale);
	return fs.existsSync(dir) ? dir : null;
}

/** Dossier effectif : celui de la locale si les traductions existent, sinon le français. */
export function articlesDir(locale: string): string {
	return localeDir(locale) ?? ARTICLES_DIR;
}

export function listArticleSlugs(locale: string): string[] {
	return getArticleSlugs(articlesDir(locale));
}

export interface ResolvedArticle {
	article: Article | null;
	/** `true` quand l'article servi est en français alors qu'une autre langue était demandée. */
	fallback: boolean;
}

export function readArticle(slug: string, locale: string): ResolvedArticle {
	const dir = localeDir(locale);
	if (dir) {
		const translated = getArticleBySlug(slug, dir);
		if (translated) return { article: translated, fallback: false };
	}
	return { article: getArticleBySlug(slug, ARTICLES_DIR), fallback: dir !== null };
}
```

- [ ] **Étape 4 : vérifier le succès**

```bash
pnpm vitest run i18n/locale-dirs.test.ts
```

Attendu : les 5 tests non conditionnels passent ; celui de lecture d'une traduction passe par le `return`
précoc tant que `content/articles/en/` n'existe pas.

- [ ] **Étape 5 : croiser `generateStaticParams`**

Dans `app/[locale]/articles/[slug]/page.tsx` :

```tsx
export function generateStaticParams() {
	return routing.locales.flatMap((locale) =>
		listArticleSlugs(locale).map((slug) => ({ locale, slug })),
	);
}
```

et dans `generateMetadata` comme dans la page :

```tsx
const { locale, slug } = await params;
const { article, fallback } = readArticle(slug, locale);
if (!article) notFound();
setRequestLocale(locale);
```

`slug` reste le slug du français : une traduction partage le slug de l'original, ce qui préserve les liens et les
références de projet (`projects: [27]`).

- [ ] **Étape 6 : afficher l'avis de repli**

Dans le corps de la page, quand `fallback` est vrai :

```tsx
{fallback ? (
	<p className="rounded-sm border border-border/70 bg-muted/50 px-3 py-2 text-sm text-ink-soft">
		{t("fallbackNotice")}
	</p>
) : null}
```

et dans les dictionnaires :

```json
	"fallbackNotice": "Cet article n'est pas encore traduit dans cette langue. Version française ci-dessous."
```

```json
	"fallbackNotice": "This article has not been translated into this language yet. French version below."
```

```json
	"fallbackNotice": "本文尚未翻译成当前语言，以下为法语原文。"
```

Le même avis doit apparaître sur `app/[locale]/articles/page.tsx` dans la liste, à côté du titre de l'article non
traduit, pour que le lecteur sache avant de cliquer.

- [ ] **Étape 7 : passer le listing et la page en paramètre de locale**

`app/[locale]/articles/page.tsx` utilise `listArticleSlugs(locale)` au lieu de `getArticleSlugs()`, et
`latestArticles(3, articlesDir(locale))` côté accueil.

- [ ] **Étape 8 : vérifier**

```bash
pnpm test 2>&1 | tail -15
pnpm build 2>&1 | tail -20
```

Attendu : la compilation génère 3 × 2 = 6 pages d'articles.

- [ ] **Étape 9 : commiter**

```bash
pnpm exec biome check --write lib i18n messages "app/[locale]"
git add lib i18n messages "app"
git commit -m "feat(i18n): articles par locale avec repli sur le français"
```

---

## Tâche 10 — Traductions anglaise et chinoise des articles

**Fichiers :**
- Créer : `content/articles/en/neuf-agents-neuf-jours.mdx`, `content/articles/en/predire-sans-entrainer.mdx`,
  `content/articles/zh/neuf-agents-neuf-jours.mdx`, `content/articles/zh/predire-sans-entrainer.mdx`

- [ ] **Étape 1 : créer les dossiers et copier les en-têtes**

```bash
mkdir -p content/articles/en content/articles/zh
```

- [ ] **Étape 2 : rédiger `content/articles/en/neuf-agents-neuf-jours.mdx`**

Conserver le slug, les dates, les `projects`, et la structure MDX. Traduire `title`, `description`, `period`,
`status` et `tags` ainsi que le corps. Ne pas inventer de chiffres : les valeurs numériques du texte original sont
des résultats mesurés, elles se traduisent mais ne se recalculent pas.

```yaml
---
title: "Nine agents, nine days"
description: "A measured retrospective on a fleet of nine autonomous SRE agents."
date: "2026-10-07"
period: "27 Sept → 6 Oct 2026"
tags: ["Autonomous agents", "SRE", "Local LLM", "Observability", "Security"]
status: "Engagement closed"
projects: [27]
---
```

- [ ] **Étape 3 : rédiger `content/articles/zh/neuf-agents-neuf-jours.mdx`**

```yaml
---
title: "九个智能体，九天"
description: "对一支由九个自主 SRE 智能体组成的集群的实测复盘。"
date: "2026-10-07"
period: "2026 年 9 月 27 日 → 10 月 6 日"
tags: ["自主智能体", "SRE", "本地大模型", "可观测性", "安全"]
status: "已结束的项目"
projects: [27]
---
```

- [ ] **Étape 4 : traduire le second article dans les deux langues**

`predire-sans-entrainer.mdx` suit la même règle : slug, date et `projects` inchangés, texte traduit. Si l'article
n'est pas prêt pour une langue, **ne pas créer le fichier** : le repli de la tâche 9 affiche alors la version
française avec un avis, ce qui est préférable à une traduction approximative publiée comme telle.

- [ ] **Étape 5 : vérifier la parité et la compilation**

```bash
pnpm vitest run i18n/locale-dirs.test.ts messages/message-parity.test.ts
pnpm build 2>&1 | tail -20
```

Attendu : la compilation génère 6 pages d'articles, `readArticle(…, "en").fallback` vaut désormais `false`.

- [ ] **Étape 6 : commiter**

```bash
git add content/articles/en content/articles/zh
git commit -m "content(i18n): traductions anglaise et chinoise des articles"
```

---

## Tâche 11 — Typographie chinoise

**Fichiers :**
- Modifier : `app/[locale]/layout.tsx`, `app/globals.css`

- [ ] **Étape 1 : charger Noto Sans SC**

Dans `app/[locale]/layout.tsx`, ajouter :

```tsx
import { Noto_Sans_SC } from "next/font/google";

const notoSansSC = Noto_Sans_SC({
	subsets: ["latin"],
	weight: ["400", "500", "700"],
	variable: "--font-cjk",
	preload: false,
	display: "swap",
});
```

- [ ] **Étape 2 : appliquer la pile CJK quand la locale est `zh`**

Dans la classe du `<html>`, ajouter `${locale === "zh" ? notoSansSC.variable : ""}`.

Puis, dans `app/globals.css`, ajouter à la fin :

```css
/* Les polices du labo sont en sous-ensemble latin : les glyphes CJK exigent une pile dédiée. */
:lang(zh) {
	--font-source-serif: var(--font-cjk);
	--font-source-serif-italic: var(--font-cjk);
	--font-bricolage: var(--font-cjk);
	--font-caveat: var(--font-cjk);
}

:lang(zh) body,
:lang(zh) .font-display,
:lang(zh) .font-serif {
	font-family: var(--font-cjk), "PingFang SC", "Microsoft YaHei",
		"Noto Sans CJK SC", sans-serif;
}
```

- [ ] **Étape 3 : vérifier la compilation**

```bash
pnpm build 2>&1 | tail -20
```

Attendu : compilation réussie. Ouvrir `/zh` et `/en` et comparer le rendu des titres.

- [ ] **Étape 4 : commiter**

```bash
pnpm exec biome check --write "app/[locale]" app/globals.css
git add "app/[locale]" app/globals.css
git commit -m "feat(i18n): pile de polices CJK pour la locale chinoise"
```

---

## Tâche 12 — Métadonnées, alternats et JSON-LD

**Fichiers :**
- Modifier : `app/[locale]/articles/[slug]/page.tsx`, `app/[locale]/About/layout.tsx`,
  `app/[locale]/Contact/layout.tsx`, `app/[locale]/articles/page.tsx`

- [ ] **Étape 1 : paramétrer le JSON-LD**

Dans le `BlogPosting` de `app/[locale]/articles/[slug]/page.tsx`, remplacer `inLanguage: "fr-FR"` par la locale de la
page :

```ts
inLanguage: locale === "fr" ? "fr-FR" : locale === "en" ? "en-US" : "zh-CN",
```

- [ ] **Step 2 : écrire le `canonical` par locale**

```ts
const url =
	locale === routing.defaultLocale
		? `${SITE_URL}/articles/${article.slug}`
		: `${SITE_URL}/${locale}/articles/${article.slug}`;

return {
	title: `${article.title} | William Derue`,
	description: article.description,
	keywords: article.tags,
	alternates: { canonical: url },
	openGraph: {
		type: "article",
		locale: locale === "fr" ? "fr_FR" : locale === "en" ? "en_US" : "zh_CN",
		url,
		title: article.title,
		description: article.description,
		siteName: "Portfolio WillisBack",
		publishedTime: article.date,
		authors: ["William Derue"],
		tags: article.tags,
	},
};
```

- [ ] **Étape 2 : supprimer les `metadata` restants en doublon**

`app/[locale]/About/layout.tsx`, `app/[locale]/Contact/layout.tsx` et `app/[locale]/articles/page.tsx` ne doivent
plus porter de `metadata` codé en dur : le root layout fournit le titre et la description, et les URL canoniques
codées en dur disparaissent avec eux.

Si une page a besoin d'un `openGraph` propre, elle le déclare à partir des messages, jamais d'une chaîne en dur.

- [ ] **Étape 3 : vérifier la compilation et les alternats**

```bash
pnpm build 2>&1 | tail -20
pnpm start &
curl -s http://localhost:3000/ -H "accept-language: en" | grep -o 'hreflang="[a-zA-Z-]*"' | sort -u
curl -s http://localhost:3000/en/ | grep -o '<link rel="canonical"[^>]*>'
```

Attendu : la page française émet `hreflang="fr"`, `hreflang="en"`, `hreflang="zh"` et `hreflang="x-default"` ;
`/en/` renvoie un `canonical` vers `https://www.willisback.fr/en/...`.

- [ ] **Étape 4 : commiter**

```bash
pnpm exec biome check --write "app/[locale]"
git add "app/[locale]"
git commit -m "feat(i18n): métadonnées, canonical et JSON-LD par locale"
```

---

## Tâche 13 — Vérification finale

**Fichiers :** aucun

- [ ] **Étape 1 : formatage**

```bash
pnpm exec biome check --write .
```

- [ ] **Étape 2 : lint**

```bash
pnpm lint 2>&1 | tail -20
```

Attendu : aucune erreur.

- [ ] **Étape 3 : suite de tests complète**

```bash
pnpm test 2>&1 | tail -15
```

Attendu : 506 tests d'origine + les nouveaux, tous verts.

- [ ] **Étape 4 : compilation de production**

```bash
pnpm build 2>&1 | tail -30
```

Attendu : compilation réussie, 3× les pages publiques générées.

- [ ] **Étape 5 : contrôle manuel des trois langues**

```bash
pnpm start &
for url in / /en/ /zh/ /articles /en/articles /zh/articles /About /en/About /Contact /en/Contact; do
	printf "%-16s %s\n" "$url" "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$url)"
done
```

Attendu : `200` pour les onze URLs. `/en/About` doit répondre `200` — c'est le test qui garantit que la casse de
`About` et de `Contact` a survécu au déplacement.

- [ ] **Étape 6 : vérifier qu'aucune chaîne française n'est restée en dur sur le site public**

```bash
grep -rn "terminé\|archivé\|À propos\|En cours" "app/[locale]" components --include=*.tsx | grep -v test
```

Attendu : aucun résultat hors fichier de test.

- [ ] **Étape 7 : commiter**

```bash
git add -A
git commit -m "chore(i18n): formatage final"
```

---

## Récapitulatif de couverture

| Exigence de la spécification | Tâches |
|---|---|
| §1 next-intl 4.14 | 1 |
| §2 routage, `localePrefix`, arborescence, deux root layouts, casse, statique | 2, 3, 5 |
| §3 proxy composé | 2 |
| §4 messages, constantes → fonctions, formatage régionalisé | 6, 7, 8 |
| §5 articles par locale et repli | 9, 10 |
| §6 typographie chinoise | 11 |
| §7 tests | 4, 5, 7, 8, 9, 13 |
| §8 métadonnées, alternats, JSON-LD | 3, 12 |