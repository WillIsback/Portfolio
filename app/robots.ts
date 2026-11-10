import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/** `/robots.txt` : tout est indexable sauf l'admin et l'API, et le sitemap est annoncé. */
export default function robots(): MetadataRoute.Robots {
	return {
		rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
		sitemap: `${SITE_URL}/sitemap.xml`,
		host: SITE_URL,
	};
}
