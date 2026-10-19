import { useLocale, useTranslations } from "next-intl";
import {
	type HBarLayout,
	horizontalBarLayout,
	type TokenProfile,
} from "@/lib/articles/chart-geometry";
import { formatNumber } from "@/lib/articles/format";

function TokensSvg({
	layout,
	ariaLabel,
	variant,
}: Readonly<{
	layout: HBarLayout;
	ariaLabel: string;
	variant: "full" | "compact";
}>) {
	const { width, height, margin, plotLeft, gridlines, rows, xMax } = layout;
	const axisY = height - margin.bottom;
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
			<title>{t("tokensTitle")}</title>
			{gridlines.map((g) => (
				<g key={g.value}>
					<line
						x1={g.x}
						x2={g.x}
						y1={margin.top}
						y2={axisY}
						className={g.value === 0 ? "chart-axis" : "chart-grid"}
					/>
					<text
						x={g.x}
						y={axisY + (compact ? 15 : 18)}
						textAnchor="middle"
						className="chart-tick"
					>
						{g.value === xMax ? `${g.value} M` : g.value}
					</text>
				</g>
			))}
			{rows.map((r) => (
				<g key={r.name}>
					<text
						x={plotLeft - (compact ? 6 : 10)}
						y={r.cy}
						dy="0.35em"
						textAnchor="end"
						className="chart-label"
					>
						{r.name}
					</text>
					<rect
						x={plotLeft}
						y={r.y}
						width={Math.max(r.barWidth, 0)}
						height={r.barHeight}
						rx={2}
						className={r.kind === "scan" ? "chart-bar-scan" : "chart-bar-work"}
					/>
					<text x={r.valueX} y={r.cy} dy="0.35em" className="chart-value">
						{formatNumber(r.value, 1, locale)}
					</text>
				</g>
			))}
		</svg>
	);
}

export function TokensChart({
	profiles,
	caption,
	figureNumber,
}: Readonly<{
	profiles: TokenProfile[];
	caption?: string;
	figureNumber?: number;
}>) {
	const locale = useLocale();
	const t = useTranslations("mdx");
	const tFigure = useTranslations("figure");
	const full = horizontalBarLayout(profiles);
	const compact = horizontalBarLayout(profiles, {
		width: 340,
		rowHeight: 26,
		margin: { top: 4, right: 34, bottom: 22, left: 98 },
		labelGap: 4,
	});
	const summary = full.rows
		.map((r) =>
			t("tokensRow", {
				name: r.name,
				value: formatNumber(r.value, 1, locale),
				kind: r.kind === "scan" ? t("tokensKindScan") : t("tokensKindWork"),
			}),
		)
		.join(" ; ");
	const ariaLabel = t("tokensAriaLabel", { summary });
	const text = caption ?? t("tokensCaption");

	return (
		<figure className="article-figure my-10">
			<ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
				<li className="flex items-center gap-2">
					<span aria-hidden="true" className="chart-swatch chart-swatch-scan" />
					{t("tokensScanSeries")}
				</li>
				<li className="flex items-center gap-2">
					<span aria-hidden="true" className="chart-swatch chart-swatch-work" />
					{t("tokensOtherSeries")}
				</li>
			</ul>
			<div className="chart-scroll">
				<TokensSvg layout={full} ariaLabel={ariaLabel} variant="full" />
				<TokensSvg layout={compact} ariaLabel={ariaLabel} variant="compact" />
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
