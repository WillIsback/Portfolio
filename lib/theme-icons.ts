/**
 * Logos SVG monochromes (tracé noir) qui disparaissent sur fond sombre.
 * On les inverse en mode sombre ; les logos colorés restent intacts.
 */
const MONOCHROME_ICONS = new Set([
	"/icon/Github.svg",
	"/icon/Expressjs.svg",
	"/icon/Fastify.svg",
	"/icon/Informix.svg",
	"/icon/Tanstack.svg",
]);

export function invertOnDark(src?: string): string {
	return src && MONOCHROME_ICONS.has(src) ? "dark:invert" : "";
}
