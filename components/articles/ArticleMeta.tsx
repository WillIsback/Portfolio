import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

export function ArticleTags({ tags }: Readonly<{ tags: string[] }>) {
	const t = useTranslations("articles");
	if (tags.length === 0) return null;
	return (
		<ul className="flex flex-wrap gap-1.5" aria-label={t("tagsLabel")}>
			{tags.map((tag) => (
				<li key={tag}>
					<Badge variant="secondary">{tag}</Badge>
				</li>
			))}
		</ul>
	);
}
