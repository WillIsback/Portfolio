import { Badge } from "@/components/ui/badge";

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
