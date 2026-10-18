import type { NextFetchEvent } from "next/server";
import { NextRequest } from "next/server";
import { encode } from "next-auth/jwt";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Ce fichier exerce le VRAI `auth` de `@/auth`, sans aucun mock : c'est le seul
// endroit où l'ordre interne de `handleAuth` est vérifié plutôt que supposé.
//
// `handleAuth` (node_modules/next-auth/lib/index.js) fait, dans cet ordre :
//   1. évalue `callbacks.authorized` avec la session décodée du cookie ;
//   2. `if (authorized instanceof Response)` -> renvoie cette réponse SANS appeler
//      le handler de `proxy.ts` ;
//   3. `else if (userMiddlewareOrRoute)` -> appelle le handler, qui reçoit
//      `req.auth`.
// Donc une réponse renvoyée par `authorizedCallback` court-circuite complètement
// `proxy.ts`. Le test ci-dessous verrouille cette couture.
const SECRET = "0123456789012345678901234567890123456789";
const ADMIN_ID = "4242";
// Over https, Auth.js préfixe le cookie de session (`defaultCookies`, cookie.js:45).
const COOKIE_NAME = "__Secure-authjs.session-token";

type ComposedProxy = (
	request: NextRequest,
	event: NextFetchEvent,
) => Promise<Response>;

const envBackup = {
	AUTH_SECRET: process.env.AUTH_SECRET,
	ADMIN_GITHUB_ID: process.env.ADMIN_GITHUB_ID,
};

let proxy: ComposedProxy;

/** Joue le rôle d'un compte connecté qui n'est pas l'admin du portfolio. */
async function strangerCookie(): Promise<string> {
	const jwt = await encode({
		token: { sub: "99", githubId: "9999", name: "Stranger" },
		secret: SECRET,
		salt: COOKIE_NAME,
	});
	return `${COOKIE_NAME}=${jwt}`;
}

async function call(pathname: string, cookie?: string) {
	const request = new NextRequest(new URL(`https://willisback.fr${pathname}`), {
		headers: {
			"accept-language": "fr-FR,fr;q=0.9",
			...(cookie ? { cookie } : {}),
		},
	});
	const response = await proxy(request, {} as NextFetchEvent);
	return {
		status: response.status,
		location: response.headers.get("location"),
	};
}

beforeAll(async () => {
	process.env.AUTH_SECRET = SECRET;
	process.env.ADMIN_GITHUB_ID = ADMIN_ID;
	// Import dynamique : `AUTH_SECRET` doit être posé avant que `@/auth` ne lise
	// l'environnement.
	const imported = await import("./proxy");
	// Cast de TYPE uniquement, pas de comportement : `auth` est typé par plusieurs
	// surcharges et TypeScript retient celle des route handlers App Router. L'objet
	// appelé reste bien le vrai proxy, avec le vrai `authorizedCallback` derrière.
	proxy = imported.default as unknown as ComposedProxy;
});

afterAll(() => {
	for (const [key, value] of Object.entries(envBackup)) {
		if (value === undefined) delete process.env[key];
		else process.env[key] = value;
	}
});

describe("couture handleAuth / proxy", () => {
	it("reconnaît réellement la session forgée", async () => {
		// Précondition des deux tests suivants : sans session décodée, « pas de
		// redirection sur / » ne prouverait rien du tout.
		const res = await call("/admin", await strangerCookie());
		expect(res.location).toContain("/admin/login");
		expect(res.location).not.toContain("callbackUrl=");
	});

	it("ne renvoie pas un non-admin vers /admin/login depuis une page publique", async () => {
		const cookie = await strangerCookie();
		for (const pathname of ["/", "/articles"]) {
			const res = await call(pathname, cookie);
			expect(res.location ?? "").not.toContain("/admin/login");
		}
	});

	it("laisse passer un visiteur anonyme sur une page publique", async () => {
		const res = await call("/");
		expect(res.status).toBe(200);
		expect(res.location).toBeNull();
	});
});
