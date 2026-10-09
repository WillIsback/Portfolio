import {
	type StackedBarLayout,
	stackedBarLayout,
	type TaskDay,
} from "@/lib/articles/chart-geometry";
import { formatNumberFr } from "@/lib/articles/format";

const SCANS_LABEL = "Scans d'infrastructure (sre-monitor)";
const OTHER_LABEL = "Toutes les autres tâches";

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
	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			role="img"
			aria-label={ariaLabel}
			className={`chart-svg chart-svg--${variant}`}
			style={{ minWidth: compact ? 300 : 480 }}
		>
			<title>Tâches Kanban créées par jour</title>
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
						{formatNumberFr(b.total)}
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
	caption = "Tâches Kanban créées par jour",
	figureNumber,
}: Readonly<{
	days: TaskDay[];
	caption?: string;
	figureNumber?: number;
}>) {
	const full = stackedBarLayout(days);
	const compact = stackedBarLayout(days, {
		width: 340,
		height: 230,
		margin: { top: 22, right: 2, bottom: 26, left: 28 },
		barRatio: 0.7,
	});
	const summary = full.bars
		.map(
			(b) =>
				`${b.label} : ${b.total} tâches dont ${b.scans} scans et ${b.other} autres`,
		)
		.join(" ; ");
	const ariaLabel = `Diagramme en barres empilées des tâches Kanban créées par jour. ${summary}.`;

	return (
		<figure className="article-figure my-10">
			<ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
				<li className="flex items-center gap-2">
					<span aria-hidden="true" className="chart-swatch chart-swatch-scan" />
					{SCANS_LABEL}
				</li>
				<li className="flex items-center gap-2">
					<span aria-hidden="true" className="chart-swatch chart-swatch-work" />
					{OTHER_LABEL}
				</li>
			</ul>
			<div className="chart-scroll">
				<TasksSvg layout={full} ariaLabel={ariaLabel} variant="full" />
				<TasksSvg layout={compact} ariaLabel={ariaLabel} variant="compact" />
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
