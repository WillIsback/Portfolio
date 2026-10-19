import type { Translator } from "@/i18n/translator";

export interface Step {
	year: string;
	title: string;
	description: string;
}

/** Âge révolu à `date` (calcul en UTC, déterministe). */
export function ageOn(date: Date, birth = "1993-05-01"): number {
	const born = new Date(birth);
	let age = date.getUTCFullYear() - born.getUTCFullYear();
	const monthDiff = date.getUTCMonth() - born.getUTCMonth();
	if (
		monthDiff < 0 ||
		(monthDiff === 0 && date.getUTCDate() < born.getUTCDate())
	) {
		age--;
	}
	return age;
}

/**
 * Identifiants des étapes, dans l'ordre chronologique.
 *
 * Une liste fermée plutôt qu'un tableau : chaque étape lit trois clés du dictionnaire,
 * donc il faut savoir lesquelles existent. `lib/about.test.ts` compare cette liste aux
 * clés de `messages/*.json` — une étape ajoutée d'un côté et pas de l'autre casse.
 */
export const PARCOURS_IDS = [
	"automaticien",
	"developpeurCpp",
	"adminSysteme",
	"fullstack",
	"celluleIa",
	"aiEngineer",
] as const;

export function parcours(t: Translator): Step[] {
	return PARCOURS_IDS.map((id) => ({
		year: t(`${id}.year`),
		title: t(`${id}.title`),
		description: t(`${id}.description`),
	}));
}
