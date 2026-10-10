import { type AgentFetch, vllmBaseUrl, vllmHeaders } from "./provider";

export const MODEL_TTL_MS = 5 * 60 * 1000;

export interface ModelResolverOptions {
	baseUrl: string;
	headers: Record<string, string>;
	fetchImpl?: AgentFetch;
	ttlMs?: number;
	now?: () => number;
}

export function createModelResolver({
	baseUrl,
	headers,
	fetchImpl = fetch,
	ttlMs = MODEL_TTL_MS,
	now = Date.now,
}: ModelResolverOptions): () => Promise<string> {
	let cache: { id: string; at: number } | null = null;
	return async () => {
		const t = now();
		if (cache && t - cache.at < ttlMs) return cache.id;
		const res = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/models`, {
			headers,
		});
		if (!res.ok)
			throw new Error(`Découverte du modèle impossible (${res.status}).`);
		const body = (await res.json()) as { data?: { id?: string }[] };
		const id = body.data?.[0]?.id;
		if (!id) throw new Error("Aucun modèle servi par le serveur.");
		cache = { id, at: t };
		return id;
	};
}

let singleton: (() => Promise<string>) | null = null;

/** Modèle courant : pin `VLLM_MODEL` si défini, sinon auto-discover. */
export async function resolveModelId(): Promise<string> {
	const pinned = process.env.VLLM_MODEL;
	if (pinned) return pinned;
	singleton ??= createModelResolver({
		baseUrl: vllmBaseUrl(),
		headers: vllmHeaders(),
	});
	return singleton();
}
