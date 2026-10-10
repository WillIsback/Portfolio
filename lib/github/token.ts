// SERVEUR UNIQUEMENT : ne jamais importer depuis un composant client.
// (Le paquet `server-only` n'est pas installé ; un test vérifie l'absence d'import client.)
import { headers } from "next/headers";
import { getToken } from "next-auth/jwt";

export type GithubAuth =
	| { token: string; mode: "oauth" }
	| { token: string | undefined; mode: "public" };

const COOKIE = "authjs.session-token";

/**
 * Lit le jeton OAuth GitHub de l'admin dans le JWT chiffré (jamais dans la session).
 * @auth/core : le nom du cookie vaut `__Secure-authjs.session-token` si `secureCookie`,
 * sinon `authjs.session-token`, et sert aussi de `salt` : les deux doivent donc
 * correspondre à ce qu'Auth.js a écrit (HTTPS => préfixe `__Secure-`).
 */
export async function getAdminGithubToken(): Promise<GithubAuth> {
	const h = await headers();
	const secret = process.env.AUTH_SECRET;
	const adminId = process.env.ADMIN_GITHUB_ID;
	const https =
		h.get("x-forwarded-proto")?.split(",")[0].trim() === "https" ||
		process.env.AUTH_URL?.startsWith("https://") === true;
	if (secret && adminId) {
		// Essaie d'abord la variante attendue, puis l'autre (proxy mal déclaré).
		for (const secureCookie of [https, !https]) {
			const jwt = await getToken({
				req: { headers: h },
				secret,
				secureCookie,
				salt: secureCookie ? `__Secure-${COOKIE}` : COOKIE,
			});
			const t = jwt?.githubAccessToken;
			// Le jeton n'est utilisé que si le JWT appartient à l'admin.
			if (typeof t === "string" && t && jwt?.githubId === adminId)
				return { token: t, mode: "oauth" };
		}
	}
	return { token: process.env.GITHUB_TOKEN || undefined, mode: "public" };
}
