import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { articleLocales } from "@/lib/articles/loader";
import {
	isSolutionSlug,
	SOLUTION_SLUGS,
	SOLUTIONS,
	solutionCopy,
} from "./solutions";

const cases = SOLUTION_SLUGS.flatMap((slug) =>
	routing.locales.map((locale) => [slug, locale] as const),
);

describe("solutions", () => {
	it("reconnaît les seuls slugs publiés", () => {
		expect(isSolutionSlug("syntheo")).toBe(true);
		expect(isSolutionSlug("grammaria")).toBe(true);
		expect(isSolutionSlug("Syntheo")).toBe(false);
		expect(isSolutionSlug("constructor")).toBe(false);
	});

	it.each(SOLUTION_SLUGS)("%s : faits cohérents", (slug) => {
		const facts = SOLUTIONS[slug];
		expect(facts.slug).toBe(slug);
		expect(facts.site).toBe(`https://${facts.siteLabel}`);
		expect(facts.github).toMatch(/^https:\/\/github\.com\/WillIsback\//);
	});

	it.each(
		SOLUTION_SLUGS,
	)("%s : l'article du carnet existe dans les trois langues", (slug) => {
		expect(articleLocales(SOLUTIONS[slug].articleSlug)).toEqual([
			...routing.locales,
		]);
	});

	it.each(SOLUTION_SLUGS)("%s : les captures existent", (slug) => {
		const visual = SOLUTIONS[slug].visual;
		if (visual.kind !== "screenshot") return;
		for (const file of [visual.light, visual.dark]) {
			expect(existsSync(path.join(process.cwd(), "public", file))).toBe(true);
		}
	});

	it.each(cases)("%s en %s : aucun texte vide", (slug, locale) => {
		const copy = solutionCopy(slug, locale);
		const strings = [
			copy.tagline,
			copy.summary,
			copy.status,
			copy.stack,
			copy.visualAlt,
			copy.visualCaption,
			...copy.privacy,
			...copy.limits,
			...copy.audience.flatMap((a) => [a.title, a.text]),
			...copy.features.flatMap((f) => [f.title, f.text]),
			...copy.figures.flatMap((f) => [f.value, f.label]),
		];
		for (const s of strings) expect(s.trim()).not.toBe("");
		expect(copy.features.length).toBeGreaterThanOrEqual(3);
	});

	it.each(
		SOLUTION_SLUGS,
	)("%s : même structure dans toutes les langues", (slug) => {
		const shape = (locale: (typeof routing.locales)[number]) => {
			const c = solutionCopy(slug, locale);
			return [
				c.audience.length,
				c.features.length,
				c.privacy.length,
				c.figures.length,
				c.limits.length,
				c.demo?.faults.length ?? 0,
			];
		};
		for (const locale of routing.locales)
			expect(shape(locale)).toEqual(shape(routing.defaultLocale));
	});

	it("la démonstration de Grammaria pointe des mots présents dans la phrase", () => {
		for (const locale of routing.locales) {
			const demo = solutionCopy("grammaria", locale).demo;
			expect(demo).toBeDefined();
			for (const fault of demo?.faults ?? [])
				expect(demo?.input).toContain(` ${fault.wrong}`);
		}
	});
});
