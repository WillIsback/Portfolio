import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export type AgentFetch = (
	input: RequestInfo | URL,
	init?: RequestInit,
) => Promise<Response>;

export function vllmHeaders(): Record<string, string> {
	const headers: Record<string, string> = {};
	const id = process.env.CF_ACCESS_CLIENT_ID;
	const secret = process.env.CF_ACCESS_CLIENT_SECRET;
	if (id) headers["CF-Access-Client-Id"] = id;
	if (secret) headers["CF-Access-Client-Secret"] = secret;
	return headers;
}

export function vllmBaseUrl(): string {
	const url = process.env.VLLM_BASE_URL;
	if (!url) throw new Error("VLLM_BASE_URL manquant.");
	return url.replace(/\/$/, "");
}

export function vllmProvider() {
	return createOpenAICompatible({
		name: "vllm",
		baseURL: vllmBaseUrl(),
		apiKey: process.env.VLLM_API_KEY,
		headers: vllmHeaders(),
	});
}
