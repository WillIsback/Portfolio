import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { MapCluster, MapPoint } from "@/lib/carnet/map-view";
import CarnetExplorer from "./CarnetExplorer";

const points: MapPoint[] = [
	{
		id: "article:a",
		kind: "article",
		title: "Neuf agents",
		href: "/articles/a",
		x: 0.2,
		y: 0.3,
		cluster: 1,
	},
];
const clusters: MapCluster[] = [
	{ id: "c1", label: "Agents et SRE", index: 1, count: 1 },
];

describe("CarnetExplorer (rendu serveur)", () => {
	const html = renderToStaticMarkup(
		<CarnetExplorer
			points={points}
			clusters={clusters}
			searchItems={[
				{
					id: "article:a",
					title: "Neuf agents",
					keywords: [],
					terms: ["agents"],
				},
			]}
			intro={<h1>Carnet de labo</h1>}
			note={<p>essaie</p>}
		/>,
	);

	it("rend la présentation, un champ étiqueté et la carte dès le HTML", () => {
		expect(html).toContain("<h1>Carnet de labo</h1>");
		expect(html).toContain(
			'placeholder="Décris un sujet : vision, LLM local, agents…"',
		);
		expect(html).toMatch(/<label[^>]*for="carnet-query"/);
		expect(html).toContain('role="img"');
		expect(html).toContain("Fig. 1 · ");
	});

	it("prépare une région annoncée, vide au repos, sans mention sémantique", () => {
		expect(html).toContain('aria-live="polite"');
		expect(html).toContain("recherche sémantique active");
		expect(html).toMatch(/invisible[^>]*>recherche sémantique active/);
		expect(html).not.toContain('class="carnet-query"');
		expect(html).toMatch(/aria-live="polite"[^>]*><\/div>/);
	});

	it("place la légende de figure en dernier enfant de <figure>", () => {
		const figure = html.match(/<figure[\s\S]*?<\/figure>/)?.[0] ?? "";
		expect(figure).toMatch(/<\/figcaption><\/figure>$/);
		expect(figure).not.toContain("<ul");
	});
});
