import { describe, expect, it } from "vitest";
import { numberFigures } from "./figures";

describe("numberFigures", () => {
	it("numérote les figures dans l'ordre d'apparition", () => {
		const src =
			'Intro\n\n<TasksChart days={[]} caption="A" />\n\ntexte\n\n<TokensChart\n  profiles={[]}\n/>\n\n<FaultBuckets items={[]} />\n';
		const out = numberFigures(src);
		expect(out.count).toBe(3);
		expect(out.source).toContain("<TasksChart figureNumber={1} days={[]}");
		expect(out.source).toContain(
			"<TokensChart figureNumber={2}\n  profiles={[]}",
		);
		expect(out.source).toContain("<FaultBuckets figureNumber={3} items={[]}");
	});

	it("ne touche ni aux autres composants ni au code cité", () => {
		const src =
			"<KeyFigures items={[]} />\n\n```mdx\n<TasksChart days={[]} />\n```\n\nEt `<TokensChart />` en ligne.\n";
		const out = numberFigures(src);
		expect(out.count).toBe(0);
		expect(out.source).toBe(src);
	});

	it("ne confond pas un nom qui commence pareil", () => {
		expect(numberFigures("<TasksChartLegend />").count).toBe(0);
	});
});
