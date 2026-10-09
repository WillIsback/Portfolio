import { type Scored, semanticRank } from "./search";
import {
	createStaticModel,
	embedText,
	type StaticModel,
	type StaticModelMeta,
} from "./static-model";

export const MODEL_BASE_URL = "/models/carnet-static";

/** Un Worker créé depuis un blob ne résout pas les URL relatives : on ancre sur l'origine de la page. */
export function absoluteModelBase(origin: string, base: string): string {
	return `${origin}${base}`;
}

export type FetchLike = (url: string) => Promise<{
	ok: boolean;
	status: number;
	json(): Promise<unknown>;
	arrayBuffer(): Promise<ArrayBuffer>;
}>;

export function modelUrl(base: string, file: string, version: string): string {
	return `${base}/${file}?v=${version}`;
}

export function versionOf(mapModel: string): string {
	const at = mapModel.lastIndexOf("@");
	return at >= 0 ? mapModel.slice(at + 1) : mapModel;
}

export async function loadStaticModel(
	base: string,
	version: string,
	fetchFn: FetchLike,
): Promise<StaticModel> {
	const get = async (file: string) => {
		const res = await fetchFn(modelUrl(base, file, version));
		if (!res.ok) throw new Error(`${file} : HTTP ${res.status}`);
		return res;
	};
	const [metaRes, vocabRes, vectorsRes, scalesRes] = await Promise.all(
		["meta.json", "vocab.json", "vectors.i8", "scales.f32"].map(get),
	);
	const meta = (await metaRes.json()) as StaticModelMeta;
	if (meta.version !== version)
		throw new Error(`modèle ${meta.version} ≠ carte ${version}`);
	const words = (await vocabRes.json()) as string[];
	const vectors = new Int8Array(await vectorsRes.arrayBuffer());
	const scales = new Float32Array(await scalesRes.arrayBuffer());
	return createStaticModel(meta, words, vectors, scales);
}

export interface SearchEngine {
	query(text: string): Scored[] | null;
}

export function createSearchEngine(
	model: StaticModel,
	items: { id: string; vector: number[] }[],
): SearchEngine {
	return {
		query(text) {
			const vector = embedText(model, text);
			return vector ? semanticRank(vector, items) : null;
		},
	};
}
