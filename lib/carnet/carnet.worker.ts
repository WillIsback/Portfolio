import mapJson from "@/content/map.json";
import {
	createSearchEngine,
	loadStaticModel,
	MODEL_BASE_URL,
	type SearchEngine,
	versionOf,
} from "./engine";
import type { WorkerRequest, WorkerResponse } from "./worker-protocol";

const scope = self as unknown as {
	postMessage(message: WorkerResponse): void;
	onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
};

let engine: Promise<SearchEngine> | null = null;

scope.onmessage = (event) => {
	const message = event.data;
	if (message.type === "init") {
		engine ??= loadStaticModel(
			MODEL_BASE_URL,
			versionOf(mapJson.model),
			(url) => fetch(url),
		).then((model) => createSearchEngine(model, mapJson.items));
		engine.then(
			() => scope.postMessage({ type: "ready" }),
			(error: unknown) =>
				scope.postMessage({
					type: "error",
					message: error instanceof Error ? error.message : String(error),
				}),
		);
		return;
	}
	if (message.type === "query" && engine) {
		engine.then(
			(e) =>
				scope.postMessage({
					type: "result",
					seq: message.seq,
					ranked: e.query(message.text),
				}),
			() => {},
		);
	}
};
