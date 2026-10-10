import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getToken = vi.fn();
vi.mock("next-auth/jwt", () => ({
	getToken: (...a: unknown[]) => getToken(...a),
}));
vi.mock("next/headers", () => ({
	headers: async () => new Headers({ "x-forwarded-proto": "https" }),
}));

import { getAdminGithubToken } from "./token";

describe("getAdminGithubToken", () => {
	beforeEach(() => {
		getToken.mockReset();
		vi.stubEnv("AUTH_SECRET", "s");
		vi.stubEnv("ADMIN_GITHUB_ID", "42");
		vi.stubEnv("GITHUB_TOKEN", "pat");
	});
	afterEach(() => vi.unstubAllEnvs());

	it("JWT de l'admin -> oauth", async () => {
		getToken.mockResolvedValue({ githubId: "42", githubAccessToken: "gho" });
		expect(await getAdminGithubToken()).toEqual({
			token: "gho",
			mode: "oauth",
		});
	});
	it("JWT d'un autre compte -> public (GITHUB_TOKEN)", async () => {
		getToken.mockResolvedValue({ githubId: "7", githubAccessToken: "gho" });
		expect(await getAdminGithubToken()).toEqual({
			token: "pat",
			mode: "public",
		});
	});
	it("ADMIN_GITHUB_ID absent -> public, jamais undefined===undefined", async () => {
		vi.stubEnv("ADMIN_GITHUB_ID", "");
		getToken.mockResolvedValue({ githubAccessToken: "gho" });
		expect(await getAdminGithubToken()).toEqual({
			token: "pat",
			mode: "public",
		});
	});
	it("pas de JWT -> public", async () => {
		getToken.mockResolvedValue(null);
		expect(await getAdminGithubToken()).toEqual({
			token: "pat",
			mode: "public",
		});
	});
});
