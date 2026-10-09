// Callbacks NextAuth isolés pour être testables.
// Le jeton d'accès GitHub reste dans le JWT (cookie chiffré) et n'est jamais
// recopié dans la session renvoyée au navigateur.
import type { JWT } from "next-auth/jwt";

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
