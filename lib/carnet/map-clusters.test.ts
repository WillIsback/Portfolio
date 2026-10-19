import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CLUSTER_IDS, clusterLabels } from "@/content/map-clusters";
import { frTranslator } from "@/i18n/fr";
import { MapDataSchema } from "./map-types";

const map = MapDataSchema.parse(
	JSON.parse(
		readFileSync(path.join(process.cwd(), "content", "map.json"), "utf8"),
	),
);

describe("content/map-clusters.ts", () => {
	// `content/map.json` est généré par `pnpm embeddings`, qui grave les noms français :
	// c'est la seule référence où la carte doit être comparée au dictionnaire.
	const labels = clusterLabels(frTranslator("clusters"));

	it("nomme exactement les groupes de la carte", () => {
		expect(Object.keys(labels).sort()).toEqual(
			map.clusters.map((c) => c.id).sort(),
		);
		expect(Object.keys(labels).sort()).toEqual([...CLUSTER_IDS].sort());
	});

	it("donne des noms non vides et distincts", () => {
		const values = Object.values(labels).map((l) => l.trim());
		expect(values.every((l) => l.length > 0)).toBe(true);
		expect(new Set(values).size).toBe(values.length);
	});

	it("est appliqué à content/map.json (sinon : relancer `pnpm embeddings`)", () => {
		for (const c of map.clusters) expect(c.label).toBe(labels[c.id]);
	});

	it("donne des termes de recherche à chaque élément", () => {
		for (const item of map.items) expect(item.terms.length).toBeGreaterThan(0);
	});
});
