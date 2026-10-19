// Callbacks NextAuth isolés pour être testables.
// Le jeton d'accès GitHub reste dans le JWT (cookie chiffré) et n'est jamais
// recopié dans la session renvoyée au navigateur.
import type { NextAuthRequest, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { isAdminPath, isAdminSession } from "@/lib/admin-guard";

type SessionUser = { githubId: string };

export function jwtCallback({
	token,
	account,
	profile,
}: {
	token: JWT;
	account?: { access_token?: string | null } | null;
	profile?: { id?: string | number | null } | null;
}): JWT {
	if (profile?.id) token.githubId = String(profile.id);
	if (account?.access_token) token.githubAccessToken = account.access_token;
	return token;
}

export function sessionCallback<S extends { user?: unknown }>({
	session,
	token,
}: {
	session: S;
	token: JWT;
}): S {
	(session.user as SessionUser).githubId = (token.githubId as string) ?? "";
	return session;
}

/** Seul l'admin peut ouvrir une session : aucun autre compte n'obtient de JWT. */
export function signInCallback({
	profile,
}: {
	profile?: { id?: string | number | null } | null;
}): boolean {
	const admin = process.env.ADMIN_GITHUB_ID;
	return !!admin && !!profile?.id && String(profile.id) === admin;
}

export function authorizedCallback({
	auth: session,
	request: { nextUrl },
}: {
	auth: Session | null;
	request: Pick<NextAuthRequest, "nextUrl">;
}): boolean | Response {
	// Hors /admin, ce callback ne décide de rien : un compte connecté non-admin ne doit
	// jamais être renvoyé vers /admin/login depuis une page publique. NextAuth honore
	// une `Response` renvoyée ici AVANT d'appeler le handler du proxy (dans
	// `handleAuth`, la branche `if (authorized instanceof Response)` précède la
	// branche `else if (userMiddlewareOrRoute)`), donc un callback non restreint
	// redirigerait tout le site public. Voir la couture dans `proxy.seam.test.ts`.
	if (!isAdminPath(nextUrl.pathname)) return true;

	// La page de connexion doit rester atteignable, sinon on redirige vers elle-même.
	if (nextUrl.pathname === "/admin/login") return true;

	if (!session?.user) return false;

	if (!isAdminSession(session))
		return Response.redirect(new URL("/admin/login", nextUrl));

	return true;
}
