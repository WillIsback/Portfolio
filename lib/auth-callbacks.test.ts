import { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	authorizedCallback,
	jwtCallback,
	sessionCallback,
	signInCallback,
} from "./auth-callbacks";

describe("callbacks NextAuth", () => {
	it("garde le jeton GitHub dans le JWT", () => {
		const token = jwtCallback({
			token: {},
			account: { access_token: "gho_secret" },
			profile: { id: 42 },
		});
		expect(token.githubAccessToken).toBe("gho_secret");
		expect(token.githubId).toBe("42");
	});

	it("conserve le jeton aux appels suivants (sans account)", () => {
		const token = jwtCallback({ token: { githubAccessToken: "x" } });
		expect(token.githubAccessToken).toBe("x");
	});

	it("n'expose pas le jeton dans la session", () => {
		const session = sessionCallback({
			session: { user: { name: "w" } },
			token: { githubId: "42", githubAccessToken: "gho_secret" },
		});
		expect(JSON.stringify(session)).not.toContain("gho_secret");
		expect(session.user).toEqual({ name: "w", githubId: "42" });
	});
});

describe("signIn", () => {
	afterEach(() => vi.unstubAllEnvs());
	it("admin -> true, autre -> false, sans profil -> false", () => {
		vi.stubEnv("ADMIN_GITHUB_ID", "42");
		expect(signInCallback({ profile: { id: 42 } })).toBe(true);
		expect(signInCallback({ profile: { id: 43 } })).toBe(false);
		expect(signInCallback({ profile: undefined })).toBe(false);
		expect(signInCallback({ profile: null })).toBe(false);
	});
	it("ADMIN_GITHUB_ID absent -> false", () => {
		vi.stubEnv("ADMIN_GITHUB_ID", "");
		expect(signInCallback({ profile: { id: "" } })).toBe(false);
	});
});

describe("authorized", () => {
	const ADMIN = "42";

	const asSession = (githubId: string): Session => ({
		user: { githubId },
		expires: "2100-01-01",
	});

	const call = (pathname: string, session: Session | null) =>
		authorizedCallback({
			auth: session,
			request: new NextRequest(`https://willisback.fr${pathname}`),
		});

	afterEach(() => vi.unstubAllEnvs());

	// NextAuth honore un `Response` renvoyé ici AVANT d'appeler le handler du proxy
	// (node_modules/next-auth/lib/index.js:150 précède :163). Un callback non
	// restreint redirigerait donc tout le site public, pas seulement /admin.
	it("laisse passer un compte non-admin sur une page publique", () => {
		vi.stubEnv("ADMIN_GITHUB_ID", ADMIN);
		expect(call("/", asSession("99"))).toBe(true);
		expect(call("/articles", asSession("99"))).toBe(true);
		expect(call("/", null)).toBe(true);
	});

	it("laisse passer la page de connexion", () => {
		vi.stubEnv("ADMIN_GITHUB_ID", ADMIN);
		expect(call("/admin/login", null)).toBe(true);
		expect(call("/admin/login", asSession("99"))).toBe(true);
	});

	it("refuse /admin sans session", () => {
		vi.stubEnv("ADMIN_GITHUB_ID", ADMIN);
		expect(call("/admin", null)).toBe(false);
		expect(call("/admin/dashboard", null)).toBe(false);
	});

	it("renvoie un compte non-admin de /admin vers la connexion", () => {
		vi.stubEnv("ADMIN_GITHUB_ID", ADMIN);
		const res = call("/admin", asSession("99"));
		expect(res).toBeInstanceOf(Response);
		expect((res as Response).headers.get("location")).toContain("/admin/login");
	});

	it("laisse passer l'admin sur /admin", () => {
		vi.stubEnv("ADMIN_GITHUB_ID", ADMIN);
		expect(call("/admin", asSession(ADMIN))).toBe(true);
		expect(call("/admin/dashboard", asSession(ADMIN))).toBe(true);
	});
});
