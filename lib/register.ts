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
	label: string;
	names: (p: NormalizedProject) => string[];
}[] = [
	{
		key: "languages",
		label: "Langages",
		names: (p) => p.languages.map((l) => l.language),
	},
	{
		key: "mlStack",
		label: "ML & Data",
		names: (p) => p.mlStack.map((m) => m.ml),
	},
	{
		key: "databases",
		label: "Bases de données",
		names: (p) => p.databases.map((d) => d.database),
	},
	{
		key: "backends",
		label: "Back-end",
		names: (p) => p.backends.map((b) => b.backend),
	},
	{
		key: "frontends",
		label: "Front-end",
		names: (p) => p.frontends.map((f) => f.frontend),
	},
	{
		key: "devops",
		label: "DevOps",
		names: (p) => p.devops.map((d) => d.devops),
	},
];

export function techComposition(p: NormalizedProject): TechShare[] {
	const counts = CATEGORIES.map((c) => ({
		key: c.key,
		label: c.label,
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
	if (!imagePath.startsWith("/") && !imagePath.startsWith(RAW_CAPTURE_PREFIX))
		return false;
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
