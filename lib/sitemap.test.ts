import { describe, expect, it } from "vitest";
import { buildSitemap } from "./sitemap";

const S = "https://www.willisback.fr";
const none = { fr: [], en: [], zh: [] };
const urls = (map: ReturnType<typeof buildSitemap>) => map.map((e) => e.url);

describe("sitemap", () => {
	it("pages fixes : 4 pages × 3 locales, casse des canonicals", () => {
		const map = buildSitemap({ articles: none });
		expect(map).toHaveLength(12);
		expect(urls(map)).toContain(`${S}/About`);
		expect(urls(map)).toContain(`${S}/en/Contact`);
		expect(urls(map).some((u) => /\/(about|contact)$/.test(u))).toBe(false);
	});

	it("article traduit : une entrée par locale, hreflang complet", () => {
		const a = { slug: "syntheo-beta-0-7", date: "2026-11-10" };
		const map = buildSitemap({ articles: { fr: [a], en: [a], zh: [a] } });
		const entries = map.filter((e) => e.url.includes("/articles/syntheo"));
		expect(entries).toHaveLength(3);
		const fr = entries.find((e) => e.url === `${S}/articles/syntheo-beta-0-7`);
		expect(fr?.lastModified).toBe("2026-11-10");
		expect(fr?.alternates?.languages).toEqual({
			fr: `${S}/articles/syntheo-beta-0-7`,
			en: `${S}/en/articles/syntheo-beta-0-7`,
			zh: `${S}/zh/articles/syntheo-beta-0-7`,
			"x-default": `${S}/articles/syntheo-beta-0-7`,
		});
	});

	it("article non traduit : seulement la version française", () => {
		const a = { slug: "seul", date: "2026-01-01" };
		const map = buildSitemap({ articles: { fr: [a], en: [], zh: [] } });
		const entries = map.filter((e) => e.url.includes("/articles/seul"));
		expect(entries).toHaveLength(1);
		expect(urls(map).some((u) => u.includes("/zh/articles/"))).toBe(false);
		expect(entries[0].alternates?.languages).toEqual({
			fr: `${S}/articles/seul`,
			"x-default": `${S}/articles/seul`,
		});
	});

	it("jamais l'admin ni l'API", () => {
		const a = { slug: "x", date: "2026-01-01" };
		const map = buildSitemap({ articles: { fr: [a], en: [a], zh: [] } });
		expect(urls(map).some((u) => /\/(admin|api)(\/|$)/.test(u))).toBe(false);
	});
});
