import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { MapDataSchema } from "../../lib/carnet/map-types";
import { toSearchItems } from "../../lib/carnet/map-view";

/** Dérive content/search-items.json de content/map.json, sans accès à la base. */
const dir = path.join(process.cwd(), "content");
const map = MapDataSchema.parse(
	JSON.parse(readFileSync(path.join(dir, "map.json"), "utf8")),
);
writeFileSync(
	path.join(dir, "search-items.json"),
	`${JSON.stringify(toSearchItems(map), null, 1)}\n`,
);
console.log(`content/search-items.json : ${map.items.length} éléments`);
