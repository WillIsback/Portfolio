import type { MapData } from "./map-types";
import type { SearchItem } from "./search";

export interface MapPoint {
	id: string;
	kind: "article" | "project";
	title: string;
	href: string;
	x: number;
	y: number;
	cluster: number;
}

export interface MapCluster {
	id: string;
	label: string;
	index: number;
	count: number;
}

/** Coordonnée [0, 1] → viewBox 0–100 avec 6 % de marge (aussi utilisée en % pour l'info-bulle). */
export function toPercent(v: number): number {
	return 6 + v * 88;
}

export function toMapView(
	map: MapData,
	labels: Record<string, string>,
): { points: MapPoint[]; clusters: MapCluster[] } {
	const index = new Map(map.clusters.map((c, i) => [c.id, i + 1]));
	const points = map.items.map((item) => ({
		id: item.id,
		kind: item.kind,
		title: item.title,
		href: item.href,
		x: item.x,
		y: item.y,
		cluster: index.get(item.cluster) ?? 1,
	}));
	const clusters = map.clusters.map((c, i) => ({
		id: c.id,
		label: labels[c.id] ?? c.label,
		index: i + 1,
		count: map.items.filter((item) => item.cluster === c.id).length,
	}));
	return { points, clusters };
}

export function toSearchItems(map: MapData): SearchItem[] {
	return map.items.map((item) => ({
		id: item.id,
		title: item.title,
		keywords: item.keywords,
		terms: item.terms,
	}));
}
