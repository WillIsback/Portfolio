import type { Metadata } from "next";
import { type Locale, routing } from "@/i18n/routing";

/** Origine canonique du site, sans barre oblique finale. */
export const SITE_URL = "https://www.willisback.fr";

/**
 * Locale OpenGraph (`fr` → `fr_FR`) et langue du document Schema.org (`fr` → `fr-FR`).
 *
 * Tables fermées plutôt qu'une cascade ternaire : une locale inconnue doit casser
 * bruyamment (elle n'est pas dans `Record<Locale, …>`), pas être étiquetée `zh_CN`.
 */
const OG_LOCALES: Record<Locale, string> = {
	fr: "fr_FR",
	en: "en_US",
	zh: "zh_CN",
};

const IN_LANGUAGES: Record<Locale, string> = {
	fr: "fr-FR",
	en: "en-US",
	zh: "zh-CN",
};

export function ogLocale(locale: Locale): string {
	return OG_LOCALES[locale];
}

export function inLanguage(locale: Locale): string {
	return IN_LANGUAGES[locale];
}

/**
 * URL absolue d'une route dans une locale.
 *
 * Le français vit à la racine (`localePrefix: "as-needed"`), les autres sous `/<locale>` :
 * `canonicalUrl("fr", "/articles")` → `https://www.willisback.fr/articles`,
 * `canonicalUrl("en", "/articles")` → `https://www.willisback.fr/en/articles`.
 */
export function canonicalUrl(locale: Locale, path = ""): string {
	const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
	return `${SITE_URL}${prefix}${path}`;
}

/**
 * `alternates.languages` pour une route : une entrée par locale déclarée, plus
 * `x-default` sur la locale par défaut. Dérivé de `routing.locales`, donc ajouter une
 * locale met les `hreflang` à jour sans toucher aux pages.
 */
export function languageAlternates(path = ""): Record<string, string> {
	return {
		...Object.fromEntries(
			routing.locales.map((locale) => [locale, canonicalUrl(locale, path)]),
		),
		"x-default": canonicalUrl(routing.defaultLocale, path),
	};
}

/**
 * Métadonnées d'une page éditoriale : titre, description, canonical par locale et
 * `hreflang`. Évite que chaque page recâble les mêmes champs — et qu'un oubli laisse
 * une page hériter du canonical de l'accueil.
 */
export function pageMetadata(
	locale: Locale,
	path: string,
	content: { title: string; description: string },
): Metadata {
	const url = canonicalUrl(locale, path);
	return {
		title: content.title,
		description: content.description,
		alternates: { canonical: url, languages: languageAlternates(path) },
		openGraph: {
			type: "website",
			locale: ogLocale(locale),
			url,
			title: content.title,
			description: content.description,
			siteName: "Portfolio WillisBack",
		},
		twitter: {
			card: "summary_large_image",
			title: content.title,
			description: content.description,
		},
	};
}
