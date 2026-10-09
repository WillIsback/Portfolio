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
	featuredStatus: "ready" as const,
	indexStatus: "ready" as const,
	featured: [],
	index: [],
	filtersActive: false,
	filterBar: <div>filtres</div>,
	points: [],
	neighbors: {},
	entries: {},
};

describe("RegisterView", () => {
	it("montre un squelette de l'index sans démonter les filtres", () => {
		const html = renderToStaticMarkup(
			<RegisterView {...base} indexStatus="loading" featured={[p(1)]} />,
		);
		expect(html).toContain('aria-busy="true"');
		expect(html).toContain("Chargement du registre");
		expect(html).toContain("filtres");
		expect(html).toContain("<details");
		expect(html).toContain("Projet 1");
	});

	it("montre un squelette des phares tout en gardant les filtres", () => {
		const html = renderToStaticMarkup(
			<RegisterView {...base} featuredStatus="loading" index={[p(3)]} />,
		);
		expect(html).toContain('aria-busy="true"');
		expect(html).toContain("Projet 3");
		expect(html).toContain("filtres");
	});

	it("affiche une erreur par bloc sans casser la page", () => {
		const idx = renderToStaticMarkup(
			<RegisterView {...base} indexStatus="error" featured={[p(1)]} />,
		);
		expect(idx).toContain('role="alert"');
		expect(idx).toContain("Réessaie dans un instant.");
		expect(idx).toContain("Projet 1");
		expect(idx).toContain("filtres");
		const feat = renderToStaticMarkup(
			<RegisterView {...base} featuredStatus="error" index={[p(3)]} />,
		);
		expect(feat).toContain("Réessaie dans un instant.");
		expect(feat).toContain("Projet 3");
	});

	it("numérote les figures des projets phares à partir de 2 et liste l'index", () => {
		const html = renderToStaticMarkup(
			<RegisterView {...base} featured={[p(1), p(2)]} index={[p(3)]} />,
		);
		expect(html).toContain("Projets phares");
		expect(html).toContain("Fig. 2 · ");
		expect(html).toContain("Fig. 3 · ");
		expect(html).toContain("Projet 3");
		expect(html.match(/<h3/g)?.length).toBeGreaterThanOrEqual(3);
	});

	it("replie les filtres par défaut et les ouvre quand un filtre est actif", () => {
		expect(renderToStaticMarkup(<RegisterView {...base} />)).toMatch(
			/<details(?![^>]*open)/,
		);
		expect(
			renderToStaticMarkup(<RegisterView {...base} filtersActive />),
		).toMatch(/<details[^>]*open/);
	});

	it("affiche 4 emplacements et une grille à 2 colonnes pour les phares", () => {
		const loading = renderToStaticMarkup(
			<RegisterView {...base} featuredStatus="loading" />,
		);
		expect(loading.match(/animate-pulse/g)?.length).toBeGreaterThanOrEqual(4);
		expect(loading).not.toContain("lg:grid-cols-3");
		const ready = renderToStaticMarkup(
			<RegisterView {...base} featured={[p(1), p(2), p(3), p(4)]} />,
		);
		expect(ready).toContain("md:grid-cols-2");
		expect(ready).not.toContain("lg:grid-cols-3");
	});

	it("dit quand l'index filtré est vide", () => {
		const html = renderToStaticMarkup(<RegisterView {...base} filtersActive />);
		expect(html).toContain("Aucun projet ne correspond à ces filtres.");
	});
});
