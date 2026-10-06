import { CalendarDays, Clock, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateFr, formatReadingTime } from "@/lib/articles/format";
import type { ArticleMeta as Meta } from "@/lib/articles/loader";

export function ArticleMetaLine({
	article,
}: Readonly<{
	article: Pick<Meta, "date" | "period" | "readingTimeMinutes">;
}>) {
	return (
		<ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
			<li className="flex items-center gap-1.5">
				<CalendarDays aria-hidden="true" className="size-4" />
				<time dateTime={article.date}>{formatDateFr(article.date)}</time>
			</li>
			{article.period ? (
				<li className="flex items-center gap-1.5">
					<History aria-hidden="true" className="size-4" />
					<span>
						<span className="sr-only">Période : </span>
						{article.period}
					</span>
				</li>
			) : null}
			<li className="flex items-center gap-1.5">
				<Clock aria-hidden="true" className="size-4" />
				{formatReadingTime(article.readingTimeMinutes)}
			</li>
		</ul>
	);
}

export function ArticleTags({ tags }: Readonly<{ tags: string[] }>) {
	if (tags.length === 0) return null;
	return (
		<ul className="flex flex-wrap gap-1.5" aria-label="Thèmes">
			{tags.map((tag) => (
				<li key={tag}>
					<Badge variant="secondary">{tag}</Badge>
				</li>
			))}
		</ul>
	);
}
