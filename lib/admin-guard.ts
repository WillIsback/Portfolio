export interface AdminSessionUser {
	githubId?: string;
}

/**
 * Vrai si le chemin appartient à l'espace admin.
 *
 * Comparaison par segment : `startsWith("/admin")` matcherait aussi `/adminx` ou
 * `/admin-panel`, des chemins que le matcher `"/admin/:path*"` n'intercepte pas.
 */
export function isAdminPath(pathname: string): boolean {
	return pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * Vrai si la session correspond au compte propriétaire du portfolio.
 *
 * Source de vérité partagée entre le callback `authorized` de `auth.ts` et `proxy.ts`.
 * Elle est nécessaire dans les deux fichiers parce que NextAuth s'évalue AVANT le
 * handler du proxy : dans `handleAuth` (`node_modules/next-auth/lib/index.js`),
 * `callbacks.authorized` est appelé d'abord, et son verdict est traité ainsi —
 *   - une `Response` renvoyée par `authorized` est renvoyée telle quelle et le
 *     handler du proxy n'est JAMAIS appelé (branche `if (authorized instanceof
 *     Response)`, qui précède `else if (userMiddlewareOrRoute)`) ;
 *   - un résultat booléen `false` est ignoré dès qu'un handler est fourni à
 *     `auth()` : la branche `else if (userMiddlewareOrRoute)` passe avant
 *     `else if (!authorized)`.
 * Autrement dit, un booléen ne protège rien ici ; seule une `Response` agit. C'est
 * pourquoi `proxy.ts` refait la vérification pour les cas qu'`authorized` laisse
 * passer.
 */
export function isAdminSession(
	session: { user?: AdminSessionUser } | null | undefined,
): boolean {
	return Boolean(
		session?.user?.githubId &&
			session.user.githubId === process.env.ADMIN_GITHUB_ID,
	);
}
