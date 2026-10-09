import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { clusterLabels } from "@/content/map-clusters";
import { MapDataSchema } from "./map-types";

const map = MapDataSchema.parse(
	JSON.parse(
		readFileSync(path.join(process.cwd(), "content", "map.json"), "utf8"),
	),
);

describe("content/map-clusters.ts", () => {
	it("nomme exactement les groupes de la carte", () => {
		expect(Object.keys(clusterLabels).sort()).toEqual(
			map.clusters.map((c) => c.id).sort(),
		);
	});

	it("donne des noms non vides et distincts", () => {
		const labels = Object.values(clusterLabels).map((l) => l.trim());
		expect(labels.every((l) => l.length > 0)).toBe(true);
		expect(new Set(labels).size).toBe(labels.length);
	});

	it("est appliqué à content/map.json (sinon : relancer `pnpm embeddings`)", () => {
		for (const c of map.clusters) expect(c.label).toBe(clusterLabels[c.id]);
	});

	it("donne des termes de recherche à chaque élément", () => {
		for (const item of map.items) expect(item.terms.length).toBeGreaterThan(0);
	});
});
