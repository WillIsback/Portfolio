import { cosine } from "./static-model";
import { tokenize } from "./tokenize";

export interface SearchItem {
	id: string;
	title: string;
	keywords: string[];
	terms: string[];
}

export interface Scored {
	id: string;
	score: number;
}

const byScore = (a: Scored, b: Scored) =>
	b.score - a.score || a.id.localeCompare(b.id);

/**
 * Repli par mots-clés (spec §7.4) : +2 par mot-clé présent comme mot entier dans la saisie
 * (ou dont un mot commence par un mot saisi de 3 lettres et plus), +1 par mot saisi qui
 * correspond à un terme (préfixe à partir de 3 lettres, égalité en dessous).
 */
export function keywordMatches(query: string, items: SearchItem[]): Scored[] {
	const tokens = [...new Set(tokenize(query))];
	if (tokens.length === 0) return [];
	const padded = ` ${tokens.join(" ")} `;
	const long = tokens.filter((t) => t.length >= 3);
	const out: Scored[] = [];
	for (const item of items) {
		let score = 0;
		for (const keyword of item.keywords) {
			const kw = tokenize(keyword).join(" ");
			if (kw.length < 2) continue;
			if (
				padded.includes(` ${kw} `) ||
				long.some((t) => kw.split(" ").some((part) => part.startsWith(t)))
			)
				score += 2;
		}
		for (const token of tokens) {
			const hit = item.terms.some((term) =>
				token.length >= 3 ? term.startsWith(token) : term === token,
			);
			if (hit) score += 1;
		}
		if (score > 0) out.push({ id: item.id, score });
	}
	return out.sort(byScore);
}

export function semanticRank(
	query: ArrayLike<number>,
	items: { id: string; vector: ArrayLike<number> }[],
): Scored[] {
	return items
		.map((item) => ({ id: item.id, score: cosine(query, item.vector) }))
		.sort(byScore);
}

/** Point de la requête : moyenne des positions des k plus proches, pondérée par la similarité (spec §7.4). */
export function placeQuery(
	ranked: Scored[],
	positions: ReadonlyMap<string, { x: number; y: number }>,
	k = 5,
): { x: number; y: number } | null {
	const top: { score: number; x: number; y: number }[] = [];
	for (const r of ranked) {
		const p = positions.get(r.id);
		if (p) top.push({ score: r.score, x: p.x, y: p.y });
		if (top.length === k) break;
	}
	if (top.length === 0) return null;
	const weights = top.map((t) => Math.max(t.score, 0));
	const total = weights.reduce((s, w) => s + w, 0);
	let x = 0;
	let y = 0;
	top.forEach((t, i) => {
		const w = total > 0 ? weights[i] / total : 1 / top.length;
		x += t.x * w;
		y += t.y * w;
	});
	return { x, y };
}

const SCORE_FORMAT = new Intl.NumberFormat("fr-FR", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

export function formatScore(score: number): string {
	return SCORE_FORMAT.format(score);
}
