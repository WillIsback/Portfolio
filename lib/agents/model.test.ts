import { afterEach, describe, expect, it, vi } from "vitest";
import {
	createModelResolver,
	resetModelResolverForTests,
	resolveModelId,
} from "./model";

function fakeFetch(ids: string[], status = 200) {
	const calls = { n: 0 };
	const fetchImpl = vi.fn(async () => {
		calls.n++;
		return new Response(JSON.stringify({ data: ids.map((id) => ({ id })) }), {
			status,
		});
	});
	return { fetchImpl, calls };
}

describe("createModelResolver", () => {
	it("prend le premier id de /v1/models", async () => {
		const { fetchImpl } = fakeFetch(["qwen3.8-flash-next", "autre"]);
		const resolve = createModelResolver({
			baseUrl: "https://x/v1",
			headers: { "CF-Access-Client-Id": "a" },
			fetchImpl,
		});
		expect(await resolve()).toBe("qwen3.8-flash-next");
	});

	it("met en cache pendant le TTL", async () => {
		const { fetchImpl, calls } = fakeFetch(["m"]);
		let now = 1000;
		const resolve = createModelResolver({
			baseUrl: "https://x/v1",
			headers: {},
			fetchImpl,
			ttlMs: 1000,
			now: () => now,
		});
		await resolve();
		now = 1500;
		await resolve();
		expect(calls.n).toBe(1);
		now = 5000;
		await resolve();
		expect(calls.n).toBe(2);
	});

	it("lève une erreur si la réponse HTTP n'est pas ok", async () => {
		const { fetchImpl } = fakeFetch([], 403);
		const resolve = createModelResolver({
			baseUrl: "https://x/v1",
			headers: {},
			fetchImpl,
		});
		await expect(resolve()).rejects.toThrow(/403/);
	});

	it("lève une erreur si aucun modèle n'est servi", async () => {
		const { fetchImpl } = fakeFetch([]);
		const resolve = createModelResolver({
			baseUrl: "https://x/v1",
			headers: {},
			fetchImpl,
		});
		await expect(resolve()).rejects.toThrow(/Aucun modèle/);
	});
});

describe("resolveModelId", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		resetModelResolverForTests();
		delete process.env.VLLM_MODEL;
		delete process.env.VLLM_API_KEY;
		delete process.env.CF_ACCESS_CLIENT_ID;
	});

	it("envoie l'API key vLLM (Authorization) sur /models", async () => {
		process.env.VLLM_BASE_URL = "https://x/v1";
		process.env.VLLM_API_KEY = "sk-test";
		const seen: RequestInit[] = [];
		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url: string, init?: RequestInit) => {
				seen.push(init ?? {});
				return new Response(JSON.stringify({ data: [{ id: "m" }] }), {
					status: 200,
				});
			}),
		);
		expect(await resolveModelId()).toBe("m");
		expect((seen[0].headers as Record<string, string>).Authorization).toBe(
			"Bearer sk-test",
		);
	});

	it("n'ajoute pas Authorization si la clé est absente", async () => {
		process.env.VLLM_BASE_URL = "https://x/v1";
		const seen: RequestInit[] = [];
		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url: string, init?: RequestInit) => {
				seen.push(init ?? {});
				return new Response(JSON.stringify({ data: [{ id: "m" }] }), {
					status: 200,
				});
			}),
		);
		await resolveModelId();
		expect(
			(seen[0].headers as Record<string, string>).Authorization,
		).toBeUndefined();
	});
});
