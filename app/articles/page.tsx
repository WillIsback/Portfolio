import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
	ArticleMetaLine,
	ArticleTags,
} from "@/components/articles/ArticleMeta";
import { getAllArticles } from "@/lib/articles/loader";

const title =
	"Articles | William Derue - Développeur IA · parcours AI Engineer";
const description =
	"Retours d'expérience chiffrés sur les agents autonomes, les LLM servis en local, l'observabilité et l'infrastructure.";

export const metadata: Metadata = {
	title,
	description,
	alternates: { canonical: "https://www.willisback.fr/articles" },
	openGraph: {
		type: "website",
		locale: "fr_FR",
		url: "https://www.willisback.fr/articles",
		title: "Articles | William Derue",
		description,
		siteName: "Portfolio WillisBack",
	},
	twitter: { card: "summary", title: "Articles | William Derue", description },
};

export default function ArticlesPage() {
	const articles = getAllArticles();

	return (
		<div className="mx-auto w-full max-w-3xl">
			<header className="mb-10 space-y-3">
				<p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
					Journal de bord
				</p>
				<h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
					Articles
				</h1>
				<p className="max-w-2xl text-lg text-muted-foreground">{description}</p>
			</header>

			{articles.length === 0 ? (
				<p className="text-muted-foreground">Aucun article pour le moment.</p>
			) : (
				<ol className="space-y-5">
					{articles.map((article) => (
						<li key={article.slug}>
							<article className="group relative rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-[0_12px_60px_-25px_rgba(59,130,246,0.45)] sm:p-7">
								<div className="space-y-3">
									<ArticleMetaLine article={article} />
									<h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
										<Link
											href={`/articles/${article.slug}`}
											className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none group-focus-within:text-primary group-hover:text-primary"
										>
											{article.title}
										</Link>
									</h2>
									<p className="leading-relaxed text-muted-foreground">
										{article.description}
									</p>
									<div className="flex flex-wrap items-center justify-between gap-3 pt-1">
										<ArticleTags tags={article.tags} />
										<span
											aria-hidden="true"
											className="flex items-center gap-1 text-sm font-medium text-primary"
										>
											Lire
											<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
										</span>
									</div>
								</div>
							</article>
						</li>
					))}
				</ol>
			)}
		</div>
	);
}
