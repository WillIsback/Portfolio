import { getTranslations, setRequestLocale } from "next-intl/server";
import LatestEntries from "@/components/home/LatestEntries";
import { getAllArticles } from "@/lib/articles/loader";

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
	const articles = getAllArticles();

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
					showAllLink={false}
					headingLevel={2}
				/>
			)}
		</div>
	);
}
