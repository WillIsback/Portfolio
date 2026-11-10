import { describe, expect, it } from "vitest";
import { articleLocales } from "./loader";

describe("articleLocales", () => {
	it("liste les locales où l'article est réellement écrit", () => {
		expect(articleLocales("syntheo-beta-0-7")).toEqual(["fr", "en", "zh"]);
	});

	it("renvoie une liste vide pour un article inconnu", () => {
		expect(articleLocales("n-existe-pas")).toEqual([]);
	});
});
