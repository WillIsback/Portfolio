import { beforeEach, describe, expect, it, vi } from "vitest";

const { getProjects, getProjectById, getFilterOptions, analyzeRepo } =
	vi.hoisted(() => ({
		getProjects: vi.fn(async () => [
			{
				id: 1,
				title: "Alpha",
				description: "Desc.",
				pitch: null,
				status: "Done",
				domains: [{ domain: "LLM" }],
				languages: [{ language: "Python" }],
			} as never,
		]),
		getProjectById: vi.fn(async () => ({ id: 1, title: "Alpha" })),
		getFilterOptions: vi.fn(async () => ({
			languages: ["Python"],
			databases: [],
			backends: [],
			frontends: [],
			devops: [],
		})),
		analyzeRepo: vi.fn(async () => ({ ok: true, remote: { fullName: "a/b" } })),
	}));

const { loadAdminProject } = vi.hoisted(() => ({
	loadAdminProject: vi.fn(async () => null),
}));

vi.mock("@/app/actions/projects.action", () => ({
	getProjects,
	getProjectById,
	getFilterOptions,
}));
vi.mock("@/app/actions/admin.action", () => ({ analyzeRepo }));
vi.mock("@/lib/admin/load-project", () => ({ loadAdminProject }));

import { projectTools } from "./projects.tools";

describe("projectTools", () => {
	beforeEach(() => vi.clearAllMocks());

	it("listProjects résume les projets", async () => {
		const out = (await projectTools.listProjects.execute?.(
			{ search: "alpha" },
			{} as never,
		)) as unknown[];
		expect(getProjects).toHaveBeenCalledWith({ search: "alpha" });
		expect(out).toEqual([
			{
				id: 1,
				title: "Alpha",
				status: "Done",
				domains: ["LLM"],
				languages: ["Python"],
			},
		]);
	});

	it("listProjects sans recherche appelle getProjects({})", async () => {
		await projectTools.listProjects.execute?.({}, {} as never);
		expect(getProjects).toHaveBeenCalledWith({});
	});

	it("listProjects plafonne à 50 résultats", async () => {
		getProjects.mockResolvedValueOnce(
			Array.from({ length: 60 }, (_, i) => ({
				id: i + 1,
				title: `P${i + 1}`,
				pitch: null,
				status: null,
				domains: [],
				languages: [],
			})) as never,
		);
		const out = (await projectTools.listProjects.execute?.(
			{},
			{} as never,
		)) as unknown[];
		expect(out).toHaveLength(50);
	});

	it("getProject délègue", async () => {
		await projectTools.getProject.execute?.({ id: 1 }, {} as never);
		expect(getProjectById).toHaveBeenCalledWith(1);
	});

	it("getFilterOptions délègue", async () => {
		const out = await projectTools.getFilterOptions.execute?.({}, {} as never);
		expect(getFilterOptions).toHaveBeenCalledWith();
		expect(out).toEqual({
			languages: ["Python"],
			databases: [],
			backends: [],
			frontends: [],
			devops: [],
		});
	});

	it("analyzeRepo délègue", async () => {
		await projectTools.analyzeRepo.execute?.({ fullName: "a/b" }, {} as never);
		expect(analyzeRepo).toHaveBeenCalledWith("a/b");
	});

	it("proposeProjectDraft renvoie la proposition avec le projet courant sans l'appliquer", async () => {
		const proposal = {
			action: "update",
			projectId: 3,
			summary: "Ajouter le domaine Agents",
			data: { domains: ["Agents"] },
		} as const;
		const out = await projectTools.proposeProjectDraft.execute?.(
			proposal as never,
			{} as never,
		);
		expect(loadAdminProject).toHaveBeenCalledWith(3);
		expect(out).toEqual({ ...proposal, current: null });
	});

	it("proposeProjectDraft renvoie la proposition telle quelle en création", async () => {
		const proposal = {
			action: "create",
			projectId: null,
			summary: "Nouveau projet",
			data: { title: "Alpha" },
		} as const;
		const out = await projectTools.proposeProjectDraft.execute?.(
			proposal as never,
			{} as never,
		);
		expect(loadAdminProject).not.toHaveBeenCalled();
		expect(out).toEqual(proposal);
	});
});
