import { describe, expect, it } from "vitest";
import { jwtCallback, sessionCallback } from "./auth-callbacks";

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
