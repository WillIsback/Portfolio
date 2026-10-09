import { describe, expect, it } from "vitest";
import type { MapData } from "./map-types";
import { toMapView, toPercent, toSearchItems } from "./map-view";

const map: MapData = {
	model: "carnet-static@x",
	generatedAt: "2026-10-07T00:00:00Z",
	clusters: [
		{ id: "c1", label: "auto 1" },
		{ id: "c2", label: "auto 2" },
	],
	items: [
		{
			id: "article:a",
			kind: "article",
			title: "A",
			href: "/articles/a",
			x: 0,
			y: 1,
			cluster: "c2",
			keywords: ["llm"],
			terms: ["alpha"],
			vector: [1, 0],
		},
		{
			id: "project:1",
			kind: "project",
			title: "P",
			href: "https://github.com/x/p",
			x: 0.5,
			y: 0.5,
			cluster: "c1",
			keywords: ["python"],
			terms: ["pi"],
			vector: [0, 1],
		},
	],
};

describe("toMapView", () => {
	it("numérote les groupes dans l'ordre de la carte et applique les noms manuels", () => {
		const view = toMapView(map, { c1: "Data science" });
		expect(view.clusters).toEqual([
			{ id: "c1", label: "Data science", index: 1, count: 1 },
			{ id: "c2", label: "auto 2", index: 2, count: 1 },
		]);
		expect(view.points[0]).toEqual({
			id: "article:a",
			kind: "article",
			title: "A",
			href: "/articles/a",
			x: 0,
			y: 1,
			cluster: 2,
		});
	});

	it("n'expose aucun vecteur aux composants", () => {
		expect(JSON.stringify(toMapView(map, {}))).not.toContain("vector");
	});
});

describe("toSearchItems", () => {
	it("garde id, titre, mots-clés et termes", () => {
		expect(toSearchItems(map)[1]).toEqual({
			id: "project:1",
			title: "P",
			keywords: ["python"],
			terms: ["pi"],
		});
	});
});

describe("toPercent", () => {
	it("laisse une marge de 6 % autour de la carte", () => {
		expect(toPercent(0)).toBe(6);
		expect(toPercent(1)).toBe(94);
	});
});
