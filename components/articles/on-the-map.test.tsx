import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import OnTheMap from "./OnTheMap";

const points = [
	{
		id: "article:a",
		kind: "article" as const,
		title: "A",
		href: "/articles/a",
		x: 0.2,
		y: 0.2,
		cluster: 1,
	},
	{
		id: "project:1",
		kind: "project" as const,
		title: "P1",
		href: "https://github.com/x/p1",
		x: 0.3,
		y: 0.2,
		cluster: 2,
	},
];

describe("OnTheMap", () => {
	const html = renderToStaticMarkup(
		<OnTheMap
			articleId="article:a"
			points={points}
			figureNumber={4}
			neighbors={[
				{
					id: "project:1",
					title: "P1",
					href: "https://github.com/x/p1",
					kind: "project",
				},
			]}
		/>,
	);

	it("titre la section et numérote sa figure", () => {
		expect(html).toContain("<h2");
		expect(html).toContain("Sur la carte");
		expect(html).toContain("Fig. 4 · ");
	});

	it("liste les voisins en liens, externes ouverts dans un nouvel onglet", () => {
		expect(html).toContain('href="https://github.com/x/p1"');
		expect(html).toContain('rel="noopener noreferrer"');
		expect(html).toContain("projet");
	});

	it("ne rend rien sans voisin", () => {
		expect(
			renderToStaticMarkup(
				<OnTheMap
					articleId="article:a"
					points={points}
					figureNumber={1}
					neighbors={[]}
				/>,
			),
		).toBe("");
	});
});

describe("OnTheMap liens internes", () => {
	it("les voisins externes s'ouvrent dans un nouvel onglet, les internes restent des liens Next", () => {
		const html = renderToStaticMarkup(
			<OnTheMap
				articleId="article:a"
				points={points}
				figureNumber={1}
				neighbors={[
					{ id: "a2", title: "Interne", href: "/articles/b", kind: "article" },
					{
						id: "project:1",
						title: "P1",
						href: "https://github.com/x/p1",
						kind: "project",
					},
				]}
			/>,
		);
		expect(html).toMatch(/<a (?![^>]*target)[^>]*href="\/articles\/b"/);
		expect(html).toMatch(
			/<a href="https:\/\/github.com\/x\/p1" target="_blank"/,
		);
	});
});
