import { describe, expect, it } from "vitest";
import {
	formatScore,
	keywordMatches,
	placeQuery,
	type SearchItem,
	semanticRank,
} from "./search";

const items: SearchItem[] = [
	{
		id: "a",
		keywords: ["agents autonomes", "llm local"],
		terms: ["neuf", "agents", "flotte"],
	},
	{
		id: "b",
		keywords: ["python", "docker"],
		terms: ["fashion", "vision", "segmentation"],
	},
	{ id: "c", keywords: ["go"], terms: ["outil", "google"] },
];

describe("keywordMatches", () => {
	it("reconnaît un mot-clé ponctué comme expression entière", () => {
		const punctuated: SearchItem[] = [
			{ id: "n", keywords: ["next.js", "text-to-sql"], terms: [] },
		];
		expect(keywordMatches("text to sql", punctuated)).toEqual([
			{ id: "n", score: 2 },
		]);
		expect(keywordMatches("Next.js", punctuated)).toEqual([
			{ id: "n", score: 2 },
		]);
	});

	it("trouve un mot-clé complet en ignorant accents et casse", () => {
		expect(keywordMatches("LLM Local", items).map((m) => m.id)).toEqual(["a"]);
	});

	it("trouve un terme par préfixe à partir de 3 lettres", () => {
		expect(keywordMatches("visi", items).map((m) => m.id)).toEqual(["b"]);
	});

	it("ne confond pas un mot-clé court avec un morceau de mot", () => {
		expect(keywordMatches("google", items).map((m) => m.id)).toEqual(["c"]);
		expect(keywordMatches("going", items)).toEqual([]);
	});

	it("classe par nombre de correspondances", () => {
		const ranked = keywordMatches("agents vision flotte", items);
		expect(ranked.map((m) => m.id)).toEqual(["a", "b"]);
		expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
	});

	it("ne renvoie rien pour une saisie sans mot", () => {
		expect(keywordMatches("  !! ", items)).toEqual([]);
		expect(keywordMatches("a", items)).toEqual([]);
	});
});

describe("semanticRank", () => {
	it("trie par similarité cosinus décroissante", () => {
		const ranked = semanticRank(
			[1, 0],
			[
				{ id: "x", vector: [0, 1] },
				{ id: "y", vector: [1, 0] },
				{ id: "z", vector: [1, 1] },
			],
		);
		expect(ranked.map((r) => r.id)).toEqual(["y", "z", "x"]);
		expect(ranked[0].score).toBeCloseTo(1);
	});
});

describe("placeQuery", () => {
	const positions = new Map([
		["p", { x: 0, y: 0 }],
		["q", { x: 1, y: 1 }],
		["r", { x: 1, y: 0 }],
	]);

	it("pondère les positions des plus proches par leur similarité", () => {
		const point = placeQuery(
			[
				{ id: "p", score: 0.75 },
				{ id: "q", score: 0.25 },
			],
			positions,
		);
		expect(point?.x).toBeCloseTo(0.25);
		expect(point?.y).toBeCloseTo(0.25);
	});

	it("ne garde que les k plus proches", () => {
		const point = placeQuery(
			[
				{ id: "p", score: 0.9 },
				{ id: "q", score: 0.8 },
				{ id: "r", score: 0.7 },
			],
			positions,
			1,
		);
		expect(point).toEqual({ x: 0, y: 0 });
	});

	it("ignore les similarités négatives et retombe sur la moyenne simple", () => {
		const point = placeQuery(
			[
				{ id: "p", score: -0.2 },
				{ id: "q", score: -0.4 },
			],
			positions,
		);
		expect(point).toEqual({ x: 0.5, y: 0.5 });
	});

	it("renvoie null sans élément positionné", () => {
		expect(placeQuery([{ id: "inconnu", score: 1 }], positions)).toBeNull();
	});
});

describe("formatScore", () => {
	it("écrit le score à la française avec deux décimales", () => {
		expect(formatScore(0.8234)).toBe("0,82");
		expect(formatScore(1)).toBe("1,00");
	});
});
