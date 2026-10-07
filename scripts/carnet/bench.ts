import { readFileSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { embedText } from "../../lib/carnet/static-model";
import {
	CARNET_MODEL_DIR,
	loadStaticModelFromDir,
} from "../../lib/carnet/static-model-node";

const queries: { q: string }[] = JSON.parse(
	readFileSync(
		path.join(process.cwd(), "scripts", "distill", "queries.json"),
		"utf8",
	),
);

const t0 = performance.now();
const model = loadStaticModelFromDir(CARNET_MODEL_DIR);
const loadMs = performance.now() - t0;

const timings: number[] = [];
for (let round = 0; round < 10; round++) {
	for (const { q } of queries) {
		const start = performance.now();
		embedText(model, q);
		timings.push(performance.now() - start);
	}
}
timings.sort((a, b) => a - b);
const pct = (p: number) =>
	timings[Math.min(timings.length - 1, Math.floor(p * timings.length))];
console.log(
	`chargement ${loadMs.toFixed(0)} ms · embedding p50 ${pct(0.5).toFixed(3)} ms · p95 ${pct(0.95).toFixed(3)} ms (${timings.length} appels)`,
);
