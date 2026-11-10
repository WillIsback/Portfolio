import type { MetadataRoute } from "next";
import { type Locale, routing } from "@/i18n/routing";
import { canonicalUrl } from "@/lib/seo";

export interface SitemapArticle {
	slug: string;
	/** Date du frontmatter (`YYYY-MM-DD`), reprise telle quelle en `lastModified`. */
	date: string;
}

/** Pages servies dans toutes les locales. La casse suit les canonicals (`/About`). */
const FIXED_PATHS = ["", "/About", "/Contact", "/articles"] as const;

/**
 * Entrées d'une page pour les seules locales où elle existe. Chacune annonce les
 * mêmes `hreflang`, limités à ces locales, et `x-default` sur la locale par défaut
 * (ou la première disponible si la page n'existe pas en français).
 */
function entriesFor(
	path: string,
	locales: readonly Locale[],
	lastModified?: string,
): MetadataRoute.Sitemap {
	if (locales.length === 0) return [];
	const fallback = locales.includes(routing.defaultLocale)
		? routing.defaultLocale
		: locales[0];
	const languages: Record<string, string> = {
		...Object.fromEntries(locales.map((l) => [l, canonicalUrl(l, path)])),
		"x-default": canonicalUrl(fallback, path),
	};
	return locales.map((locale) => ({
		url: canonicalUrl(locale, path),
		...(lastModified ? { lastModified } : {}),
		alternates: { languages },
	}));
}

/**
 * Sitemap multilingue. `articles` ne contient, par locale, que les articles
 * réellement écrits dans cette langue : une version servie en repli français
 * n'a pas sa place dans le sitemap.
 */
export function buildSitemap(input: {
	articles: Record<Locale, SitemapArticle[]>;
}): MetadataRoute.Sitemap {
	const fixed = FIXED_PATHS.flatMap((path) =>
		entriesFor(path, routing.locales),
	);

	const bySlug = new Map<string, { date: string; locales: Locale[] }>();
	for (const locale of routing.locales) {
		for (const { slug, date } of input.articles[locale]) {
			const entry = bySlug.get(slug) ?? { date, locales: [] };
			if (locale === routing.defaultLocale) entry.date = date;
			entry.locales.push(locale);
			bySlug.set(slug, entry);
		}
	}
	const articles = [...bySlug].flatMap(([slug, { date, locales }]) =>
		entriesFor(`/articles/${slug}`, locales, date),
	);

	return [...fixed, ...articles];
}
