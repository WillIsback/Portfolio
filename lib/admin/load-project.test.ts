import { describe, expect, it, vi } from "vitest";
import { loadAdminProject, type Row, toAdminProject } from "./load-project";

vi.mock("@/lib/db", () => ({
	default: { project: { findUnique: vi.fn(async () => null) } },
}));

describe("toAdminProject", () => {
	it("convertit les relations en tableaux de valeurs", () => {
		const row: Row = {
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
		const a = toAdminProject(row);
		expect(a.languages).toEqual(["Python"]);
		expect(a.domains).toEqual(["LLM"]);
		expect(a.githubRepoId).toBe(42);
		expect(a.lastUpdate).toBe("2026-01-02T00:00:00.000Z");
		expect(a.imagePath).toBe("");
	});

	it("coerce les valeurs nulles vers des chaînes vides ou absentes", () => {
		const row: Row = {
			title: "Alpha",
			description: "Desc.",
			imagePath: null,
			github: null,
			lastUpdate: null,
			isPrivate: false,
			isAiGenerated: false,
			pitch: null,
			status: null,
			period: null,
			githubRepoId: null,
			featuredRank: null,
			training: null,
			languages: [],
			databases: [],
			backends: [],
			frontends: [],
			devops: [],
			domains: [],
			mlStack: [],
			practices: [],
		};
		const a = toAdminProject(row);
		expect(a.imagePath).toBe("");
		expect(a.github).toBe("");
		expect(a.lastUpdate).toBe("");
		expect(a.pitch).toBeUndefined();
		expect(a.status).toBeUndefined();
		expect(a.period).toBeUndefined();
		expect(a.githubRepoId).toBeUndefined();
		expect(a.featuredRank).toBeUndefined();
		expect(a.training).toBeNull();
		expect(a.languages).toEqual([]);
	});
});

describe("loadAdminProject", () => {
	it("renvoie null quand le projet est introuvable", async () => {
		expect(await loadAdminProject(1)).toBeNull();
	});
});
