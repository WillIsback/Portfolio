import { afterEach, describe, expect, it, vi } from "vitest";
import { isAdminPath, isAdminSession } from "./admin-guard";

const ADMIN_ID = "4242";

describe("isAdminSession", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("accepte une session dont le githubId correspond", () => {
		vi.stubEnv("ADMIN_GITHUB_ID", ADMIN_ID);
		expect(isAdminSession({ user: { githubId: ADMIN_ID } })).toBe(true);
	});

	it("refuse une session sans user", () => {
		vi.stubEnv("ADMIN_GITHUB_ID", ADMIN_ID);
		expect(isAdminSession({})).toBe(false);
	});

	it("refuse une session null ou undefined", () => {
		vi.stubEnv("ADMIN_GITHUB_ID", ADMIN_ID);
		expect(isAdminSession(null)).toBe(false);
		expect(isAdminSession(undefined)).toBe(false);
	});

	it("refuse un githubId qui ne correspond pas", () => {
		vi.stubEnv("ADMIN_GITHUB_ID", ADMIN_ID);
		expect(isAdminSession({ user: { githubId: "9999" } })).toBe(false);
	});

	// `vi.stubEnv(..., "")` définit la variable à la chaîne vide : ce n'est PAS le cas
	// « absent ». Le cas réellement intéressant est `delete`, où la comparaison naïve
	// `undefined === undefined` laisserait passer une session sans githubId.
	it("refuse toute session si ADMIN_GITHUB_ID est absent de l'environnement", () => {
		const previous = process.env.ADMIN_GITHUB_ID;
		delete process.env.ADMIN_GITHUB_ID;
		try {
			expect(isAdminSession({ user: { githubId: ADMIN_ID } })).toBe(false);
			expect(isAdminSession({ user: {} })).toBe(false);
			expect(isAdminSession({})).toBe(false);
		} finally {
			if (previous !== undefined) process.env.ADMIN_GITHUB_ID = previous;
		}
	});

	it("refuse un githubId vide même si ADMIN_GITHUB_ID vaut la chaîne vide", () => {
		vi.stubEnv("ADMIN_GITHUB_ID", "");
		expect(isAdminSession({ user: { githubId: "" } })).toBe(false);
		expect(isAdminSession({ user: { githubId: ADMIN_ID } })).toBe(false);
	});
});

describe("isAdminPath", () => {
	it("reconnait /admin et ses sous-chemins", () => {
		expect(isAdminPath("/admin")).toBe(true);
		expect(isAdminPath("/admin/login")).toBe(true);
		expect(isAdminPath("/admin/dashboard/github")).toBe(true);
	});

	it("ne confond pas un préfixe avec un segment", () => {
		// `startsWith("/admin")` matcherait ces trois chemins, à tort.
		expect(isAdminPath("/adminx")).toBe(false);
		expect(isAdminPath("/admin-panel")).toBe(false);
		expect(isAdminPath("/administrer")).toBe(false);
	});

	it("laisse passer les routes publiques et leurs variantes préfixées", () => {
		expect(isAdminPath("/")).toBe(false);
		expect(isAdminPath("/articles")).toBe(false);
		expect(isAdminPath("/en/articles")).toBe(false);
		expect(isAdminPath("/fr/admin-ish")).toBe(false);
	});
});
