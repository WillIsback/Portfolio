import { describe, expect, it } from "vitest";
import type { CorpusItem } from "./corpus";
import {
	buildMap,
	kmeans,
	mulberry32,
	normalizeCoords,
	suggestClusterLabels,
} from "./map-build";
import { MapDataSchema } from "./map-types";

function item(i: number, keywords: string[]): CorpusItem {
	return {
		id: `project:${i}`,
		kind: "project",
		title: `P${i}`,
		text: `P${i}`,
		href: `https://x/${i}`,
		keywords,
		terms: [],
	};
}

function vec(...v: number[]): Float32Array {
	const n = Math.hypot(...v);
	return Float32Array.from(v.map((x) => x / n));
}

const groupA = Array.from({ length: 6 }, (_, i) => vec(1, 0.05 * i, 0));
const groupB = Array.from({ length: 6 }, (_, i) => vec(0, 1, 0.05 * i));
const corpus = [
	...groupA.map((_, i) => item(i, ["python", "vision"])),
	...groupB.map((_, i) => item(i + 6, ["rust"])),
];
const options = {
	k: 2,
	seed: 42,
	model: "carnet-static@test",
	now: new Date("2026-10-07T00:00:00Z"),
	labels: {},
};

describe("kmeans", () => {
	it("sépare deux groupes nets et reste déterministe à graine égale", () => {
		const a = kmeans([...groupA, ...groupB], 2, mulberry32(42));
		const b = kmeans([...groupA, ...groupB], 2, mulberry32(42));
		expect(a).toEqual(b);
		expect(new Set(a.slice(0, 6)).size).toBe(1);
		expect(new Set(a.slice(6)).size).toBe(1);
		expect(a[0]).not.toBe(a[6]);
	});
});

describe("normalizeCoords", () => {
	it("ramène les points dans [marge, 1 - marge]", () => {
		const out = normalizeCoords(
			[
				[-10, 5],
				[10, 25],
				[0, 15],
			],
			0.1,
		);
		for (const [x, y] of out) {
			expect(x).toBeGreaterThanOrEqual(0.1);
			expect(x).toBeLessThanOrEqual(0.9);
			expect(y).toBeGreaterThanOrEqual(0.1);
			expect(y).toBeLessThanOrEqual(0.9);
		}
	});

	it("centre un nuage dégénéré (un seul point)", () => {
		expect(normalizeCoords([[3, 3]])).toEqual([[0.5, 0.5]]);
	});
});

describe("suggestClusterLabels", () => {
	it("prend le mot-clé le plus fréquent, à égalité le premier par ordre alphabétique", () => {
		expect(
			suggestClusterLabels([
				{ cluster: "c1", keywords: ["vision", "python"] },
				{ cluster: "c1", keywords: ["python"] },
				{ cluster: "c2", keywords: ["rust", "cli"] },
			]),
		).toEqual({ c1: "python", c2: "cli" });
	});
});

describe("buildMap", () => {
	it("produit une carte valide, déterministe, avec des coordonnées dans [0, 1]", () => {
		const a = buildMap(corpus, [...groupA, ...groupB], options);
		const b = buildMap(corpus, [...groupA, ...groupB], options);
		expect(MapDataSchema.parse(a)).toEqual(a);
		expect(a).toEqual(b);
		expect(a.items).toHaveLength(12);
		expect(a.clusters.map((c) => c.id)).toEqual(["c1", "c2"]);
	});

	it("applique les noms de groupes fournis", () => {
		const map = buildMap(corpus, [...groupA, ...groupB], {
			...options,
			labels: { c1: "Vision" },
		});
		expect(map.clusters.find((c) => c.id === "c1")?.label).toBe("Vision");
	});

	it("ne plante pas sur un corpus minuscule", () => {
		const map = buildMap(corpus.slice(0, 2), [groupA[0], groupB[0]], options);
		expect(map.items).toHaveLength(2);
		for (const it of map.items) {
			expect(it.x).toBeGreaterThanOrEqual(0);
			expect(it.x).toBeLessThanOrEqual(1);
		}
	});

	it("refuse des longueurs incohérentes", () => {
		expect(() => buildMap(corpus, [groupA[0]], options)).toThrow(/vectors/);
	});
	it.each([0, 1, 3, 4])("reste valide sur un corpus de %i éléments", (n) => {
		const vs = [groupA[0], groupB[0], groupA[1], groupB[1]].slice(0, n);
		const map = buildMap(corpus.slice(0, n), vs, options);
		expect(MapDataSchema.parse(map)).toEqual(map);
		expect(map.items).toHaveLength(n);
		const ids = map.clusters.map((c) => c.id);
		for (const it of map.items) {
			for (const v of [it.x, it.y]) {
				expect(Number.isFinite(v)).toBe(true);
				expect(v).toBeGreaterThanOrEqual(0);
				expect(v).toBeLessThanOrEqual(1);
			}
			expect(ids).toContain(it.cluster);
		}
		if (n === 0) expect(map.clusters).toEqual([]);
	});
});
