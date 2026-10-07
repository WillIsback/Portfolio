import {
	keywordMatches,
	placeQuery,
	type Scored,
	type SearchItem,
} from "./search";
import { tokenize } from "./tokenize";

export type EngineStatus = "idle" | "loading" | "ready" | "failed";

export interface ExplorerState {
	query: string;
	seq: number;
	status: EngineStatus;
	semantic: { seq: number; ranked: Scored[] | null } | null;
}

export type ExplorerAction =
	| { type: "activate" }
	| { type: "ready" }
	| { type: "failed" }
	| { type: "input"; query: string }
	| { type: "result"; seq: number; ranked: Scored[] | null };

export const initialExplorerState: ExplorerState = {
	query: "",
	seq: 0,
	status: "idle",
	semantic: null,
};

export function explorerReducer(
	state: ExplorerState,
	action: ExplorerAction,
): ExplorerState {
	switch (action.type) {
		case "activate":
			return state.status === "idle" ? { ...state, status: "loading" } : state;
		case "ready":
			return { ...state, status: "ready" };
		case "failed":
			return { ...state, status: "failed" };
		case "input":
			return {
				...state,
				query: action.query,
				seq: state.seq + 1,
				semantic: null,
			};
		case "result":
			return action.seq === state.seq
				? { ...state, semantic: { seq: action.seq, ranked: action.ranked } }
				: state;
	}
}

export interface ExplorerView {
	mode: "rest" | "keyword" | "semantic";
	hits: Set<string>;
	results: { id: string; score: number | null }[];
	queryPoint: { x: number; y: number } | null;
}

export function computeView(
	state: ExplorerState,
	items: SearchItem[],
	positions: ReadonlyMap<string, { x: number; y: number }>,
): ExplorerView {
	if (tokenize(state.query).length === 0)
		return { mode: "rest", hits: new Set(), results: [], queryPoint: null };
	const ranked = state.semantic?.ranked;
	if (state.status === "ready" && ranked && ranked.length > 0) {
		const top = ranked.slice(0, 3);
		return {
			mode: "semantic",
			hits: new Set(top.map((r) => r.id)),
			results: top.map((r) => ({ id: r.id, score: r.score })),
			queryPoint: placeQuery(ranked, positions),
		};
	}
	const matches = keywordMatches(state.query, items);
	return {
		mode: "keyword",
		hits: new Set(matches.map((m) => m.id)),
		results: matches.slice(0, 3).map((m) => ({ id: m.id, score: null })),
		queryPoint: null,
	};
}
