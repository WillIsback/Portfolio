export const AI_DOMAINS = [
	"DataAnalysis",
	"ML",
	"Classifier",
	"Regressor",
	"LLM",
	"Vision",
	"NLP",
	"Agents",
	"Speech",
] as const;

export type AiDomain = (typeof AI_DOMAINS)[number];

export const DOMAIN_LABELS: Record<AiDomain, string> = {
	DataAnalysis: "Data analyse",
	ML: "ML",
	Classifier: "Classification",
	Regressor: "Régression",
	LLM: "LLM",
	Vision: "Vision",
	NLP: "NLP",
	Agents: "Agents",
	Speech: "Parole",
};

function isAiDomain(value: string): value is AiDomain {
	return (AI_DOMAINS as readonly string[]).includes(value);
}

/** Filtre les valeurs inconnues, dédoublonne, impose ML si Classifier/Regressor, trie. */
export function normalizeDomains(input: readonly string[]): AiDomain[] {
	const set = new Set<AiDomain>(input.filter(isAiDomain));
	if (set.has("Classifier") || set.has("Regressor")) set.add("ML");
	return AI_DOMAINS.filter((d) => set.has(d));
}

/** Libellés d'affichage, dans l'ordre canonique ; valeurs inconnues ignorées. */
export function domainLabels(domains: { domain: string }[]): string[] {
	return normalizeDomains(domains.map((d) => d.domain)).map(
		(d) => DOMAIN_LABELS[d],
	);
}
