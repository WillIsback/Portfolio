import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FaultBuckets } from "./FaultBuckets";
import { TasksChart } from "./TasksChart";
import { TokensChart } from "./TokensChart";

const items = [
	{ id: "a", label: "A", count: 3, text: "Texte A" },
	{ id: "b", label: "B", count: 1, text: "Texte B" },
];

const cases: [string, (n?: number) => ReactElement][] = [
	[
		"TasksChart",
		(n) => (
			<TasksChart
				days={[
					["J1", 10, 4],
					["J2", 20, 5],
				]}
				caption="Légende"
				figureNumber={n}
			/>
		),
	],
	[
		"TokensChart",
		(n) => (
			<TokensChart
				profiles={[
					["sre-monitor", 12, "scan"],
					["sre-dev", 3, "work"],
				]}
				caption="Légende"
				figureNumber={n}
			/>
		),
	],
	[
		"FaultBuckets",
		(n) => (
			<FaultBuckets
				total={4}
				traces={2}
				items={items}
				caption="Légende"
				figureNumber={n}
			/>
		),
	],
];

describe.each(cases)("%s", (_name, render) => {
	it("préfixe la légende de « Fig. N · »", () => {
		const html = renderToStaticMarkup(render(2));
		expect(html).toMatch(/<figcaption[^>]*>Fig\. 2 · Légende/);
	});

	it("n'écrit pas « Fig. » sans numéro", () => {
		expect(renderToStaticMarkup(render())).not.toContain("Fig.");
	});
});

describe("FaultBuckets sans légende", () => {
	it("utilise une légende par défaut avec un numéro", () => {
		const html = renderToStaticMarkup(
			<FaultBuckets total={4} traces={2} items={items} figureNumber={3} />,
		);
		expect(html).toContain(
			"Fig. 3 · Répartition des échecs d&#x27;outils</figcaption>",
		);
		expect(html.indexOf("<figcaption")).toBeGreaterThan(html.indexOf("</ul>"));
	});
});
