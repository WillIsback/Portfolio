import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getArticleSlugs } from "@/lib/articles/loader";
import { MapDataSchema } from "./map-types";
import { CARNET_MODEL_DIR, loadStaticModelFromDir } from "./static-model-node";

const map = MapDataSchema.parse(
	JSON.parse(
		readFileSync(path.join(process.cwd(), "content", "map.json"), "utf8"),
	),
);

describe("content/map.json", () => {
	it("contient chaque article publié (sinon : relancer `pnpm embeddings`)", () => {
		const onMap = new Set(
			map.items.filter((i) => i.kind === "article").map((i) => i.id),
		);
		const missing = getArticleSlugs().filter(
			(slug) => !onMap.has(`article:${slug}`),
		);
		expect(missing).toEqual([]);
	});

	it("n'a que des identifiants uniques et des groupes déclarés", () => {
		const ids = map.items.map((i) => i.id);
		expect(new Set(ids).size).toBe(ids.length);
		const clusters = new Set(map.clusters.map((c) => c.id));
		for (const i of map.items) expect(clusters.has(i.cluster)).toBe(true);
	});

	it("stocke des vecteurs de la dimension du modèle", () => {
		const { meta } = loadStaticModelFromDir(CARNET_MODEL_DIR);
		const dims = new Set(map.items.map((i) => i.vector.length));
		expect([...dims]).toEqual([meta.dim]);
	});

	it("est produite par le modèle publié (sinon : relancer `pnpm embeddings`)", () => {
		const { meta } = loadStaticModelFromDir(CARNET_MODEL_DIR);
		expect(map.model).toBe(`carnet-static@${meta.version}`);
	});
});
