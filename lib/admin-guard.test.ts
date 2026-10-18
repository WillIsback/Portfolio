import { afterEach, describe, expect, it, vi } from "vitest";
import { isAdminSession } from "./admin-guard";

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

	// Cas réel : si ADMIN_GITHUB_ID est absent de l'environnement, une comparaison
	// naïve `undefined === undefined` laisserait passer une session sans githubId.
	it("refuse un githubId vide même si ADMIN_GITHUB_ID est absent", () => {
		vi.stubEnv("ADMIN_GITHUB_ID", "");
		expect(isAdminSession({ user: { githubId: "" } })).toBe(false);
	});

	it("refuse toute session si ADMIN_GITHUB_ID est absent", () => {
		vi.stubEnv("ADMIN_GITHUB_ID", "");
		expect(isAdminSession({ user: { githubId: ADMIN_ID } })).toBe(false);
	});
});
