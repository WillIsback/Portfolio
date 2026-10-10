import { describe, expect, it } from "vitest";
import { toAdminProject } from "./load-project";

describe("toAdminProject", () => {
	it("convertit les relations en tableaux de valeurs", () => {
		const row = {
			id: 1,
			title: "Alpha",
			description: "Desc.",
			imagePath: null,
			github: "https://github.com/a/b",
			lastUpdate: new Date("2026-01-02T00:00:00.000Z"),
			isPrivate: false,
			isAiGenerated: false,
			pitch: null,
			status: "Done",
			period: null,
			githubRepoId: 42,
			featuredRank: null,
			training: null,
			languages: [{ language: "Python" }],
			databases: [],
			backends: [],
			frontends: [],
			devops: [],
			domains: [{ domain: "LLM" }],
			mlStack: [{ ml: "PyTorch" }],
			practices: [{ practice: "Hardening" }],
		};
		const a = toAdminProject(row as never);
		expect(a.languages).toEqual(["Python"]);
		expect(a.domains).toEqual(["LLM"]);
		expect(a.githubRepoId).toBe(42);
		expect(a.lastUpdate).toBe("2026-01-02T00:00:00.000Z");
		expect(a.imagePath).toBe("");
	});
});
