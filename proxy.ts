import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { auth } from "@/auth";
import { routing } from "@/i18n/routing";
import { isAdminSession } from "@/lib/admin-guard";

const intlProxy = createMiddleware(routing);

export default auth((req) => {
	const { pathname } = req.nextUrl;

	// L'admin reste monolingue : aucune locale à résoudre sous /admin.
	if (pathname.startsWith("/admin")) {
		if (pathname === "/admin/login") return NextResponse.next();

		if (!req.auth?.user) {
			const signInUrl = req.nextUrl.clone();
			signInUrl.pathname = "/admin/login";
			signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
			return NextResponse.redirect(signInUrl);
		}

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
