/** Parcours de formation OpenClassrooms (badge « Projet de formation »). */
export const TRAININGS = ["FullstackAI", "AIEngineer"] as const;
export type Training = (typeof TRAININGS)[number];

export const TRAINING_LABELS: Record<Training, string> = {
	FullstackAI: "Développeur FullStack IA",
	AIEngineer: "AI Engineer",
};

export const trainingBadge = (t: Training) =>
	`Projet de formation · OpenClassrooms · ${TRAINING_LABELS[t]}`;

export const trainingBadgeShort = (t: Training) =>
	`Formation OC · ${TRAINING_LABELS[t]}`;

export const isTraining = (v: unknown): v is Training =>
	typeof v === "string" && (TRAININGS as readonly string[]).includes(v);

/** Indice seulement : un nom `OC-…`, `OC_…` ou `P<n>-…` ressemble à un projet OpenClassrooms. */
export const looksLikeOpenClassrooms = (repoName: string) =>
	/^(oc[-_]|p\d+[-_])/i.test(repoName);
