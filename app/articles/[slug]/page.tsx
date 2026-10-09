import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { ArticleTags } from "@/components/articles/ArticleMeta";
import { mdxComponents } from "@/components/articles/mdx";
import { numberFigures } from "@/lib/articles/figures";
import { formatDateFr, formatReadingTime } from "@/lib/articles/format";
import { getArticleBySlug, getArticleSlugs } from "@/lib/articles/loader";

const SITE_URL = "https://www.willisback.fr";

export const dynamicParams = false;

interface ArticlePageProps {
	params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
	return getArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
	params,
}: ArticlePageProps): Promise<Metadata> {
	const { slug } = await params;
	const article = getArticleBySlug(slug);
	if (!article) return {};
	const url = `${SITE_URL}/articles/${article.slug}`;
	return {
		title: `${article.title} | William Derue`,
		description: article.description,
		keywords: article.tags,
		alternates: { canonical: url },
		openGraph: {
			type: "article",
			locale: "fr_FR",
			url,
			title: article.title,
			description: article.description,
			siteName: "Portfolio WillisBack",
			publishedTime: article.date,
			authors: ["William Derue"],
			tags: article.tags,
		},
		twitter: {
			card: "summary_large_image",
			title: article.title,
			description: article.description,
		},
	};
}

export default async function ArticlePage({ params }: ArticlePageProps) {
	const { slug } = await params;
	const article = getArticleBySlug(slug);
	if (!article) notFound();

	const { source } = numberFigures(article.content);

	const { content } = await compileMDX({
		source,
		components: mdxComponents,
		options: {
			// Component props are JS expressions (arrays/objects): keep them,
			// but still strip dangerous code (eval, require, process...).
			blockJS: false,
			blockDangerousJS: true,
			mdxOptions: { remarkPlugins: [remarkGfm] },
		},
	});

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: article.title,
		description: article.description,
		datePublished: article.date,
		inLanguage: "fr-FR",
		keywords: article.tags.join(", "),
		author: { "@type": "Person", name: "William Derue", url: SITE_URL },
		mainEntityOfPage: `${SITE_URL}/articles/${article.slug}`,
	};

	return (
		<article className="mx-auto w-full max-w-[44rem]">
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from our own frontmatter
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>
			<nav className="mb-8">
				<Link
					href="/articles"
					className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
				>
					<ArrowLeft aria-hidden="true" className="size-4" />
					Tous les articles
				</Link>
			</nav>

			<header className="mb-10 space-y-5 border-b border-border pb-8">
				{article.status ? (
					<p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
						{article.status}
					</p>
				) : null}
				<h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
					{article.title}
				</h1>
				<p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
					{article.description}
				</p>
				<p className="font-mono text-xs text-ink-soft">
					<time dateTime={article.date}>{formatDateFr(article.date)}</time>
					{article.period ? (
						<>
							{" · "}
							<span className="sr-only">Période : </span>
							{article.period}
						</>
					) : null}
					{` · ${formatReadingTime(article.readingTimeMinutes)}`}
				</p>
				<ArticleTags tags={article.tags} />
			</header>

			<div className="article-prose">{content}</div>

			<footer className="mt-14 border-t border-border pt-6">
				<Link
					href="/articles"
					className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
				>
					<ArrowLeft aria-hidden="true" className="size-4" />
					Retour aux articles
				</Link>
			</footer>
		</article>
	);
}
