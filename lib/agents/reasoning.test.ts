import { describe, expect, it } from "vitest";
import { requestOptions } from "./reasoning";

describe("requestOptions", () => {
	it("chat : thinking désactivé, sampling non-thinking", () => {
		const o = requestOptions("chat");
		expect(o.temperature).toBe(0.7);
		expect(o.providerOptions?.vllm).toMatchObject({
			chat_template_kwargs: { enable_thinking: false },
		});
	});

	it("génération : thinking activé, top_k transmis", () => {
		const o = requestOptions("generation");
		expect(o.temperature).toBe(1.0);
		expect(o.providerOptions?.vllm).toMatchObject({
			chat_template_kwargs: { enable_thinking: true },
			top_k: 20,
		});
	});
});
