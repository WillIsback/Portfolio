import type { Translator } from "@/i18n/translator";

/** Champs du formulaire de contact, dans l'ordre de tabulation. */
export const CONTACT_FIELDS = ["email", "sujet", "message"] as const;

export type ContactField = (typeof CONTACT_FIELDS)[number];

/**
 * Résumé annoncé : « 1 champ à corriger », « 3 champs à corriger ».
 *
 * L'accord et l'espace insécable passent par le dictionnaire (`contact.errorSummary`) :
 * le chinois n'a pas de catégorie de pluriel ICU, son message reste donc simple.
 */
export function errorSummary(t: Translator, count: number): string {
	if (count <= 0) return "";
	return t("errorSummary", { count });
}

/** Premier champ en erreur, dans l'ordre du formulaire (pour y ramener le focus). */
export function firstInvalidField<T extends string>(
	order: readonly T[],
	errors: Partial<Record<T, string>>,
): T | null {
	return order.find((field) => Boolean(errors[field])) ?? null;
}

/** Aplatit les erreurs zod (`fieldErrors`, un tableau par champ) en un message par champ. */
export function firstServerErrors<T extends string>(
	raw: Partial<Record<T, string[]>> | null | undefined,
): Partial<Record<T, string>> {
	if (!raw) return {};
	const out: Partial<Record<T, string>> = {};
	for (const [field, messages] of Object.entries(raw) as [
		T,
		string[] | undefined,
	][]) {
		if (messages?.[0]) out[field] = messages[0];
	}
	return out;
}
