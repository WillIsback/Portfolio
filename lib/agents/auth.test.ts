import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => vi.fn(async () => ({ user: { githubId: "1" } })));
vi.mock("@/auth", () => ({ auth }));

import { requireAdmin } from "./auth";

beforeEach(() => {
	vi.clearAllMocks();
	process.env.ADMIN_GITHUB_ID = "1";
});

describe("requireAdmin", () => {
	it("vrai pour l'admin", async () => {
		expect(await requireAdmin()).toBe(true);
	});
	it("faux pour un autre utilisateur", async () => {
		auth.mockResolvedValueOnce({ user: { githubId: "999" } } as never);
		expect(await requireAdmin()).toBe(false);
	});
	it("faux sans session", async () => {
		auth.mockResolvedValueOnce(null as never);
		expect(await requireAdmin()).toBe(false);
	});
	it("faux si ADMIN_GITHUB_ID absent", async () => {
		delete process.env.ADMIN_GITHUB_ID;
		expect(await requireAdmin()).toBe(false);
	});
});
