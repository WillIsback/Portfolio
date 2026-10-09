import { shares } from "@/lib/articles/chart-geometry";
import { formatNumberFr, formatPercentFr } from "@/lib/articles/format";

export interface FaultBucket {
	id: string;
	label: string;
	count: number;
	text: string;
}

/** Bucket colors, strongest first: accent, then fading toward neutral. */
const BUCKET_COLORS = [
	"var(--primary)",
	"color-mix(in oklch, var(--primary) 55%, var(--background))",
	"color-mix(in oklch, var(--muted-foreground) 70%, var(--background))",
	"color-mix(in oklch, var(--muted-foreground) 35%, var(--background))",
];

export function FaultBuckets({
	total,
	traces,
	items,
	caption,
	figureNumber,
}: Readonly<{
	total: number;
	traces: number;
	items: FaultBucket[];
	caption?: string;
	figureNumber?: number;
}>) {
	const segments = shares(items, total).map((s, i) => ({
		...s,
		color: BUCKET_COLORS[Math.min(i, BUCKET_COLORS.length - 1)],
		percentLabel: formatPercentFr(s.item.count, total),
	}));
	const ariaLabel = `Répartition des ${formatNumberFr(total)} échecs d'outils sur ${formatNumberFr(traces)} traces : ${segments
		.map((s) => `${s.item.label} ${s.item.count} (${s.percentLabel})`)
		.join(", ")}.`;

	return (
		<figure className="article-figure my-10 rounded-xl border border-border bg-card p-5 shadow-sm">
			<div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
				<p className="font-display text-lg font-semibold text-foreground">
					{formatNumberFr(total)} échecs d&apos;outils
				</p>
				<p className="text-sm text-muted-foreground">
					sur {formatNumberFr(traces)} traces
				</p>
			</div>
			<div
				role="img"
				aria-label={ariaLabel}
				className="flex h-4 w-full overflow-hidden rounded-full bg-muted"
			>
				{segments.map((s) => (
					<span
						key={s.item.id}
						className="h-full border-r-2 border-card last:border-r-0"
						style={{
							width: `${s.percent}%`,
							minWidth: s.item.count > 0 ? 3 : 0,
							background: s.color,
						}}
					/>
				))}
			</div>
			<ul className="mt-5 divide-y divide-border">
				{segments.map((s) => (
					<li
						key={s.item.id}
						className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0"
					>
						<span
							aria-hidden="true"
							className="relative top-0.5 inline-block size-3 rounded-sm"
							style={{ background: s.color }}
						/>
						<span className="font-display font-semibold text-foreground">
							{s.item.label}
						</span>
						<span className="font-code text-sm tabular-nums text-foreground">
							{formatNumberFr(s.item.count)}
							<span className="text-muted-foreground"> · {s.percentLabel}</span>
						</span>
						<p className="col-start-2 col-end-4 text-[0.95rem] leading-relaxed text-muted-foreground">
							{s.item.text}
						</p>
					</li>
				))}
			</ul>
			{caption || figureNumber ? (
				<figcaption>
					{figureNumber ? `Fig. ${figureNumber} · ` : ""}
					{caption ?? "Répartition des échecs d'outils"}
				</figcaption>
			) : null}
		</figure>
	);
}
