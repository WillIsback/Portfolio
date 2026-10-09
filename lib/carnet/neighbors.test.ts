import { describe, expect, it } from "vitest";
import type { MapData } from "./map-types";
import { nearestTo } from "./neighbors";

const item = (id: string, vector: number[]) => ({
	id,
	kind: (id.startsWith("article") ? "article" : "project") as
		| "article"
		| "project",
	title: id,
	href: `/${id}`,
	x: 0,
	y: 0,
	cluster: "c1",
	keywords: [],
	terms: [],
	vector,
});
const map: MapData = {
	model: "m",
	generatedAt: "2026-10-09T00:00:00Z",
	clusters: [{ id: "c1", label: "g" }],
	items: [
		item("article:a", [1, 0]),
		item("project:1", [0.9, 0.1]),
		item("project:2", [0, 1]),
		item("project:3", [0.7, 0.3]),
	],
};

describe("nearestTo", () => {
	it("donne les k plus proches, lui-même exclu", () => {
		expect(nearestTo(map, "article:a", 2).map((i) => i.id)).toEqual([
			"project:1",
			"project:3",
		]);
	});

	it("renvoie une liste vide pour un élément absent de la carte", () => {
		expect(nearestTo(map, "article:absent")).toEqual([]);
	});
});
