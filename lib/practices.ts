import type { Translator } from "@/i18n/translator";

/** Pratiques d'ingénierie (liste fermée) regroupées en trois familles. */
export const FAMILIES = ["DevOps", "SecOps", "MLOps"] as const;
export type PracticeFamily = (typeof FAMILIES)[number];

export const PRACTICES = [
	"ContinuousIntegration",
	"Containerization",
	"ContinuousDeployment",
	"AutomatedTesting",
	"Observability",
	"DependencyUpdates",
	"StaticAnalysis",
	"SecretsManagement",
	"Hardening",
	"ExperimentTracking",
	"ModelRegistry",
	"DataVersioning",
	"ModelServing",
	"LlmEvaluation",
] as const;
export type Practice = (typeof PRACTICES)[number];

export const PRACTICE_FAMILY: Record<Practice, PracticeFamily> = {
	ContinuousIntegration: "DevOps",
	Containerization: "DevOps",
	ContinuousDeployment: "DevOps",
	AutomatedTesting: "DevOps",
	Observability: "DevOps",
	DependencyUpdates: "SecOps",
	StaticAnalysis: "SecOps",
	SecretsManagement: "SecOps",
	Hardening: "SecOps",
	ExperimentTracking: "MLOps",
	ModelRegistry: "MLOps",
	DataVersioning: "MLOps",
	ModelServing: "MLOps",
	LlmEvaluation: "MLOps",
};

/**
 * Libellés d'affichage d'une pratique, traduits à la demande : la liste des pratiques et
 * leur famille restent des constantes (elles sont la clé de la base, pas de l'affichage).
 */
export function practiceLabels(t: Translator): Record<Practice, string> {
	return {
		ContinuousIntegration: t("ContinuousIntegration"),
		Containerization: t("Containerization"),
		ContinuousDeployment: t("ContinuousDeployment"),
		AutomatedTesting: t("AutomatedTesting"),
		Observability: t("Observability"),
		DependencyUpdates: t("DependencyUpdates"),
		StaticAnalysis: t("StaticAnalysis"),
		SecretsManagement: t("SecretsManagement"),
		Hardening: t("Hardening"),
		ExperimentTracking: t("ExperimentTracking"),
		ModelRegistry: t("ModelRegistry"),
		DataVersioning: t("DataVersioning"),
		ModelServing: t("ModelServing"),
		LlmEvaluation: t("LlmEvaluation"),
	};
}

export const PRACTICES_OF: Record<PracticeFamily, Practice[]> = {
	DevOps: PRACTICES.filter((p) => PRACTICE_FAMILY[p] === "DevOps"),
	SecOps: PRACTICES.filter((p) => PRACTICE_FAMILY[p] === "SecOps"),
	MLOps: PRACTICES.filter((p) => PRACTICE_FAMILY[p] === "MLOps"),
};

const isPractice = (v: string): v is Practice =>
	(PRACTICES as readonly string[]).includes(v);

/** Filtre les valeurs inconnues, dédoublonne, ordre canonique. */
export function normalizePractices(input: readonly string[]): Practice[] {
	const set = new Set(input.filter(isPractice));
	return PRACTICES.filter((p) => set.has(p));
}

/** Familles présentes, chacune avec ses pratiques, dans l'ordre canonique. */
export function practicesByFamily(
	values: readonly string[],
): { family: PracticeFamily; practices: Practice[] }[] {
	const list = normalizePractices(values);
	return FAMILIES.map((family) => ({
		family,
		practices: list.filter((p) => PRACTICE_FAMILY[p] === family),
	})).filter((g) => g.practices.length > 0);
}

export function familiesOf(values: readonly string[]): PracticeFamily[] {
	return practicesByFamily(values).map((g) => g.family);
}
