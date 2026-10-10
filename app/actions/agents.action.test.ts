import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
	auth: vi.fn(async () => ({ user: { githubId: "1" } })),
	createProject: vi.fn(async () => {}),
	updateProject: vi.fn(async () => {}),
	deleteProject: vi.fn(async () => {}),
	loadAdminProject: vi.fn(async () => ({
		title: "Alpha",
		description: "Desc.",
		isPrivate: false,
		isAiGenerated: false,
		languages: [],
		databases: [],
		backends: [],
		frontends: [],
		devops: [],
		domains: [],
		mlStack: [],
		practices: [],
		training: null,
	})),
}));

vi.mock("@/auth", () => ({ auth: h.auth }));
vi.mock("@/app/actions/admin.action", () => ({
	createProject: h.createProject,
	updateProject: h.updateProject,
	deleteProject: h.deleteProject,
}));
vi.mock("@/lib/admin/load-project", () => ({
	loadAdminProject: h.loadAdminProject,
}));

import { applyProjectProposal } from "./agents.action";

const { auth, createProject, updateProject, deleteProject } = h;

beforeEach(() => {
	vi.clearAllMocks();
	process.env.ADMIN_GITHUB_ID = "1";
});

describe("applyProjectProposal", () => {
	it("refuse un non-admin", async () => {
		auth.mockResolvedValueOnce({ user: { githubId: "999" } } as never);
		const r = await applyProjectProposal({
			action: "delete",
			projectId: 1,
			summary: "s",
		});
		expect(r).toEqual({ ok: false, error: "Non autorisé." });
		expect(deleteProject).not.toHaveBeenCalled();
	});

	it("refuse si ADMIN_GITHUB_ID n'est pas configuré", async () => {
		const prev = process.env.ADMIN_GITHUB_ID;
		delete process.env.ADMIN_GITHUB_ID;
		try {
			const r = await applyProjectProposal({
				action: "delete",
				projectId: 1,
				summary: "s",
			});
			expect(r).toEqual({ ok: false, error: "Non autorisé." });
			expect(deleteProject).not.toHaveBeenCalled();
		} finally {
			process.env.ADMIN_GITHUB_ID = prev;
		}
	});

	it("applique une suppression", async () => {
		const r = await applyProjectProposal({
			action: "delete",
			projectId: 1,
			summary: "s",
		});
		expect(r).toEqual({ ok: true });
		expect(deleteProject).toHaveBeenCalledWith(1);
	});

	it("applique une mise à jour fusionnée", async () => {
		const r = await applyProjectProposal({
			action: "update",
			projectId: 3,
			summary: "s",
			data: { domains: ["Agents"] },
		});
		expect(r).toEqual({ ok: true });
		expect(updateProject).toHaveBeenCalledWith(
			3,
			expect.objectContaining({ title: "Alpha", domains: ["Agents"] }),
		);
	});

	it("applique une création", async () => {
		const r = await applyProjectProposal({
			action: "create",
			projectId: null,
			summary: "s",
			data: { title: "Nouveau", description: "Une description." },
		});
		expect(r).toEqual({ ok: true });
		expect(createProject).toHaveBeenCalled();
	});

	it("refuse des données invalides", async () => {
		const r = await applyProjectProposal({
			action: "create",
			projectId: null,
			summary: "s",
		});
		expect(r.ok).toBe(false);
		expect(createProject).not.toHaveBeenCalled();
	});
});
