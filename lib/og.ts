/** Longueur maximale du titre d'une image de partage, « … » compris. */
const MAX_TITLE = 90;

/** Couleurs des images de partage : `--background` et `--primary` du thème clair. */
export const OG_COLORS = {
	background: "#fbfcff",
	title: "#3b3a9e",
	ink: "#1f2233",
} as const;

export const OG_SIZE = { width: 1200, height: 630 };

/** Ligne de signature, en bas de chaque image. */
export const OG_SIGNATURE = "William Derue · WillisBack";

/**
 * Textes d'une image de partage. Un titre trop long est coupé au dernier espace
 * avant la limite, puis terminé par « … » ; un mot unique trop long est coupé net.
 */
export function ogText(input: { title: string; kicker: string }): {
	title: string;
	kicker: string;
} {
	const title = input.title.trim();
	if (title.length <= MAX_TITLE) return { title, kicker: input.kicker };
	const room = title.slice(0, MAX_TITLE - 1);
	const space = room.lastIndexOf(" ");
	const cut = (space > 0 ? room.slice(0, space) : room).trimEnd();
	return { title: `${cut}…`, kicker: input.kicker };
}
