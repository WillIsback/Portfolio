import { describe, expect, it } from "vitest";
import {
	announcement,
	computeView,
	type ExplorerState,
	explorerReducer,
	initialExplorerState,
} from "./explorer";
import type { SearchItem } from "./search";

const items: SearchItem[] = [
	{
		id: "a",
		title: "Agents",
		keywords: ["agents autonomes"],
		terms: ["agents", "flotte"],
	},
	{ id: "b", title: "Vision", keywords: ["python"], terms: ["vision"] },
	{ id: "c", title: "Web", keywords: ["typescript"], terms: ["site"] },
	{ id: "d", title: "Data", keywords: ["python"], terms: ["donnees"] },
];
const positions = new Map([
	["a", { x: 0, y: 0 }],
	["b", { x: 1, y: 0 }],
	["c", { x: 0, y: 1 }],
	["d", { x: 1, y: 1 }],
]);
const typed = (state: ExplorerState, query: string) =>
	explorerReducer(state, { type: "input", query });

describe("explorerReducer", () => {
	it("n'active le chargement qu'une fois", () => {
		const loading = explorerReducer(initialExplorerState, { type: "activate" });
		expect(loading.status).toBe("loading");
		const ready = explorerReducer(loading, { type: "ready" });
		expect(explorerReducer(ready, { type: "activate" }).status).toBe("ready");
	});

	it("numérote chaque saisie et garde le dernier résultat sémantique", () => {
		const ready = explorerReducer(initialExplorerState, { type: "ready" });
		const s1 = typed(ready, "agents");
		const ranked = [{ id: "a", score: 0.9 }];
		const s2 = explorerReducer(s1, { type: "result", seq: s1.seq, ranked });
		const s3 = typed(s2, "agents autonomes");
		expect(s3.seq).toBe(s1.seq + 1);
		expect(s3.semantic).toEqual({ seq: s1.seq, ranked });
		const view = computeView(s3, items, positions);
		expect(view.mode).toBe("semantic");
		expect(view.results).toEqual([{ id: "a", score: 0.9 }]);
		const s4 = explorerReducer(s3, {
			type: "result",
			seq: s3.seq,
			ranked: [{ id: "b", score: 0.4 }],
		});
		expect(computeView(s4, items, positions).results).toEqual([
			{ id: "b", score: 0.4 },
		]);
	});

	it("ignore une réponse périmée (frappe rapide)", () => {
		const s1 = typed(initialExplorerState, "age");
		const s2 = typed(s1, "agents");
		const current = explorerReducer(s2, {
			type: "result",
			seq: s2.seq,
			ranked: [{ id: "a", score: 1 }],
		});
		const late = explorerReducer(current, {
			type: "result",
			seq: s1.seq,
			ranked: [{ id: "c", score: 1 }],
		});
		expect(late.semantic).toEqual({
			seq: s2.seq,
			ranked: [{ id: "a", score: 1 }],
		});
		expect(
			explorerReducer(s2, { type: "result", seq: s1.seq, ranked: [] }).semantic,
		).toBeNull();
	});
});

describe("computeView", () => {
	const ready = explorerReducer(
		explorerReducer(initialExplorerState, { type: "activate" }),
		{ type: "ready" },
	);

	it("reste au repos pour une saisie vide, d'une lettre ou de ponctuation", () => {
		for (const q of ["", "   ", "a", "?!"]) {
			const view = computeView(typed(ready, q), items, positions);
			expect(view).toEqual({
				mode: "rest",
				hits: new Set(),
				results: [],
				queryPoint: null,
			});
		}
	});

	it("cherche par mots-clés tant que le modèle n'est pas prêt", () => {
		const view = computeView(
			typed(initialExplorerState, "python"),
			items,
			positions,
		);
		expect(view.mode).toBe("keyword");
		expect([...view.hits].sort()).toEqual(["b", "d"]);
		expect(view.results.every((r) => r.score === null)).toBe(true);
		expect(view.queryPoint).toBeNull();
	});

	it("passe en sémantique quand le modèle répond : 3 résultats, scores, point posé", () => {
		const s = typed(ready, "agents");
		const done = explorerReducer(s, {
			type: "result",
			seq: s.seq,
			ranked: [
				{ id: "a", score: 0.9 },
				{ id: "b", score: 0.5 },
				{ id: "c", score: 0.3 },
				{ id: "d", score: 0.1 },
			],
		});
		const view = computeView(done, items, positions);
		expect(view.mode).toBe("semantic");
		expect(view.results).toEqual([
			{ id: "a", score: 0.9 },
			{ id: "b", score: 0.5 },
			{ id: "c", score: 0.3 },
		]);
		expect([...view.hits]).toEqual(["a", "b", "c"]);
		expect(view.queryPoint?.x).toBeGreaterThan(0);
	});

	it("retombe sur les mots-clés quand aucun mot n'est connu du modèle (ranked null)", () => {
		const s = typed(ready, "agents");
		const done = explorerReducer(s, {
			type: "result",
			seq: s.seq,
			ranked: null,
		});
		expect(computeView(done, items, positions).mode).toBe("keyword");
	});

	it("reste en mots-clés si le modèle n'a pas pu être chargé", () => {
		const failed = explorerReducer(
			explorerReducer(initialExplorerState, { type: "activate" }),
			{ type: "failed" },
		);
		expect(computeView(typed(failed, "vision"), items, positions).mode).toBe(
			"keyword",
		);
	});
});

describe("announcement", () => {
	it("résume les résultats pour la région annoncée", () => {
		expect(announcement([], false)).toBe("");
		expect(announcement([], true)).toBe("Aucun résultat");
		expect(announcement(["A"], true)).toBe("1 résultat : A");
		expect(announcement(["A", "B", "C"], true)).toBe("3 résultats : A, B, C");
	});
});
