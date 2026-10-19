import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Le segment `[locale]` ne reste statique que si chaque page et chaque layout y appelle
 * `setRequestLocale()` avant de rendre.
 *
 * En effet `getRequestLocale()` vaut `getCachedRequestLocale() || await headers()`, et
 * `headers()` n'est évité que si `setRequestLocale()` a tourné dans le même scope React
 * `cache()`. Next rend le sous-arbre page avant le corps du root layout, donc le
 * `setRequestLocale()` du layout arrive trop tard pour les pages. Oublier l'appel sur
 * une page fait passer sa route de `●` à `ƒ` — en silence, noyé dans la quarantaine de
 * lignes de sortie du build.
 *
 * La tâche 8 passe le site public en `useTranslations`, donc en plein dans la fenêtre
 * où l'appel se perd. D'où ce filet.
 *
 * Seule exception tolérée : un composant client (`"use client"`), qui lit la locale
 * dans `NextIntlClientProvider` au lieu du contexte serveur — c'est le cas de
 * `Contact/page.tsx` avant la séparation serveur/client, et de `not-found.tsx`.
 */

const LOCALE_SEGMENT = path.join(process.cwd(), "app", "[locale]");
const ROUTE_FILES = new Set(["page.tsx", "layout.tsx"]);

/** Tous les `page.tsx` et `layout.tsx` sous `app/[locale]/`, récursivement. */
function routeModules(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return routeModules(full);
		return ROUTE_FILES.has(entry.name) ? [full] : [];
	});
}

const modules = routeModules(LOCALE_SEGMENT).sort();

/** `setRequestLocale(`, ou un composant client qui n'en a pas besoin. */
function optsIntoStaticRendering(file: string): boolean {
	const source = readFileSync(file, "utf8");
	return (
		source.trimStart().startsWith('"use client"') ||
		source.includes("setRequestLocale(")
	);
}

describe("rendu statique du segment [locale]", () => {
	it("découvre bien les modules de route du segment", () => {
		// Garde-fou : une globber cassée donnerait un `it.each` vide, donc vert.
		expect(modules.map((file) => path.relative(process.cwd(), file))).toEqual([
			"app/[locale]/About/page.tsx",
			"app/[locale]/Contact/page.tsx",
			"app/[locale]/articles/[slug]/page.tsx",
			"app/[locale]/articles/layout.tsx",
			"app/[locale]/articles/page.tsx",
			"app/[locale]/layout.tsx",
			"app/[locale]/page.tsx",
		]);
	});

	it.each(
		modules.map((file) => [path.relative(process.cwd(), file), file]),
	)('%s appelle setRequestLocale() ou commence par "use client"', (_label, file) => {
		expect(
			optsIntoStaticRendering(file as string),
			`${file as string} : ni setRequestLocale() ni "use client". Sa route basculera de ● à ƒ sans erreur de build.`,
		).toBe(true);
	});
});
