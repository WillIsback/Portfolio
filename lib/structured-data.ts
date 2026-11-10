import type { Locale } from "@/i18n/routing";
import { canonicalUrl, inLanguage, SITE_URL } from "@/lib/seo";

/** Identifiants d'entité stables : les autres blocs JSON-LD s'y réfèrent par `@id`. */
export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Profils publics de la même personne (`sameAs`). */
const PROFILES = [
	"https://github.com/WillIsback",
	"https://www.linkedin.com/in/williamderue/",
];

/**
 * La personne derrière le site. Relie « William Derue », « WillisBack » et les
 * profils publics à une seule entité.
 */
export function personJsonLd(
	locale: Locale,
	jobTitle: string,
): Record<string, unknown> {
	return {
		"@context": "https://schema.org",
		"@type": "Person",
		"@id": PERSON_ID,
		name: "William Derue",
		alternateName: ["WillisBack", "willisback"],
		url: SITE_URL,
		image: `${SITE_URL}/william-derue.png`,
		sameAs: PROFILES,
		jobTitle,
		mainEntityOfPage: canonicalUrl(locale, "/About"),
	};
}

/** Le site lui-même, dans la locale de la page, publié par la personne. */
export function websiteJsonLd(locale: Locale): Record<string, unknown> {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		"@id": WEBSITE_ID,
		name: "WillisBack",
		alternateName: ["William Derue", "Will Is Back"],
		url: canonicalUrl(locale),
		inLanguage: inLanguage(locale),
		publisher: { "@id": PERSON_ID },
	};
}
