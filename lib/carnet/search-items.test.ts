import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MapDataSchema } from "./map-types";
import { toSearchItems } from "./map-view";

const read = (name: string) =>
	JSON.parse(readFileSync(path.join(process.cwd(), "content", name), "utf8"));

describe("content/search-items.json", () => {
	it("est dérivé de content/map.json (sinon : relancer `pnpm embeddings`)", () => {
		const map = MapDataSchema.parse(read("map.json"));
		expect(read("search-items.json")).toEqual(toSearchItems(map));
	});
});
