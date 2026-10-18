import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import zh from "@/messages/zh.json";

/** Aplatit un dictionnaire imbriqué en chemins pointés : {a: {b: 1}} → ["a.b"]. */
function keys(value: unknown, prefix = ""): string[] {
	if (typeof value !== "object" || value === null) return [prefix];
	return Object.entries(value)
		.flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k))
		.sort();
}

const base = keys(fr);

describe("parité des messages", () => {
	it("fr est le dictionnaire de référence non vide", () => {
		expect(base.length).toBeGreaterThan(0);
	});

	it.each([
		["en", en],
		["zh", zh],
	])("%s couvre exactement les mêmes clés que fr", (_locale, dict) => {
		expect(keys(dict)).toEqual(base);
	});
});
