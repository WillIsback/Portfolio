import type { JSONValue } from "ai";

export type AgentMode = "chat" | "generation";

export interface RequestOptions {
	temperature: number;
	topP: number;
	presencePenalty: number;
	providerOptions: {
		vllm: Record<string, JSONValue>;
	};
}

/**
 * Paramètres Qwen3.8-Flash-Next (cf. model card) : thinking désactivé en chat
 * (réponses directes), activé pour la génération (qualité rédactionnelle).
 * `top_k` est non standard → transmis via providerOptions (ajouté au corps).
 */
export function requestOptions(mode: AgentMode): RequestOptions {
	if (mode === "chat") {
		return {
			temperature: 0.7,
			topP: 0.8,
			presencePenalty: 1.5,
			providerOptions: {
				vllm: { chat_template_kwargs: { enable_thinking: false } },
			},
		};
	}
	return {
		temperature: 1.0,
		topP: 0.95,
		presencePenalty: 0,
		providerOptions: {
			vllm: { chat_template_kwargs: { enable_thinking: true }, top_k: 20 },
		},
	};
}
