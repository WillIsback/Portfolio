import type { MapData } from "@/lib/carnet/map-types";
import { cosine } from "@/lib/carnet/static-model";
import type { NormalizedProject } from "@/lib/projects-data";
import { techLabel } from "@/lib/tech-labels";

export const FEATURED_MIN = 4;
export const FEATURED_MAX = 6;

/** `lastUpdate` peut arriver sérialisé en chaîne depuis l'action serveur. */
const time = (d: Date | string | null) => (d ? new Date(d).getTime() : 0);

const byRecent = (a: NormalizedProject, b: NormalizedProject) =>
	time(b.lastUpdate) - time(a.lastUpdate) || a.id - b.id;

/** Spec §6.4 : ML/IAG publics du plus récent au plus ancien ; liste explicite prioritaire. */
export function selectFeatured(
	projects: NormalizedProject[],
	explicitIds: number[],
): NormalizedProject[] {
	const visible = projects.filter((p) => !p.isPrivate);
	if (explicitIds.length > 0) {
		const byId = new Map(visible.map((p) => [p.id, p]));
		return [...new Set(explicitIds)]
			.map((id) => byId.get(id))
			.filter((p): p is NormalizedProject => p !== undefined)
			.slice(0, FEATURED_MAX);
	}
	const sorted = [...visible].sort(byRecent);
	const flagged = sorted.filter((p) => p.isML || p.isIAG);
	const fill = sorted.filter((p) => !(p.isML || p.isIAG));
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
	key: "languages" | "databases" | "backends" | "frontends" | "devops";
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

/** Une vraie capture d'écran : image matricielle hors images GitHub par défaut (spec §8.1). */
export function isCapture(imagePath: string | null): boolean {
	if (!imagePath) return false;
	if (/github/i.test(imagePath)) return false;
	return /\.(png|jpe?g|webp|avif)$/i.test(imagePath);
}

export function mapNeighbors(map: MapData, k = 3): Record<string, string[]> {
	const out: Record<string, string[]> = {};
	for (const item of map.items) {
		if (item.kind !== "project") continue;
		out[item.id] = map.items
			.filter((other) => other.id !== item.id)
			.map((other) => ({
				id: other.id,
				score: cosine(item.vector, other.vector),
			}))
			.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
			.slice(0, k)
			.map((s) => s.id);
	}
	return out;
}

export function projectYear(p: NormalizedProject): string {
	return p.lastUpdate ? String(new Date(p.lastUpdate).getUTCFullYear()) : "—";
}
