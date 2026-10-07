import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadCorpus } from "./load-corpus";

(async () => {
	const OUT = path.join(process.cwd(), "scripts", "distill", "corpus.json");

	const corpus = await loadCorpus();
	mkdirSync(path.dirname(OUT), { recursive: true });
	writeFileSync(OUT, `${JSON.stringify(corpus, null, 2)}\n`);
	const counts = corpus.reduce<Record<string, number>>((acc, item) => {
		acc[item.kind] = (acc[item.kind] ?? 0) + 1;
		return acc;
	}, {});
	console.log(`corpus.json : ${corpus.length} éléments`, counts);
})();
