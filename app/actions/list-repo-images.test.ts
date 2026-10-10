import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
	auth: vi.fn(),
	findUnique: vi.fn(),
	bundle: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: h.auth }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/db", () => ({
	default: { project: { findUnique: h.findUnique } },
}));
vi.mock("@/lib/github/token", () => ({
	getAdminGithubToken: async () => ({ token: "t", mode: "oauth" }),
}));
vi.mock("@/lib/github/client", async (orig) => ({
	...(await orig<typeof import("@/lib/github/client")>()),
	getRepoBundle: h.bundle,
}));

import { listRepoImages } from "./admin.action";

const admin = () => h.auth.mockResolvedValue({ user: { githubId: "1" } });

beforeEach(() => {
	vi.clearAllMocks();
	process.env.ADMIN_GITHUB_ID = "1";
});

describe("listRepoImages", () => {
	it("rejette un non-admin sans toucher la base", async () => {
		h.auth.mockResolvedValue({ user: { githubId: "2" } });
		await expect(listRepoImages(1)).rejects.toThrow("Unauthorized");
		expect(h.findUnique).not.toHaveBeenCalled();
	});

	it("projet privé en base : [] + motif, sans appel GitHub", async () => {
		admin();
		h.findUnique.mockResolvedValue({
			github: "https://github.com/me/app",
			isPrivate: true,
		});
		const r = await listRepoImages(1);
		expect(r).toEqual({
			ok: false,
			images: [],
			reason: "Capture impossible pour un dépôt privé.",
		});
		expect(h.bundle).not.toHaveBeenCalled();
	});

	it("dépôt privé côté GitHub : []", async () => {
		admin();
		h.findUnique.mockResolvedValue({
			github: "https://github.com/me/app",
			isPrivate: false,
		});
		h.bundle.mockResolvedValue({
			meta: { private: true, full_name: "me/app", default_branch: "main" },
			images: ["a.png"],
		});
		const r = await listRepoImages(1);
		expect(r.ok).toBe(false);
		expect(r.images).toEqual([]);
	});

	it("encode chaque segment de la branche et du chemin", async () => {
		admin();
		h.findUnique.mockResolvedValue({
			github: "https://github.com/me/app",
			isPrivate: false,
		});
		h.bundle.mockResolvedValue({
			meta: {
				private: false,
				full_name: "me/app",
				default_branch: "feature/x",
			},
			images: ["docs/mes images/a b.png"],
		});
		const r = await listRepoImages(1);
		expect(r).toEqual({
			ok: true,
			images: [
				"https://raw.githubusercontent.com/me/app/feature/x/docs/mes%20images/a%20b.png",
			],
		});
	});
});
