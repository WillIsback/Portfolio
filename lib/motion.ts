/** Langage d'animation du carnet (spec §5). */
export const INK_DRAW_SECONDS = 0.6;
export const NOTE_SECONDS = 0.4;
export const NOTE_DELAY_SECONDS = 0.25;
export const EASE_INK = [0.65, 0, 0.35, 1] as const;

/** `useReducedMotion()` vaut `null` au rendu serveur : seul `false` autorise le mouvement. */
export function inkDrawAnimation(reduced: boolean | null) {
	return reduced === false ? { pathLength: [0, 1] } : undefined;
}
