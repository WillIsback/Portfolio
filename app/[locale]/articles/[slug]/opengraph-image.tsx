import { notFound } from "next/navigation";
import { ogCard } from "@/components/seo/OgCard";
import { routing } from "@/i18n/routing";
import { listArticleSlugs, readArticle } from "@/lib/articles/loader";
import { OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Article de William Derue";

export const dynamicParams = false;

export function generateStaticParams() {
	return routing.locales.flatMap((locale) =>
		listArticleSlugs(locale).map((slug) => ({ locale, slug })),
	);
}

export default async function Image({
	params,
}: {
	params: Promise<{ locale: string; slug: string }>;
}) {
	const { locale, slug } = await params;
	const { article } = readArticle(slug, locale);
	if (!article) notFound();
	return ogCard({ title: article.title, kicker: "Article" });
}
