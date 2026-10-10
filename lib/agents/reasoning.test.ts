import { describe, expect, it } from "vitest";
import { requestOptions } from "./reasoning";

describe("requestOptions", () => {
	it("chat : thinking désactivé, sampling non-thinking", () => {
		expect(requestOptions("chat")).toEqual({
			temperature: 0.7,
			topP: 0.8,
			presencePenalty: 1.5,
			providerOptions: {
				vllm: { chat_template_kwargs: { enable_thinking: false } },
			},
		});
	});

	it("génération : thinking activé, top_k transmis", () => {
		expect(requestOptions("generation")).toEqual({
			temperature: 1.0,
			topP: 0.95,
			presencePenalty: 0,
			providerOptions: {
				vllm: { chat_template_kwargs: { enable_thinking: true }, top_k: 20 },
			},
		});
	});
});
