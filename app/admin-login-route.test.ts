import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isAdminPath } from "@/lib/admin-guard";

const APP = path.join(process.cwd(), "app");

/**
 * Reproduit le calcul d'URL de l'App Router pour un module `page` : le groupe de
 * routes `(admin)` ne fait PAS partie de l'URL. `app/(admin)/admin/login/page.tsx`
 * sert donc `/admin/login`, alors que `app/(admin)/login/page.tsx` servirait
 * `/login` — un emplacement qui a effectivement été brièvement utilisé et qui
 * redirigeait l'admin vers une 404.
 */
function routeFor(file: string): string {
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
		expect(routeFor(LOGIN_PAGE)).toBe("/admin/login");
	});

	it("ne dépend pas du segment de groupe, retiré de l'URL", () => {
		const misplaced = path.join(APP, "(admin)", "login", "page.tsx");
		expect(routeFor(misplaced)).toBe("/login");
		expect(existsSync(misplaced)).toBe(false);
	});

	it("reste dans l'espace admin que isAdminPath garde", () => {
		// `proxy.ts` et `lib/auth-callbacks.ts` envoient l'admin vers `/admin/login`
		// sans jamais tester son existence : c'est donc `isAdminPath` qui décide si
		// la garde s'applique, et le fichier doit rester sous `/admin/`.
		expect(isAdminPath(routeFor(LOGIN_PAGE))).toBe(true);
		expect(isAdminPath("/login")).toBe(false);
	});
});
