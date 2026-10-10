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

const start = vi.hoisted(() => vi.fn(async () => ({ runId: "run_1" })));
const getRun = vi.hoisted(() => vi.fn());
const articleWorkflow = vi.hoisted(() => vi.fn());
const createArticlePr = vi.hoisted(() =>
	vi.fn(async () => ({ ok: true, url: "https://github.com/x/pr/1" })),
);
vi.mock("workflow/api", () => ({ start, getRun }));
vi.mock("@/lib/agents/github-pr", () => ({ createArticlePr }));
vi.mock("@/app/workflows/article.workflow", () => ({ articleWorkflow }));

import {
	applyProjectProposal,
	getArticleRun,
	openArticlePr,
	startArticleWorkflow,
} from "./agents.action";

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

describe("agent articles", () => {
	it("startArticleWorkflow exige l'admin et renvoie le runId", async () => {
		const r = await startArticleWorkflow({
			slug: "a",
			title: "A",
			description: "d",
			tags: [],
			notes: "n",
		});
		expect(r).toEqual({ ok: true, runId: "run_1" });
		expect(start).toHaveBeenCalledWith(articleWorkflow, [
			{ slug: "a", title: "A", description: "d", tags: [], notes: "n" },
		]);
	});

	it("startArticleWorkflow refuse un non-admin", async () => {
		auth.mockResolvedValueOnce({ user: { githubId: "999" } } as never);
		const r = await startArticleWorkflow({
			slug: "a",
			title: "A",
			description: "d",
			tags: [],
			notes: "n",
		});
		expect(r).toEqual({ ok: false, error: "Non autorisé." });
		expect(start).not.toHaveBeenCalled();
	});

	it("openArticlePr refuse un non-admin", async () => {
		auth.mockResolvedValueOnce({ user: { githubId: "999" } } as never);
		const r = await openArticlePr({
			slug: "a",
			mdx: "x",
			title: "A",
			body: "b",
		});
		expect(r.ok).toBe(false);
		expect(createArticlePr).not.toHaveBeenCalled();
	});

	it("openArticlePr ouvre une PR", async () => {
		process.env.GITHUB_TOKEN = "ghs_test";
		const r = await openArticlePr({
			slug: "a",
			mdx: "x",
			title: "A",
			body: "b",
		});
		expect(r).toEqual({ ok: true, url: "https://github.com/x/pr/1" });
		expect(createArticlePr).toHaveBeenCalledWith(
			expect.objectContaining({ slug: "a", branch: "agent/article-a" }),
			expect.objectContaining({
				repo: "WillIsback/portfolio",
				baseBranch: "main",
				token: "ghs_test",
			}),
		);
	});

	it("getArticleRun renvoie le brouillon quand terminé", async () => {
		getRun.mockReturnValueOnce({
			status: Promise.resolve("completed"),
			returnValue: Promise.resolve({ slug: "a" }),
		} as never);
		const r = await getArticleRun("run_1");
		expect(r).toEqual({ ok: true, status: "completed", draft: { slug: "a" } });
	});

	it("getArticleRun renvoie le statut en cours", async () => {
		getRun.mockReturnValueOnce({ status: Promise.resolve("running") } as never);
		const r = await getArticleRun("run_1");
		expect(r).toEqual({ ok: true, status: "running", draft: null });
	});

	it("getArticleRun signale un échec", async () => {
		getRun.mockReturnValueOnce({ status: Promise.resolve("failed") } as never);
		const r = await getArticleRun("run_1");
		expect(r).toEqual({ ok: false, error: "Génération échouée." });
	});

	it("getArticleRun refuse un non-admin", async () => {
		auth.mockResolvedValueOnce({ user: { githubId: "999" } } as never);
		const r = await getArticleRun("run_1");
		expect(r).toEqual({ ok: false, error: "Non autorisé." });
		expect(getRun).not.toHaveBeenCalled();
	});

	it("getArticleRun renvoie une erreur si le run est introuvable", async () => {
		getRun.mockImplementationOnce(() => {
			throw new Error("not found");
		});
		const r = await getArticleRun("run_x");
		expect(r).toEqual({ ok: false, error: "Run introuvable." });
	});

	it("getArticleRun signale une annulation", async () => {
		getRun.mockReturnValueOnce({
			status: Promise.resolve("cancelled"),
		} as never);
		const r = await getArticleRun("run_1");
		expect(r).toEqual({ ok: false, error: "Génération annulée." });
	});
});
