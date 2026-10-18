export interface AdminSessionUser {
	githubId?: string;
}

/**
 * Vrai si la session correspond au compte propriétaire du portfolio.
 *
 * Source de vérité partagée entre le callback `authorized` de `auth.ts` et `proxy.ts` :
 * dès qu'un gestionnaire est passé à `auth()`, NextAuth n'évalue plus `authorized`
 * (voir la branche `userMiddlewareOrRoute` de `node_modules/next-auth/lib/index.js`),
 * donc `proxy.ts` doit refaire la vérification lui-même.
 */
export function isAdminSession(
	session: { user?: AdminSessionUser } | null | undefined,
): boolean {
	return Boolean(
		session?.user?.githubId &&
			session.user.githubId === process.env.ADMIN_GITHUB_ID,
	);
}
