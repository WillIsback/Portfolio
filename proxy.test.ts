import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { config, default as proxyHandler } from "./proxy";

const ADMIN_ID = "4242";

// `auth` de NextAuth est simulé pour contrôler la session injectée sur `req.auth`.
// On teste ici la garde de `proxy.ts`, pas la récupération de session par NextAuth.
const authState = vi.hoisted(() => ({
	session: null as { user?: { githubId?: string } } | null,
}));

vi.mock("@/auth", () => ({
	auth:
		(handler: (req: { auth?: unknown }) => unknown) =>
		(req: { auth?: unknown }) => {
			req.auth = authState.session;
			return handler(req);
		},
}));

// Le contrat de `proxy` est celui d'un middleware Next : `(request, event)` avec un
// retour pouvant valoir `undefined`. Ici chaque branche répond, on le restringit pour
// pouvoir asserter sur la réponse.
const proxy = proxyHandler as unknown as (
	request: NextRequest,
) => Promise<Response>;

const request = (pathname: string, headers: Record<string, string> = {}) =>
	new NextRequest(new URL(`https://willisback.fr${pathname}`), { headers });

const location = (res: Response) => res.headers.get("location");

afterEach(() => {
	authState.session = null;
	vi.unstubAllEnvs();
});

describe("proxy", () => {
	it("couvre les routes admin et les routes publiques, hors api et assets", () => {
		expect(config.matcher).toContain("/admin/:path*");
		expect(config.matcher).toContain("/((?!api|_next|_vercel|.*\\..*).*)");
	});

	it("laisse passer une URL française sans préfixe", async () => {
		const res = await proxy(
			request("/articles", { "accept-language": "fr-FR,fr;q=0.9" }),
		);
		expect(res.status).toBe(200);
	});

	it("préserve le préfixe de locale sur une URL déjà préfixée", async () => {
		const res = await proxy(
			request("/en/articles", { "accept-language": "fr-FR,fr;q=0.9" }),
		);
		expect(res.status).toBe(200);
	});

	// Passe par le callback `authorized` : dès qu'un handler est fourni à `auth()`,
	// NextAuth n'applique plus sa propre redirection (branche `userMiddlewareOrRoute`
	// de node_modules/next-auth/lib/index.js). C'est donc `proxy.ts` qui doit
	// rediriger, sinon `/admin` redeviendrait accessible à tout le monde.
	it("redirige un visiteur non authentifié de /admin vers la page de connexion", async () => {
		vi.stubEnv("ADMIN_GITHUB_ID", ADMIN_ID);
		authState.session = null;

		const res = await proxy(request("/admin"));

		expect(res.status).toBe(307);
		expect(location(res)).toContain("/admin/login");
		// `callbackUrl` distingue cette branche de celle du non-admin : sans session,
		// NextAuth renvoyait vers la connexion en mémorisant la destination.
		expect(location(res)).toContain("callbackUrl=");
	});

	it("renvoie vers /admin/login un compte connecté non-admin qui vise /admin", async () => {
		vi.stubEnv("ADMIN_GITHUB_ID", ADMIN_ID);
		authState.session = { user: { githubId: "9999" } };

		const res = await proxy(request("/admin"));

		expect(res.status).toBe(307);
		expect(location(res)).toContain("/admin/login");
	});

	it("laisse passer l'admin authentifié sur /admin", async () => {
		vi.stubEnv("ADMIN_GITHUB_ID", ADMIN_ID);
		authState.session = { user: { githubId: ADMIN_ID } };

		const res = await proxy(request("/admin"));

		expect(res.status).not.toBe(307);
		expect(location(res) ?? "").not.toContain("/admin/login");
	});

	it("laisse passer la page de connexion elle-même", async () => {
		vi.stubEnv("ADMIN_GITHUB_ID", ADMIN_ID);
		authState.session = null;

		const res = await proxy(request("/admin/login"));

		expect(location(res) ?? "").not.toContain("/admin/login");
	});

	// Régression latente : la garde ne doit jamais déborder hors de /admin, sinon un
	// compte connecté non-admin se fait renvoyer vers /admin/login depuis la page
	// d'accueil.
	it("ne renvoie pas vers /admin/login un compte connecté non-admin sur une route publique", async () => {
		vi.stubEnv("ADMIN_GITHUB_ID", ADMIN_ID);
		authState.session = { user: { githubId: "9999" } };

		const res = await proxy(
			request("/", { "accept-language": "fr-FR,fr;q=0.9" }),
		);

		expect(location(res) ?? "").not.toContain("/admin/login");
		expect(res.status).toBe(200);
	});
});
