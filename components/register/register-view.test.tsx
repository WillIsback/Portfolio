import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { NormalizedProject } from "@/lib/projects-data";
import RegisterView from "./RegisterView";

const p = (id: number): NormalizedProject => ({
	id,
	title: `Projet ${id}`,
	description: "Une phrase.",
	imagePath: null,
	github: `https://github.com/x/${id}`,
	lastUpdate: new Date("2026-01-01T00:00:00Z"),
	isPrivate: false,
	isAiGenerated: false,
	isML: false,
	isIAG: false,
	createdAt: new Date(0),
	updatedAt: new Date(0),
	languages: [{ language: "Python" }],
	databases: [],
	backends: [],
	frontends: [],
	devops: [],
});
const base = {
	featured: [],
	index: [],
	filtersActive: false,
	filterBar: <div>filtres</div>,
	points: [],
	neighbors: {},
	entries: {},
};

describe("RegisterView", () => {
	it("montre un squelette pendant le chargement", () => {
		const html = renderToStaticMarkup(
			<RegisterView {...base} status="loading" />,
		);
		expect(html).toContain('aria-busy="true"');
		expect(html).toContain("Chargement du registre");
	});

	it("affiche une erreur lisible sans casser la page", () => {
		const html = renderToStaticMarkup(
			<RegisterView {...base} status="error" error="Trop de requêtes." />,
		);
		expect(html).toContain('role="alert"');
		expect(html).toContain("Trop de requêtes.");
	});

	it("numérote les figures des projets phares à partir de 2 et liste l'index", () => {
		const html = renderToStaticMarkup(
			<RegisterView
				{...base}
				status="ready"
				featured={[p(1), p(2)]}
				index={[p(3)]}
			/>,
		);
		expect(html).toContain("Projets phares");
		expect(html).toContain("Fig. 2 · ");
		expect(html).toContain("Fig. 3 · ");
		expect(html).toContain("Projet 3");
		expect(html.match(/<h3/g)?.length).toBeGreaterThanOrEqual(3);
	});

	it("replie les filtres par défaut et les ouvre quand un filtre est actif", () => {
		expect(
			renderToStaticMarkup(<RegisterView {...base} status="ready" />),
		).toMatch(/<details(?![^>]*open)/);
		expect(
			renderToStaticMarkup(
				<RegisterView {...base} status="ready" filtersActive />,
			),
		).toMatch(/<details[^>]*open/);
	});

	it("dit quand l'index filtré est vide", () => {
		const html = renderToStaticMarkup(
			<RegisterView {...base} status="ready" filtersActive />,
		);
		expect(html).toContain("Aucun projet ne correspond à ces filtres.");
	});
});
