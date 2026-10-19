import type { Translator } from "@/i18n/translator";
import type { MapData } from "@/lib/carnet/map-types";
import { nearestTo } from "@/lib/carnet/neighbors";
import type { NormalizedProject } from "@/lib/projects-data";
import { techLabel } from "@/lib/tech-labels";

export const FEATURED_MIN = 4;
export const FEATURED_MAX = 6;

/** `lastUpdate` peut arriver sérialisé en chaîne depuis l'action serveur. */
const time = (d: Date | string | null) => (d ? new Date(d).getTime() : 0);

const byRecent = (a: NormalizedProject, b: NormalizedProject) =>
	time(b.lastUpdate) - time(a.lastUpdate) || a.id - b.id;

/** Projets publics classés (`featuredRank`, ordre croissant, 6 au plus) ; sinon règle automatique (domaines IA/Data, récence). */
export function selectFeatured(
	projects: NormalizedProject[],
): NormalizedProject[] {
	const visible = projects.filter((p) => !p.isPrivate);
	const ranked = visible
		.filter((p) => p.featuredRank !== null)
		.sort(
			(a, b) => (a.featuredRank ?? 0) - (b.featuredRank ?? 0) || a.id - b.id,
		);
	if (ranked.length > 0) return ranked.slice(0, FEATURED_MAX);
	const sorted = [...visible].sort(byRecent);
	const flagged = sorted.filter((p) => p.domains.length > 0);
	const fill = sorted.filter((p) => p.domains.length === 0);
	const picked = [
		...flagged,
		...fill.slice(0, Math.max(0, FEATURED_MIN - flagged.length)),
	];
	return picked.slice(0, FEATURED_MAX);
}

export function splitIndex(
	all: NormalizedProject[],
	filtered: NormalizedProject[],
	featured: NormalizedProject[],
	filtersActive: boolean,
): NormalizedProject[] {
	if (filtersActive) return filtered;
	const ids = new Set(featured.map((p) => p.id));
	return all.filter((p) => !ids.has(p.id));
}

export interface TechShare {
	key:
		| "languages"
		| "mlStack"
		| "databases"
		| "backends"
		| "frontends"
		| "devops";
	label: string;
	count: number;
	share: number;
}

const CATEGORIES: {
	key: TechShare["key"];
	names: (p: NormalizedProject) => string[];
}[] = [
	{
		key: "languages",
		names: (p) => p.languages.map((l) => l.language),
	},
	{
		key: "mlStack",
		names: (p) => p.mlStack.map((m) => m.ml),
	},
	{
		key: "databases",
		names: (p) => p.databases.map((d) => d.database),
	},
	{
		key: "backends",
		names: (p) => p.backends.map((b) => b.backend),
	},
	{
		key: "frontends",
		names: (p) => p.frontends.map((f) => f.frontend),
	},
	{
		key: "devops",
		names: (p) => p.devops.map((d) => d.devops),
	},
];

/**
 * Part de chaque famille technologique non vide, dans l'ordre fixe.
 *
 * `t` porte le namespace `register` : le libellé affiché vit dans `register.tech.*`,
 * pas ici. `lib/` est consommé hors React (tests, scripts), donc il reçoit le
 * traducteur au lieu de lire une locale de requête.
 */
export function techComposition(
	p: NormalizedProject,
	t: Translator,
): TechShare[] {
	const counts = CATEGORIES.map((c) => ({
		key: c.key,
		label: t(`tech.${c.key}`),
		count: c.names(p).length,
	}));
	const total = counts.reduce((s, c) => s + c.count, 0);
	if (total === 0) return [];
	return counts
		.filter((c) => c.count > 0)
		.map((c) => ({ ...c, share: c.count / total }));
}

export function techNames(p: NormalizedProject): string[] {
	return CATEGORIES.flatMap((c) => c.names(p)).map(techLabel);
}

const RAW_CAPTURE_PREFIX = "https://raw.githubusercontent.com/WillIsback/";

/** Une vraie capture d'écran : image matricielle locale ("/…") ou hébergée sur raw.githubusercontent.com/WillIsback/ (seul hôte autorisé dans next/image). */
export function isCapture(imagePath: string | null): boolean {
	if (!imagePath) return false;
	const local = imagePath.startsWith("/") && !imagePath.startsWith("//");
	if (!local && !imagePath.startsWith(RAW_CAPTURE_PREFIX)) return false;
	return /\.(png|jpe?g|webp|avif)$/i.test(imagePath);
}

export function mapNeighbors(map: MapData, k = 3): Record<string, string[]> {
	return Object.fromEntries(
		map.items
			.filter((i) => i.kind === "project")
			.map((i) => [i.id, nearestTo(map, i.id, k).map((n) => n.id)]),
	);
}

export function projectYear(p: NormalizedProject): string {
	return p.lastUpdate ? String(new Date(p.lastUpdate).getUTCFullYear()) : "—";
}
