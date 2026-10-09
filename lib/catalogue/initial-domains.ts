import { type AiDomain, normalizeDomains } from "../domains";

/** Étiquetage initial validé (spec 2026-10-10) : id de projet → domaines. */
const RAW: Record<number, AiDomain[]> = {
	1: ["LLM"],
	2: ["LLM", "NLP"],
	6: ["DataAnalysis", "ML", "Classifier"],
	8: ["DataAnalysis"],
	9: ["DataAnalysis", "ML", "Regressor"],
	12: ["Vision"],
	13: ["Speech", "LLM", "NLP"],
	14: ["LLM", "NLP", "ML"],
	16: ["LLM", "NLP", "Classifier"],
	17: ["ML", "Classifier", "NLP", "LLM"],
	18: ["ML", "Classifier", "NLP"],
	19: ["LLM"],
	20: ["Speech", "LLM"],
	21: ["Speech"],
	22: ["LLM", "NLP"],
	24: ["LLM", "Agents"],
	25: ["LLM"],
	26: ["ML", "Vision"],
};

export const INITIAL_DOMAINS: Record<number, AiDomain[]> = Object.fromEntries(
	Object.entries(RAW).map(([id, domains]) => [id, normalizeDomains(domains)]),
);
