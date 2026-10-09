export const FIGURE_COMPONENTS = [
	"TasksChart",
	"TokensChart",
	"FaultBuckets",
] as const;

const FENCE = /^(```|~~~)/;
const OPEN_TAG = new RegExp(
	`<(${FIGURE_COMPONENTS.join("|")})(?=[\\s/>]|$)`,
	"g",
);

/** Numérote les figures d'un article (spec §8.2) en injectant `figureNumber` dans la source MDX. */
export function numberFigures(source: string): {
	source: string;
	count: number;
} {
	let count = 0;
	let inFence = false;
	const lines = source.split("\n").map((line) => {
		if (FENCE.test(line.trimStart())) {
			inFence = !inFence;
			return line;
		}
		if (inFence) return line;
		// Ignorer le code en ligne : ne remplacer qu'en dehors des segments `…`.
		return line
			.split(/(`[^`]*`)/)
			.map((part) =>
				part.startsWith("`")
					? part
					: part.replace(
							OPEN_TAG,
							(_m, name: string) => `<${name} figureNumber={${++count}}`,
						),
			)
			.join("");
	});
	return { source: lines.join("\n"), count };
}
