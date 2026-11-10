import type { MetadataRoute } from "next";
import { type Locale, routing } from "@/i18n/routing";
import { listArticleSlugs, readArticle } from "@/lib/articles/loader";
import { buildSitemap, type SitemapArticle } from "@/lib/sitemap";

/** Articles réellement écrits dans une locale (les replis français sont écartés). */
function translatedArticles(locale: Locale): SitemapArticle[] {
	return listArticleSlugs(locale).flatMap((slug) => {
		const { article, fallback } = readArticle(slug, locale);
		return article && !fallback ? [{ slug, date: article.date }] : [];
	});
}

export default function sitemap(): MetadataRoute.Sitemap {
	return buildSitemap({
		articles: Object.fromEntries(
			routing.locales.map((locale) => [locale, translatedArticles(locale)]),
		) as Record<Locale, SitemapArticle[]>,
	});
}
