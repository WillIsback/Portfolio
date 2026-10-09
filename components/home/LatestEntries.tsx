import Link from "next/link";
import { formatDateFr, formatReadingTime } from "@/lib/articles/format";
import type { ArticleMeta } from "@/lib/articles/loader";

/** Dernières entrées du carnet (spec §6.3). */
export default function LatestEntries({
	articles,
}: Readonly<{ articles: ArticleMeta[] }>) {
	if (articles.length === 0) return null;
	return (
		<div>
			<ol className="divide-y divide-border/70 border-y border-border/70">
				{articles.map((article) => (
					<li
						key={article.slug}
						className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6"
					>
						<time
							dateTime={article.date}
							className="font-mono text-xs text-ink-soft sm:pt-1.5"
						>
							{formatDateFr(article.date)}
						</time>
						<div>
							<h3 className="font-display text-lg font-semibold">
								<Link
									href={`/articles/${article.slug}`}
									className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									{article.title}
								</Link>
							</h3>
							<p className="mt-1 line-clamp-2 text-base leading-relaxed">
								{article.description}
							</p>
							<p className="mt-2 font-mono text-[11px] text-ink-soft">
								{formatReadingTime(article.readingTimeMinutes)}
								{article.tags.length > 0
									? ` · ${article.tags.join(" · ")}`
									: ""}
							</p>
						</div>
					</li>
				))}
			</ol>
			<Link
				href="/articles"
				className="mt-4 inline-block rounded-sm font-mono text-xs text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				Toutes les entrées →
			</Link>
		</div>
	);
}
