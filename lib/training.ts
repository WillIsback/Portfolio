import type { Translator } from "@/i18n/translator";

/** Parcours de formation OpenClassrooms (badge « Projet de formation »). */
export const TRAININGS = ["FullstackAI", "AIEngineer"] as const;
export type Training = (typeof TRAININGS)[number];

export function trainingLabels(t: Translator): Record<Training, string> {
	return {
		FullstackAI: t("FullstackAI"),
		AIEngineer: t("AIEngineer"),
	};
}

/** `{course}` est injecté par le message : le libellé vit dans le dictionnaire, pas ici. */
export const trainingBadge = (t: Translator, training: Training) =>
	t("badge", { course: trainingLabels(t)[training] });

export const trainingBadgeShort = (t: Translator, training: Training) =>
	t("badgeShort", { course: trainingLabels(t)[training] });

export const isTraining = (v: unknown): v is Training =>
	typeof v === "string" && (TRAININGS as readonly string[]).includes(v);

/** Indice seulement : un nom `OC-…`, `OC_…` ou `P<n>-…` ressemble à un projet OpenClassrooms. */
export const looksLikeOpenClassrooms = (repoName: string) =>
	/^(oc[-_]|p\d+[-_])/i.test(repoName);
