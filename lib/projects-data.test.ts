import { describe, expect, it } from "vitest";
import { type NormalizedProject, withProjectDefaults } from "./projects-data";

describe("withProjectDefaults", () => {
	it("complète un objet d'ancien cache sans les champs récents", () => {
		const old = {
			id: 1,
			title: "t",
			languages: [],
		} as unknown as NormalizedProject;
		const p = withProjectDefaults(old);
		expect(p.mlStack).toEqual([]);
		expect(p.domains).toEqual([]);
		expect(p.featuredRank).toBeNull();
		expect(p.pitch).toBeNull();
		expect(p.status).toBeNull();
		expect(p.title).toBe("t");
	});
	it("conserve les valeurs existantes", () => {
		const p = withProjectDefaults({
			mlStack: [{ ml: "PyTorch" }],
			featuredRank: 2,
			pitch: "x",
			status: "InProgress",
			domains: [{ domain: "nlp" }],
		} as unknown as NormalizedProject);
		expect(p.featuredRank).toBe(2);
		expect(p.mlStack).toHaveLength(1);
	});
});
