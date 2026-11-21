import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { SolutionCopy, SolutionFacts } from "@/lib/solutions";

/** Une solution dans l'index : nom, statut, promesse, et les deux chemins de sortie. */
export default function SolutionCard({
	facts,
	copy,
}: Readonly<{ facts: SolutionFacts; copy: SolutionCopy }>) {
	const t = useTranslations("solutions");
	return (
		<article className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
			<p className="font-mono text-xs text-ink-soft">{copy.status}</p>
			<h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
				<Link
					href={`/solutions/${facts.slug}`}
					className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					{facts.name}
				</Link>
			</h2>
			<p className="mt-2 text-lg font-medium text-primary">{copy.tagline}</p>
			<p className="mt-3 flex-1 leading-relaxed text-muted-foreground">
				{copy.summary}
			</p>
			<div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs">
				<Link
					href={`/solutions/${facts.slug}`}
					className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					{t("discover", { name: facts.name })}
				</Link>
				<a
					href={facts.site}
					target="_blank"
					rel="noopener"
					className="inline-flex items-center gap-1 rounded-sm text-ink-soft underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					{facts.siteLabel}
					<ArrowUpRight aria-hidden="true" className="size-3" />
				</a>
			</div>
		</article>
	);
}
