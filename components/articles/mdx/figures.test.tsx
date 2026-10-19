import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { renderFr } from "@/tests/i18n-render";
import { CompareChart } from "./CompareChart";
import { FaultBuckets } from "./FaultBuckets";
import { Screenshot } from "./Screenshot";
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
	[
		"CompareChart",
		(n) => (
			<CompareChart
				series={["A", "B"]}
				groups={[["G", 1, 2]]}
				title="Titre"
				caption="Légende"
				figureNumber={n}
			/>
		),
	],
	[
		"Screenshot",
		(n) => (
			<Screenshot
				src="/capture.png"
				alt="Capture"
				width={100}
				height={50}
				caption="Légende"
				figureNumber={n}
			/>
		),
	],
];

describe("légendes par défaut", () => {
	it("TasksChart", () => {
		const html = renderFr(
			<TasksChart days={[["J1", 10, 4]]} figureNumber={1} />,
		);
		expect(html).toMatch(
			/Fig\. 1 · Tâches Kanban créées par jour<\/figcaption>/,
		);
	});
	it("TokensChart", () => {
		const html = renderFr(
			<TokensChart profiles={[["sre-dev", 3, "work"]]} figureNumber={1} />,
		);
		expect(html).toMatch(
			/Fig\. 1 · Tokens d(?:'|&#x27;)entrée par profil<\/figcaption>/,
		);
	});
});

describe.each(cases)("%s", (_name, render) => {
	it("préfixe la légende de « Fig. N · »", () => {
		const html = renderFr(render(2));
		expect(html).toMatch(/<figcaption[^>]*>Fig\. 2 · Légende/);
	});

	it("n'écrit pas « Fig. » sans numéro", () => {
		expect(renderFr(render())).not.toContain("Fig.");
	});
});

describe("FaultBuckets sans légende", () => {
	it("utilise une légende par défaut avec un numéro", () => {
		const html = renderFr(
			<FaultBuckets total={4} traces={2} items={items} figureNumber={3} />,
		);
		expect(html).toContain(
			"Fig. 3 · Répartition des échecs d&#x27;outils</figcaption>",
		);
		expect(html.indexOf("<figcaption")).toBeGreaterThan(html.indexOf("</ul>"));
	});
});

describe("CompareChart", () => {
	it("prend le titre comme légende par défaut et décrit les valeurs", () => {
		const html = renderFr(
			<CompareChart
				series={["CatBoost", "Kumo"]}
				groups={[["Énergie", 0.24, null]]}
				title="R² sur le test"
				digits={2}
				step={0.1}
				figureNumber={1}
			/>,
		);
		expect(html).toContain("Fig. 1 · R² sur le test</figcaption>");
		expect(html).toContain("Énergie : CatBoost 0,24");
		expect(html).not.toContain("Kumo 0");
	});
});
