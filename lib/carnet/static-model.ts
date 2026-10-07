import { tokenize } from "./tokenize";

export interface StaticModelMeta {
	version: string;
	teacher: string;
	dim: number;
	vocabSize: number;
	wordPrompt: string;
	sifA: number;
}

export interface StaticModel {
	meta: StaticModelMeta;
	vocab: Map<string, number>;
	vectors: Int8Array;
	scales: Float32Array;
}

export function createStaticModel(
	meta: StaticModelMeta,
	words: string[],
	vectors: Int8Array,
	scales: Float32Array,
): StaticModel {
	if (words.length !== meta.vocabSize) {
		throw new Error(
			`vocab : ${words.length} mots pour vocabSize=${meta.vocabSize}`,
		);
	}
	if (
		vectors.length !== meta.vocabSize * meta.dim ||
		scales.length !== meta.vocabSize
	) {
		throw new Error("vectors/scales : tailles incohérentes avec meta");
	}
	return {
		meta,
		vocab: new Map(words.map((word, index) => [word, index])),
		vectors,
		scales,
	};
}

export function embedTokens(
	model: StaticModel,
	tokens: string[],
): Float32Array | null {
	const { dim } = model.meta;
	const sum = new Float64Array(dim);
	let count = 0;
	for (const token of tokens) {
		const row = model.vocab.get(token);
		if (row === undefined) continue;
		const scale = model.scales[row];
		const offset = row * dim;
		for (let j = 0; j < dim; j++) sum[j] += model.vectors[offset + j] * scale;
		count++;
	}
	if (count === 0) return null;
	let norm = 0;
	for (let j = 0; j < dim; j++) {
		sum[j] /= count;
		norm += sum[j] * sum[j];
	}
	norm = Math.sqrt(norm);
	if (norm === 0) return null;
	const out = new Float32Array(dim);
	for (let j = 0; j < dim; j++) out[j] = sum[j] / norm;
	return out;
}

export function embedText(
	model: StaticModel,
	text: string,
): Float32Array | null {
	return embedTokens(model, tokenize(text));
}

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
	let dot = 0;
	let na = 0;
	let nb = 0;
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		na += a[i] * a[i];
		nb += b[i] * b[i];
	}
	return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
}
