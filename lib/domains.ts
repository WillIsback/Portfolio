import type { Translator } from "@/i18n/translator";

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

/**
 * Sigles et anglicismes techniques, identiques dans les trois langues : les mettre dans
 * le dictionnaire créerait trois clés qui ne se distinguent pas, donc trois occasions
 * de diverger pour rien.
 */
const LITERAL_DOMAIN_LABELS = {
	ML: "ML",
	LLM: "LLM",
	Vision: "Vision",
	NLP: "NLP",
} as const satisfies Partial<Record<AiDomain, string>>;

export function domainLabels(t: Translator): Record<AiDomain, string> {
	return {
		DataAnalysis: t("DataAnalysis"),
		ML: LITERAL_DOMAIN_LABELS.ML,
		Classifier: t("Classifier"),
		Regressor: t("Regressor"),
		LLM: LITERAL_DOMAIN_LABELS.LLM,
		Vision: LITERAL_DOMAIN_LABELS.Vision,
		NLP: LITERAL_DOMAIN_LABELS.NLP,
		Agents: t("Agents"),
		Speech: t("Speech"),
	};
}

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
export function domainLabelList(
	t: Translator,
	domains: { domain: string }[],
): string[] {
	const labels = domainLabels(t);
	return normalizeDomains(domains.map((d) => d.domain)).map((d) => labels[d]);
}

/** Lignes ProjectDomain à insérer (normalisées) pour un projet. */
export function buildDomainRows(
	projectId: number,
	domains: readonly string[],
): { projectId: number; domain: AiDomain }[] {
	return normalizeDomains(domains).map((domain) => ({ projectId, domain }));
}
