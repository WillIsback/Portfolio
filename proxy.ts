import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { auth } from "@/auth";
import { routing } from "@/i18n/routing";
import { isAdminPath, isAdminSession } from "@/lib/admin-guard";

const intlProxy = createMiddleware(routing);

export default auth((req) => {
	const { pathname } = req.nextUrl;

	// L'admin reste monolingue : aucune locale à résoudre sous /admin.
	if (isAdminPath(pathname)) {
		if (pathname === "/admin/login") return NextResponse.next();

		if (!req.auth?.user) {
			const signInUrl = req.nextUrl.clone();
			signInUrl.pathname = "/admin/login";
			signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
			return NextResponse.redirect(signInUrl);
		}

		// Branche normalement INATTEIGNABLE : `authorizedCallback` renvoie une
		// `Response` exactement dans le même cas (/admin, session non-admin), et une
		// `Response` renvoyée par `authorized` court-circuite le handler dans
		// `handleAuth` (branche `if (authorized instanceof Response)`, avant
		// `else if (userMiddlewareOrRoute)`). Elle ne subsiste que comme filet si les
		// deux garde-fous divergent un jour. Le test correspondant de `proxy.test.ts`
		// ne prouve donc pas un comportement vivant : `vi.mock("@/auth")` y court-
		// circuite `authorizedCallback`. Voir `proxy.seam.test.ts`.
		if (!isAdminSession(req.auth)) {
			return NextResponse.redirect(new URL("/admin/login", req.nextUrl));
		}

		return NextResponse.next();
	}

	return intlProxy(req);
});

export const config = {
	matcher: ["/admin/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
