import { useLocale } from "next-intl";
import {
	type CompareGroup,
	type GroupedBarLayout,
	groupedBarLayout,
} from "@/lib/articles/chart-geometry";
import { formatNumber } from "@/lib/articles/format";

/** Series colors, in order: neutral reference first, accent second. */
const SERIES_TONES = ["base", "accent"] as const;

function seriesTone(series: number): string {
	return SERIES_TONES[series % SERIES_TONES.length];
}

function CompareSvg({
	layout,
	title,
	ariaLabel,
	variant,
	format,
	unit,
}: Readonly<{
	layout: GroupedBarLayout;
	title: string;
	ariaLabel: string;
	variant: "full" | "compact";
	format: (value: number) => string;
	unit?: string;
}>) {
	const { width, height, margin, plotLeft, gridlines, groups } = layout;
	const axisY = height - margin.bottom;
	const compact = variant === "compact";
	const suffix = unit ? ` ${unit}` : "";
	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			role="img"
			aria-label={ariaLabel}
			className={`chart-svg chart-svg--${variant}`}
			style={{ minWidth: compact ? 300 : 480 }}
		>
			<title>{title}</title>
			{gridlines.map((g, i) => (
				<g key={g.value}>
					<line
						x1={g.x}
						x2={g.x}
						y1={margin.top}
						y2={axisY}
						className={i === 0 ? "chart-axis" : "chart-grid"}
					/>
					<text
						x={g.x}
						y={axisY + (compact ? 15 : 18)}
						textAnchor="middle"
						className="chart-tick"
					>
						{format(g.value)}
						{i === gridlines.length - 1 ? suffix : ""}
					</text>
				</g>
			))}
			{groups.map((group) => (
				<g key={group.label}>
					<text
						x={plotLeft - (compact ? 6 : 10)}
						y={group.cy}
						dy="0.35em"
						textAnchor="end"
						className="chart-label"
					>
						{group.label}
					</text>
					{group.bars.map((bar) => (
						<g key={bar.series}>
							<rect
								x={plotLeft}
								y={bar.y}
								width={Math.max(bar.barWidth, 0)}
								height={bar.barHeight}
								rx={2}
								className={`chart-bar-${seriesTone(bar.series)}`}
							/>
							<text
								x={bar.valueX}
								y={bar.cy}
								dy="0.35em"
								className="chart-value"
							>
								{format(bar.value)}
								{suffix}
							</text>
						</g>
					))}
				</g>
			))}
		</svg>
	);
}

/**
 * Barres horizontales groupées : une série de référence (neutre) et une
 * série mise en avant (accent). Une valeur `null` n'affiche pas de barre.
 */
export function CompareChart({
	series,
	groups,
	title,
	unit,
	digits = 1,
	step = 5,
	minMax,
	caption = title,
	figureNumber,
}: Readonly<{
	series: string[];
	groups: CompareGroup[];
	title: string;
	unit?: string;
	digits?: number;
	step?: number;
	minMax?: number;
	caption?: string;
	figureNumber?: number;
}>) {
	// Séparateur décimal et milliers dépendent de la locale : 0,24 en français, 0.24 en
	// anglais. `useLocale` (et non `getTranslations`) garde le composant synchrone.
	const locale = useLocale();
	const format = (value: number) => formatNumber(value, digits, locale);
	// Monospace labels: reserve their width so long ones are not clipped.
	const longest = Math.max(0, ...groups.map(([label]) => label.length));
	const full = groupedBarLayout(groups, {
		step,
		minMax,
		margin: {
			top: 8,
			right: 84,
			bottom: 28,
			left: Math.max(140, Math.ceil(longest * 8.6) + 14),
		},
	});
	const compact = groupedBarLayout(groups, {
		width: 340,
		barHeight: 14,
		barGap: 3,
		groupGap: 12,
		margin: {
			top: 4,
			right: 64,
			bottom: 22,
			left: Math.max(92, Math.ceil(longest * 6.8) + 8),
		},
		step,
		minMax,
		labelGap: 4,
	});
	const suffix = unit ? ` ${unit}` : "";
	const summary = groups
		.map(([label, ...values]) => {
			const parts = values.flatMap((v, i) =>
				v === null
					? []
					: [`${series[i] ?? `série ${i + 1}`} ${format(v)}${suffix}`],
			);
			return `${label} : ${parts.join(", ")}`;
		})
		.join(" ; ");
	const ariaLabel = `${title}. ${summary}.`;

	return (
		<figure className="article-figure my-10">
			<ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
				{series.map((name, i) => (
					<li key={name} className="flex items-center gap-2">
						<span
							aria-hidden="true"
							className={`chart-swatch chart-swatch-${seriesTone(i)}`}
						/>
						{name}
					</li>
				))}
			</ul>
			<div className="chart-scroll">
				<CompareSvg
					layout={full}
					title={title}
					ariaLabel={ariaLabel}
					variant="full"
					format={format}
					unit={unit}
				/>
				<CompareSvg
					layout={compact}
					title={title}
					ariaLabel={ariaLabel}
					variant="compact"
					format={format}
					unit={unit}
				/>
			</div>
			{caption || figureNumber ? (
				<figcaption>
					{figureNumber ? `Fig. ${figureNumber} · ` : ""}
					{caption}
				</figcaption>
			) : null}
		</figure>
	);
}
