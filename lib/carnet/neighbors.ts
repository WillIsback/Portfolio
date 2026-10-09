import type { MapData } from "./map-types";
import { cosine } from "./static-model";

/** Les k éléments les plus proches de `id` (lui-même exclu) : cosinus décroissant, puis `id`. */
export function nearestTo(map: MapData, id: string, k = 3): MapData["items"] {
	const self = map.items.find((i) => i.id === id);
	if (!self) return [];
	return map.items
		.filter((other) => other.id !== id)
		.map((other) => ({ other, score: cosine(self.vector, other.vector) }))
		.sort((a, b) => b.score - a.score || a.other.id.localeCompare(b.other.id))
		.slice(0, k)
		.map((s) => s.other);
}
