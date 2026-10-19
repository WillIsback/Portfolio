import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import LatestEntries from "@/components/home/LatestEntries";
import { routing } from "@/i18n/routing";
import {
	articlesDir,
	getAllArticles,
	readArticle,
} from "@/lib/articles/loader";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "articles" });
	return pageMetadata(locale, "/articles", {
		title: t("title"),
		description: t("description"),
	});
}

export default async function ArticlesPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	// Redondant avec `articles/layout.tsx`, volontaire : voir
	// `app/[locale]/static-rendering.test.ts`. Chaque module se protège lui-même.
	setRequestLocale(locale);

	const t = await getTranslations("articles");
	const articles = getAllArticles(articlesDir(locale));
	const fallbackSlugs = articles
		.filter((article) => readArticle(article.slug, locale).fallback)
		.map((article) => article.slug);

	return (
		<div className="mx-auto w-full max-w-3xl">
			<header className="mb-10 space-y-3">
				<p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
					{t("eyebrow")}
				</p>
				<h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
					{t("title")}
				</h1>
				<p className="max-w-2xl text-lg text-muted-foreground">
					{t("description")}
				</p>
			</header>

			{articles.length === 0 ? (
				<p className="text-muted-foreground">{t("empty")}</p>
			) : (
				<LatestEntries
					articles={articles}
					fallbackSlugs={fallbackSlugs}
					showAllLink={false}
					headingLevel={2}
				/>
			)}
		</div>
	);
}
