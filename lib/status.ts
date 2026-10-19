import type { Translator } from "@/i18n/translator";

export const PROJECT_STATUSES = ["InProgress", "Done", "Archived"] as const;

export type ProjectStatusValue = (typeof PROJECT_STATUSES)[number];

/**
 * Libellés d'affichage d'un projet, traduits à la demande.
 *
 * Une fonction et non une constante : le dictionnaire dépend de la locale de la route,
 * alors que ces libellés sont consommés aussi bien par des composants serveur que par
 * des tests, tous deux hors de portée d'un hook.
 */
export function statusLabels(
	t: Translator,
): Record<ProjectStatusValue, string> {
	return {
		InProgress: t("InProgress"),
		Done: t("Done"),
		Archived: t("Archived"),
	};
}
