import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import {
	canonicalUrl,
	inLanguage,
	languageAlternates,
	ogLocale,
	pageMetadata,
	SITE_URL,
} from "./seo";

/**
 * `lib/seo.ts` est la source unique des URL canoniques et des liens alternés.
 * Une régression ici est invisible en test de rendu : elle n'apparaît que dans
 * les balises `<link>` de la page produite, donc jamais dans la suite.
 */

describe("URL canonique par locale", () => {
	it("laisse le français sans préfixe", () => {
		expect(canonicalUrl("fr")).toBe(SITE_URL);
		expect(canonicalUrl("fr", "/articles/neuf-agents-neuf-jours")).toBe(
			`${SITE_URL}/articles/neuf-agents-neuf-jours`,
		);
	});

	it("préfixe les autres locales", () => {
		expect(canonicalUrl("en")).toBe(`${SITE_URL}/en`);
		expect(canonicalUrl("zh", "/About")).toBe(`${SITE_URL}/zh/About`);
	});

	it("ne double jamais la barre oblique", () => {
		for (const locale of routing.locales) {
			expect(canonicalUrl(locale, "/articles")).not.toContain("//articles");
			expect(canonicalUrl(locale, "")).not.toMatch(/\/$/);
		}
	});
});

describe("liens alternés", () => {
	it("couvre les trois locales plus x-default", () => {
		expect(Object.keys(languageAlternates("/articles"))).toEqual([
			"fr",
			"en",
			"zh",
			"x-default",
		]);
	});

	it("pointe x-default sur le français, sans préfixe", () => {
		const alternates = languageAlternates("/articles");
		expect(alternates["x-default"]).toBe(alternates.fr);
		expect(alternates.fr).toBe(`${SITE_URL}/articles`);
	});

	it("donne une URL distincte par locale réelle", () => {
		// `x-default` reprend volontairement l'URL française : trois URL distinctes.
		const distinct = new Set([
			languageAlternates("/articles").fr,
			languageAlternates("/articles").en,
			languageAlternates("/articles").zh,
		]);
		expect(distinct.size).toBe(3);
	});

	it("suit `routing.locales` : ajouter une locale sans lien alterné échoue", () => {
		const alternates = languageAlternates();
		for (const locale of routing.locales) {
			expect(alternates[locale]).toBeDefined();
		}
	});
});

describe("étiquettes de langue", () => {
	it("donne le code OpenGraph complet de chaque locale", () => {
		expect(ogLocale("fr")).toBe("fr_FR");
		expect(ogLocale("en")).toBe("en_US");
		expect(ogLocale("zh")).toBe("zh_CN");
	});

	it("donne le code BCP-47 complet de chaque locale", () => {
		expect(inLanguage("fr")).toBe("fr-FR");
		expect(inLanguage("en")).toBe("en-US");
		expect(inLanguage("zh")).toBe("zh-CN");
	});

	it("couvre exactement les locales du routage", () => {
		for (const locale of routing.locales) {
			expect(ogLocale(locale)).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
			expect(inLanguage(locale)).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
		}
	});
});

describe("marque", () => {
	it("nomme le site WillisBack dans OpenGraph", () => {
		const meta = pageMetadata("fr", "/About", { title: "t", description: "d" });
		expect(meta.openGraph?.siteName).toBe("WillisBack");
	});
});

describe("image de partage des pages éditoriales", () => {
	// `pageMetadata` redéfinit `openGraph` : l'image héritée du layout est perdue,
	// il faut donc la redéclarer ici.
	it("annonce l'image du site dans la locale, pour OpenGraph et Twitter", () => {
		const meta = pageMetadata("en", "/About", { title: "t", description: "d" });
		const image = {
			url: `${SITE_URL}/en/opengraph-image`,
			width: 1200,
			height: 630,
		};
		expect(meta.openGraph?.images).toEqual([image]);
		expect(meta.twitter?.images).toEqual([image]);
		expect(
			pageMetadata("fr", "/Contact", { title: "t", description: "d" }).openGraph
				?.images,
		).toEqual([{ ...image, url: `${SITE_URL}/fr/opengraph-image` }]);
	});
});

describe("liens alternés limités aux locales existantes", () => {
	it("n'annonce que les locales données, x-default sur le français", () => {
		expect(languageAlternates("/articles/seul", ["fr"])).toEqual({
			fr: `${SITE_URL}/articles/seul`,
			"x-default": `${SITE_URL}/articles/seul`,
		});
	});

	it("sans français, x-default vise la première locale disponible", () => {
		expect(languageAlternates("/articles/x", ["en", "zh"])).toEqual({
			en: `${SITE_URL}/en/articles/x`,
			zh: `${SITE_URL}/zh/articles/x`,
			"x-default": `${SITE_URL}/en/articles/x`,
		});
	});
});
