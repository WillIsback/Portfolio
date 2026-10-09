import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Instruments from "./Instruments";
import LatestEntries from "./LatestEntries";

const article = (slug: string, date: string) => ({
	slug,
	title: `Titre ${slug}`,
	description: "Résumé en une phrase.",
	date,
	tags: ["SRE"],
	readingTimeMinutes: 7,
});

describe("LatestEntries", () => {
	it("liste les entrées datées en Fira Code, avec temps de lecture et thèmes", () => {
		const html = renderToStaticMarkup(
			<LatestEntries articles={[article("a", "2026-10-07")]} />,
		);
		expect(html).toContain('<time dateTime="2026-10-07"');
		expect(html).toContain("font-mono");
		expect(html).toContain("7 octobre 2026");
		expect(html).toContain('href="/articles/a"');
		expect(html).toContain("7\u00a0min de lecture");
		expect(html).toContain("SRE");
		expect(html).toContain('href="/articles"');
	});

	it("ne rend rien sans article", () => {
		expect(renderToStaticMarkup(<LatestEntries articles={[]} />)).toBe("");
	});
});

describe("Instruments", () => {
	const html = renderToStaticMarkup(<Instruments />);

	it("rend quatre lignes titrées avec le détail derrière une divulgation", () => {
		expect(html.match(/<h3/g)?.length).toBe(4);
		expect(html.match(/<details/g)?.length).toBe(4);
		expect(html).toContain("voir le détail");
	});

	it("n'anime rien (plus de cubes empilés)", () => {
		expect(html).not.toContain("animate-");
		expect(html).not.toContain("transition-all");
	});
});
