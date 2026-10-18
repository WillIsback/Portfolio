import type { NextMiddleware } from "next/server";
import createMiddleware from "next-intl/middleware";
import { auth } from "@/auth";
import { routing } from "@/i18n/routing";

const intlProxy = createMiddleware(routing);

// `auth` est typé par plusieurs surcharges : sans annotation explicite, TypeScript
// choisit celle des route handlers App Router au lieu de celle du middleware.
const composed: NextMiddleware = (req) => intlProxy(req);

export default auth(composed);

export const config = {
	matcher: ["/admin/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
