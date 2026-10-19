import { useLocale, useTranslations } from "next-intl";
import {
	type StackedBarLayout,
	stackedBarLayout,
	type TaskDay,
} from "@/lib/articles/chart-geometry";
import { formatNumber } from "@/lib/articles/format";

function TasksSvg({
	layout,
	ariaLabel,
	variant,
}: Readonly<{
	layout: StackedBarLayout;
	ariaLabel: string;
	variant: "full" | "compact";
}>) {
	const { width, height, margin, baselineY, gridlines, bars } = layout;
	const compact = variant === "compact";
	// Séparateur décimal et de milliers dépendent de la locale : 0,24 en français, 0.24
	// en anglais.
	const locale = useLocale();
	const t = useTranslations("mdx");
	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			role="img"
			aria-label={ariaLabel}
			className={`chart-svg chart-svg--${variant}`}
			style={{ minWidth: compact ? 300 : 480 }}
		>
			<title>{t("tasksTitle")}</title>
			{gridlines.map((g) => (
				<g key={g.value}>
					<line
						x1={margin.left}
						x2={width - margin.right}
						y1={g.y}
						y2={g.y}
						className={g.value === 0 ? "chart-axis" : "chart-grid"}
					/>
					<text
						x={margin.left - 6}
						y={g.y}
						dy="0.35em"
						textAnchor="end"
						className="chart-tick"
					>
						{g.value}
					</text>
				</g>
			))}
			{bars.map((b) => (
				<g key={b.label}>
					{b.scansHeight > 0 ? (
						<rect
							x={b.x}
							y={b.scansY}
							width={b.width}
							height={b.scansHeight}
							className="chart-bar-scan"
						/>
					) : null}
					{b.otherHeight > 0 ? (
						<rect
							x={b.x}
							y={b.otherY}
							width={b.width}
							height={b.otherHeight}
							className="chart-bar-work"
						/>
					) : null}
					<text
						x={b.cx}
						y={b.topY - 5}
						textAnchor="middle"
						className="chart-value"
					>
						{formatNumber(b.total, 1, locale)}
					</text>
					<text
						x={b.cx}
						y={baselineY + (compact ? 16 : 20)}
						textAnchor="middle"
						className="chart-tick"
					>
						{b.label}
					</text>
				</g>
			))}
		</svg>
	);
}

export function TasksChart({
	days,
	caption,
	figureNumber,
}: Readonly<{
	days: TaskDay[];
	caption?: string;
	figureNumber?: number;
}>) {
	const t = useTranslations("mdx");
	const tFigure = useTranslations("figure");
	const full = stackedBarLayout(days);
	const compact = stackedBarLayout(days, {
		width: 340,
		height: 230,
		margin: { top: 22, right: 2, bottom: 26, left: 28 },
		barRatio: 0.7,
	});
	const summary = full.bars
		.map((b) =>
			t("tasksRow", {
				label: b.label,
				total: b.total,
				scans: b.scans,
				other: b.other,
			}),
		)
		.join(" ; ");
	const ariaLabel = t("tasksAriaLabel", { summary });
	// Défaut porté par le message, plus par une valeur par défaut de paramètre : celle-ci
	// serait figée à la compilation, avant que la locale soit connue.
	const text = caption ?? t("tasksTitle");

	return (
		<figure className="article-figure my-10">
			<ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
				<li className="flex items-center gap-2">
					<span aria-hidden="true" className="chart-swatch chart-swatch-scan" />
					{t("tasksScans")}
				</li>
				<li className="flex items-center gap-2">
					<span aria-hidden="true" className="chart-swatch chart-swatch-work" />
					{t("tasksOther")}
				</li>
			</ul>
			<div className="chart-scroll">
				<TasksSvg layout={full} ariaLabel={ariaLabel} variant="full" />
				<TasksSvg layout={compact} ariaLabel={ariaLabel} variant="compact" />
			</div>
			{text || figureNumber ? (
				<figcaption>
					{figureNumber ? tFigure("prefix", { n: figureNumber }) : ""}
					{text}
				</figcaption>
			) : null}
		</figure>
	);
}
