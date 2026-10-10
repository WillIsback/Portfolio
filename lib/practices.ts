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

export const PRACTICE_LABELS: Record<Practice, string> = {
	ContinuousIntegration: "Intégration continue",
	Containerization: "Conteneurisation",
	ContinuousDeployment: "Déploiement automatisé",
	AutomatedTesting: "Tests automatisés",
	Observability: "Observabilité",
	DependencyUpdates: "Veille des dépendances",
	StaticAnalysis: "Analyse de code (SAST)",
	SecretsManagement: "Gestion des secrets",
	Hardening: "Durcissement",
	ExperimentTracking: "Suivi d'expériences",
	ModelRegistry: "Registre de modèles",
	DataVersioning: "Versionnage des données",
	ModelServing: "Service de modèle",
	LlmEvaluation: "Évaluation / monitoring LLM",
};

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
