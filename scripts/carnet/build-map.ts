import { writeFileSync } from "node:fs";
import path from "node:path";
import { clusterLabels } from "../../content/map-clusters";
import { buildMap } from "../../lib/carnet/map-build";
import { MapDataSchema } from "../../lib/carnet/map-types";
import { embedText } from "../../lib/carnet/static-model";
import {
	CARNET_MODEL_DIR,
	loadStaticModelFromDir,
} from "../../lib/carnet/static-model-node";
import { loadCorpus } from "./load-corpus";

const OUT = path.join(process.cwd(), "content", "map.json");

(async () => {
	const model = loadStaticModelFromDir(CARNET_MODEL_DIR);
	const corpus = await loadCorpus();
	const kept = corpus
		.map((item) => ({ item, vector: embedText(model, item.text) }))
		.filter((x): x is { item: typeof x.item; vector: Float32Array } => {
			if (x.vector === null)
				console.warn(`ignoré (aucun mot connu) : ${x.item.id}`);
			return x.vector !== null;
		});
	const map = MapDataSchema.parse(
		buildMap(
			kept.map((x) => x.item),
			kept.map((x) => x.vector),
			{
				k: 5,
				seed: 42,
				model: `carnet-static@${model.meta.version}`,
				now: new Date(),
				labels: clusterLabels,
			},
		),
	);
	writeFileSync(OUT, `${JSON.stringify(map, null, 1)}\n`);
	console.log(
		`content/map.json : ${map.items.length} éléments, groupes :`,
		map.clusters,
	);
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
