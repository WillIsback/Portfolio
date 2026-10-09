import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { MapCluster, MapPoint } from "@/lib/carnet/map-view";
import MapItemList from "./MapItemList";
import MapLegend from "./MapLegend";
import MapSvg from "./MapSvg";

const points: MapPoint[] = [
	{
		id: "article:a",
		kind: "article",
		title: "Neuf agents",
		href: "/articles/a",
		x: 0,
		y: 0,
		cluster: 1,
	},
	{
		id: "project:1",
		kind: "project",
		title: "Fashion",
		href: "https://github.com/x/f",
		x: 1,
		y: 1,
		cluster: 2,
	},
	{
		id: "project:2",
		kind: "project",
		title: "Syntheo",
		href: "https://github.com/x/s",
		x: 0.5,
		y: 0.5,
		cluster: 2,
	},
];
const clusters: MapCluster[] = [
	{ id: "c1", label: "Agents et SRE", index: 1, count: 1 },
	{ id: "c2", label: "Data science", index: 2, count: 2 },
];

describe("MapSvg", () => {
	it("est une image décrite : carrés pour les articles, ronds pour les projets", () => {
		const html = renderToStaticMarkup(<MapSvg points={points} />);
		expect(html).toContain('role="img"');
		expect(html).toContain('aria-labelledby="carnet-map-title"');
		expect(html).toContain('aria-describedby="carnet-map-desc"');
		expect(html).toContain("<title");
		expect(html).toContain("<desc");
		expect(html.match(/<rect[^>]*carnet-point/g)?.length).toBe(1);
		expect(html.match(/<circle[^>]*carnet-point/g)?.length).toBe(2);
	});

	it("place les points avec la marge de 6 % et décale l'entrée par groupe", () => {
		const html = renderToStaticMarkup(<MapSvg points={points} />);
		expect(html).toContain('cx="94"');
		expect(html).toContain("--i:1");
	});

	it("allume les résultats et pose le point de la requête", () => {
		const html = renderToStaticMarkup(
			<MapSvg
				points={points}
				highlighted={new Set(["project:1"])}
				queryPoint={{ x: 0.5, y: 0.25 }}
			/>,
		);
		expect(html.match(/data-hit="true"/g)?.length).toBe(1);
		expect(html).toContain("carnet-query");
	});

	it("n'a pas de point de requête au repos et ne cache rien", () => {
		const html = renderToStaticMarkup(<MapSvg points={points} />);
		expect(html).not.toContain("carnet-query");
		expect(html).not.toContain("opacity:0");
	});

	it("garde les liens des points hors de l'ordre de tabulation", () => {
		const html = renderToStaticMarkup(<MapSvg points={points} />);
		expect(html).toContain('href="/articles/a"');
		expect(html.match(/tabindex="-1"/g)?.length).toBe(3);
	});
});

describe("MapLegend", () => {
	it("liste les groupes avec leur teinte et leur effectif", () => {
		const html = renderToStaticMarkup(<MapLegend clusters={clusters} />);
		expect(html).toContain("Agents et SRE");
		expect(html).toContain("var(--cluster-2)");
		expect(html).toContain("font-mono");
	});
});

describe("MapItemList", () => {
	it("double la carte par des liens navigables au clavier", () => {
		const html = renderToStaticMarkup(<MapItemList points={points} />);
		expect(html).toContain("<details");
		expect(html).toContain("Les 3 éléments de la carte");
		expect(html).toContain('href="/articles/a"');
		expect(html).toContain('target="_blank"');
		expect(html).toContain('rel="noopener noreferrer"');
	});
});
