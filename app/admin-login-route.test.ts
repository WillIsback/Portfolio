import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isAdminPath } from "@/lib/admin-guard";

const APP = path.join(process.cwd(), "app");

/**
 * Calcule l'URL servie par un module `page`, en ne modélisant QUE la suppression des
 * groupes de routes — la seule règle qui compte ici, parce que `(admin)` ne fait pas
 * partie de l'URL.
 *
 * Ce n'est PAS un résolveur App Router général : les dossiers `_privés`, les
 * interceptions `(.)`/`(..)(..)` et les slots `@` ne sont pas modélisés. Si l'arbre
 * admin en gagnait un, cette fonction renverrait une URL fausse au lieu d'échouer.
 *
 * `app/(admin)/admin/login/page.tsx` sert donc `/admin/login`, alors que
 * `app/(admin)/login/page.tsx` servirait `/login` — un emplacement qui a effectivement
 * été brièvement utilisé, et qui redirigeait l'admin vers une 404.
 */
function routeIgnoringGroups(file: string): string {
	const segments = path
		.relative(APP, file)
		.split(path.sep)
		// `(admin)` est un groupe de routes : retiré de l'URL.
		.filter((segment) => !segment.startsWith("("))
		// Retire le nom de fichier (`page.tsx`).
		.slice(0, -1);
	return `/${segments.join("/")}`;
}

const LOGIN_PAGE = path.join(APP, "(admin)", "admin", "login", "page.tsx");

describe("route /admin/login", () => {
	it("a son module de page à l'emplacement qui sert cette URL", () => {
		expect(existsSync(LOGIN_PAGE)).toBe(true);
		expect(routeIgnoringGroups(LOGIN_PAGE)).toBe("/admin/login");
	});

	// Documentation de la règle, pas un garde-fou : les deux expectations sont des
	// constantes, donc aucune modification de l'app ne peut les faire échouer.
	it("ne dépend pas du segment de groupe, retiré de l'URL", () => {
		const misplaced = path.join(APP, "(admin)", "login", "page.tsx");
		expect(routeIgnoringGroups(misplaced)).toBe("/login");
		expect(existsSync(misplaced)).toBe(false);
	});

	it("reste dans l'espace admin que isAdminPath garde", () => {
		// `proxy.ts` et `lib/auth-callbacks.ts` envoient l'admin vers `/admin/login`
		// sans jamais tester son existence : c'est donc `isAdminPath` qui décide si
		// la garde s'applique, et le fichier doit rester sous `/admin/`.
		expect(isAdminPath(routeIgnoringGroups(LOGIN_PAGE))).toBe(true);
		expect(isAdminPath("/login")).toBe(false);
	});
});
