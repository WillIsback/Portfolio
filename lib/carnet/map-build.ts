import { UMAP } from "umap-js";
import type { CorpusItem } from "./corpus";
import type { MapData } from "./map-types";

export function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function dist(a: ArrayLike<number>, b: ArrayLike<number>): number {
	let dot = 0;
	for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
	return 1 - dot;
}

export function kmeans(
	vectors: ArrayLike<number>[],
	k: number,
	random: () => number,
	iterations = 50,
): number[] {
	const n = vectors.length;
	if (n === 0) return [];
	const kk = Math.max(1, Math.min(k, n));
	const dim = vectors[0]?.length ?? 0;
	const centers: number[][] = [Array.from(vectors[Math.floor(random() * n)])];
	while (centers.length < kk) {
		const d2 = vectors.map(
			(v) => Math.min(...centers.map((c) => dist(v, c))) ** 2,
		);
		const total = d2.reduce((s, x) => s + x, 0);
		let r = random() * total;
		let pick = 0;
		while (pick < n - 1 && r > d2[pick]) r -= d2[pick++];
		centers.push(Array.from(vectors[pick]));
	}
	let assign = new Array<number>(n).fill(0);
	for (let iter = 0; iter < iterations; iter++) {
		const next = vectors.map((v) => {
			let best = 0;
			for (let c = 1; c < kk; c++)
				if (dist(v, centers[c]) < dist(v, centers[best])) best = c;
			return best;
		});
		const stable = next.every((c, i) => c === assign[i]) && iter > 0;
		assign = next;
		for (let c = 0; c < kk; c++) {
			const members = vectors.filter((_, i) => assign[i] === c);
			if (members.length === 0) continue;
			const mean = new Array<number>(dim).fill(0);
			for (const m of members)
				for (let j = 0; j < dim; j++) mean[j] += m[j] / members.length;
			const norm = Math.hypot(...mean) || 1;
			centers[c] = mean.map((x) => x / norm);
		}
		if (stable) break;
	}
	return assign;
}

export function normalizeCoords(
	points: number[][],
	margin = 0.06,
): [number, number][] {
	const xs = points.map((p) => p[0]);
	const ys = points.map((p) => p[1]);
	const scale = (v: number, min: number, max: number) =>
		max === min ? 0.5 : margin + ((v - min) / (max - min)) * (1 - 2 * margin);
	const [minX, maxX, minY, maxY] = [
		Math.min(...xs),
		Math.max(...xs),
		Math.min(...ys),
		Math.max(...ys),
	];
	return points.map((p) => [scale(p[0], minX, maxX), scale(p[1], minY, maxY)]);
}

export function suggestClusterLabels(
	items: { cluster: string; keywords: string[] }[],
): Record<string, string> {
	const counts = new Map<string, Map<string, number>>();
	for (const it of items) {
		const c = counts.get(it.cluster) ?? new Map<string, number>();
		for (const kw of it.keywords) c.set(kw, (c.get(kw) ?? 0) + 1);
		counts.set(it.cluster, c);
	}
	const labels: Record<string, string> = {};
	for (const [cluster, c] of counts) {
		const sorted = [...c.entries()].sort(
			(a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
		);
		labels[cluster] = sorted[0]?.[0] ?? cluster;
	}
	return labels;
}

function layout2d(vectors: Float32Array[], random: () => number): number[][] {
	const n = vectors.length;
	if (n < 4) {
		return vectors.map((_, i) => [
			Math.cos((2 * Math.PI * i) / n),
			Math.sin((2 * Math.PI * i) / n),
		]);
	}
	const umap = new UMAP({
		nComponents: 2,
		nNeighbors: Math.min(15, n - 1),
		minDist: 0.1,
		random,
	});
	return umap.fit(vectors.map((v) => Array.from(v)));
}

export function buildMap(
	corpus: CorpusItem[],
	vectors: Float32Array[],
	options: {
		k: number;
		seed: number;
		model: string;
		now: Date;
		labels: Record<string, string>;
	},
): MapData {
	if (corpus.length !== vectors.length) {
		throw new Error(
			`vectors : ${vectors.length} pour ${corpus.length} éléments`,
		);
	}
	const coords = normalizeCoords(layout2d(vectors, mulberry32(options.seed)));
	const raw = kmeans(vectors, options.k, mulberry32(options.seed + 1));
	const order = [...new Set(raw)];
	const clusterOf = (i: number) => `c${order.indexOf(raw[i]) + 1}`;
	const items = corpus.map((it, i) => ({
		id: it.id,
		kind: it.kind,
		title: it.title,
		href: it.href,
		x: Number(coords[i][0].toFixed(4)),
		y: Number(coords[i][1].toFixed(4)),
		cluster: clusterOf(i),
		keywords: it.keywords,
		terms: it.terms,
		vector: Array.from(vectors[i], (x) => Number(x.toFixed(4))),
	}));
	const suggested = suggestClusterLabels(items);
	const clusters = order.map((_, idx) => {
		const id = `c${idx + 1}`;
		return { id, label: options.labels[id] ?? suggested[id] ?? id };
	});
	return {
		model: options.model,
		generatedAt: options.now.toISOString(),
		clusters,
		items,
	};
}
