import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	absoluteModelBase,
	createSearchEngine,
	type FetchLike,
	loadStaticModel,
	MODEL_BASE_URL,
	modelUrl,
	versionOf,
} from "./engine";
import { MapDataSchema } from "./map-types";

const dir = path.join(process.cwd(), "public", "models", "carnet-static");
const map = MapDataSchema.parse(
	JSON.parse(
		readFileSync(path.join(process.cwd(), "content", "map.json"), "utf8"),
	),
);

const diskFetch: FetchLike = async (url) => {
	const file = url.slice(MODEL_BASE_URL.length + 1).split("?")[0];
	const buf = readFileSync(path.join(dir, file));
	return {
		ok: true,
		status: 200,
		json: async () => JSON.parse(buf.toString("utf8")),
		arrayBuffer: async () =>
			buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
	};
};

describe("engine", () => {
	it("lit la version du modèle dans l'identifiant de la carte", () => {
		expect(versionOf("carnet-static@f63393960f37")).toBe("f63393960f37");
	});

	it("ajoute la version aux URL pour un cache immuable", () => {
		expect(modelUrl(MODEL_BASE_URL, "vocab.json", "abc")).toBe(
			"/models/carnet-static/vocab.json?v=abc",
		);
	});

	it("charge le modèle publié et classe tous les éléments de la carte", async () => {
		const model = await loadStaticModel(
			MODEL_BASE_URL,
			versionOf(map.model),
			diskFetch,
		);
		const engine = createSearchEngine(model, map.items);
		const ranked = engine.query("agents autonomes et LLM local");
		expect(ranked).not.toBeNull();
		expect(ranked?.length).toBe(map.items.length);
		const scores = ranked?.map((r) => r.score) ?? [];
		expect([...scores].sort((a, b) => b - a)).toEqual(scores);
	});

	it("renvoie null quand aucun mot de la requête n'est connu", async () => {
		const model = await loadStaticModel(
			MODEL_BASE_URL,
			versionOf(map.model),
			diskFetch,
		);
		expect(createSearchEngine(model, map.items).query("zzqx qqwv")).toBeNull();
	});

	it("rejette quand un fichier est introuvable", async () => {
		const failing: FetchLike = async (url) =>
			url.includes("vectors.i8")
				? {
						ok: false,
						status: 404,
						json: async () => null,
						arrayBuffer: async () => new ArrayBuffer(0),
					}
				: diskFetch(url);
		await expect(
			loadStaticModel(MODEL_BASE_URL, versionOf(map.model), failing),
		).rejects.toThrow("vectors.i8 : HTTP 404");
	});

	it("rejette un modèle d'une autre version que la carte", async () => {
		await expect(
			loadStaticModel(MODEL_BASE_URL, "autre-version", diskFetch),
		).rejects.toThrow("autre-version");
	});
});

describe("absoluteModelBase", () => {
	it("ancre la base du modèle sur l'origine (les Workers blob n'acceptent pas les URL relatives)", () => {
		const base = absoluteModelBase("http://localhost:3312", MODEL_BASE_URL);
		expect(base).toBe("http://localhost:3312/models/carnet-static");
		expect(() => new URL(modelUrl(base, "meta.json", "v"))).not.toThrow();
	});
});
