import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { SOLUTION_SLUGS, SOLUTIONS, solutionCopy } from "@/lib/solutions";
import { escapeHtml, renderLocale } from "@/tests/i18n-render";
import { highlightFaults } from "./CorrectionDemo";
import SolutionCard from "./SolutionCard";
import SolutionPage from "./SolutionPage";

describe("highlightFaults", () => {
	it("souligne chaque mot fautif dans l'ordre, une seule fois", () => {
		expect(
			highlightFaults("Elle est ruiné, ils mange.", ["ruiné", "mange"]),
		).toEqual([
			{ text: "Elle est ", fault: false },
			{ text: "ruiné", fault: true },
			{ text: ", ils ", fault: false },
			{ text: "mange", fault: true },
			{ text: ".", fault: false },
		]);
	});

	it("ignore un mot absent sans perdre le texte", () => {
		const parts = highlightFaults("Tout va bien.", ["absent"]);
		expect(parts).toEqual([{ text: "Tout va bien.", fault: false }]);
	});
});

const cases = SOLUTION_SLUGS.flatMap((slug) =>
	routing.locales.map((locale) => [slug, locale] as const),
);

describe("SolutionPage", () => {
	it.each(
		cases,
	)("%s en %s : promesse, site officiel, code et article", (slug, locale) => {
		const facts = SOLUTIONS[slug];
		const copy = solutionCopy(slug, locale);
		const html = renderLocale(
			locale,
			<SolutionPage facts={facts} copy={copy} />,
		);
		expect(html).toContain(`<h1`);
		expect(html).toContain(escapeHtml(copy.tagline));
		expect(html).toContain(`href="${facts.site}"`);
		expect(html).toContain(`href="${facts.github}"`);
		expect(html).toContain(`/articles/${facts.articleSlug}"`);
		for (const f of copy.features) expect(html).toContain(escapeHtml(f.title));
	});

	it("montre la capture de Syntheo et la démonstration de Grammaria", () => {
		const syntheo = renderLocale(
			"fr",
			<SolutionPage
				facts={SOLUTIONS.syntheo}
				copy={solutionCopy("syntheo", "fr")}
			/>,
		);
		expect(syntheo).toContain("syntheo-note-light.png");
		expect(syntheo).toContain("syntheo-note-dark.png");

		const grammaria = renderLocale(
			"en",
			<SolutionPage
				facts={SOLUTIONS.grammaria}
				copy={solutionCopy("grammaria", "en")}
			/>,
		);
		expect(grammaria).toContain("ACCORD_SUJET_VERBE");
		expect(grammaria).toContain('lang="fr"');
		// La faute et sa correction se distinguent aussi pour un lecteur d'écran.
		expect(grammaria).toMatch(
			/<del[^>]*>[\s\S]*?Mistake:[\s\S]*?mange[\s\S]*?<\/del>/,
		);
		expect(grammaria).toMatch(
			/<ins[^>]*>[\s\S]*?Correction:[\s\S]*?mangent[\s\S]*?<\/ins>/,
		);
	});
});

describe("SolutionCard", () => {
	it("mène à la page produit et au site officiel", () => {
		const html = renderLocale(
			"fr",
			<SolutionCard
				facts={SOLUTIONS.grammaria}
				copy={solutionCopy("grammaria", "fr")}
			/>,
		);
		expect(html).toContain('href="/solutions/grammaria"');
		expect(html).toContain('href="https://grammaria.fr"');
		expect(html).toContain("Découvrir Grammaria");
	});
});
