/**
 * Pure geometry for the article charts. Every mark (bar, label, gridline) is
 * derived from the same linear scale so that drawings and numbers never drift.
 */

export interface Margin {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

/** Linear scale mapping [0, domainMax] onto [rangeStart, rangeEnd]. */
export function linearScale(
	domainMax: number,
	rangeStart: number,
	rangeEnd: number,
): (value: number) => number {
	if (domainMax <= 0) throw new Error("domainMax must be > 0");
	return (value) => rangeStart + (value / domainMax) * (rangeEnd - rangeStart);
}

/** Smallest multiple of `step` that is ≥ max(value, minMax). */
export function niceMax(value: number, step: number, minMax = step): number {
	return Math.max(minMax, Math.ceil(value / step) * step);
}

export function ticks(max: number, step: number): number[] {
	const out: number[] = [];
	for (let v = 0; v <= max + 1e-9; v += step) out.push(v);
	return out;
}

/* ------------------------------------------------------------------ */
/* Stacked vertical bars (TasksChart)                                  */
/* ------------------------------------------------------------------ */

export type TaskDay = [label: string, total: number, scans: number];

export interface StackedBar {
	label: string;
	total: number;
	scans: number;
	other: number;
	x: number;
	width: number;
	/** center x, for labels */
	cx: number;
	scansY: number;
	scansHeight: number;
	otherY: number;
	otherHeight: number;
	/** y of the top of the whole bar */
	topY: number;
}

export interface StackedBarLayout {
	width: number;
	height: number;
	margin: Margin;
	yMax: number;
	baselineY: number;
	gridlines: { value: number; y: number }[];
	bars: StackedBar[];
}

export function stackedBarLayout(
	days: TaskDay[],
	{
		width = 640,
		height = 300,
		margin = { top: 28, right: 8, bottom: 32, left: 40 },
		step = 50,
		minMax = 150,
		barRatio = 0.62,
	}: {
		width?: number;
		height?: number;
		margin?: Margin;
		step?: number;
		minMax?: number;
		barRatio?: number;
	} = {},
): StackedBarLayout {
	for (const [label, total, scans] of days) {
		if (total < 0 || scans < 0 || scans > total) {
			throw new Error(`Invalid day ${label}: scans must be within [0, total]`);
		}
	}
	const maxTotal = Math.max(0, ...days.map((d) => d[1]));
	const yMax = niceMax(maxTotal, step, minMax);
	const baselineY = height - margin.bottom;
	const y = linearScale(yMax, baselineY, margin.top);
	const plotWidth = width - margin.left - margin.right;
	const band = days.length > 0 ? plotWidth / days.length : plotWidth;
	const barWidth = band * barRatio;

	const bars = days.map(([label, total, scans], i) => {
		const x = margin.left + i * band + (band - barWidth) / 2;
		const scansY = y(scans);
		const topY = y(total);
		return {
			label,
			total,
			scans,
			other: total - scans,
			x,
			width: barWidth,
			cx: x + barWidth / 2,
			scansY,
			scansHeight: baselineY - scansY,
			otherY: topY,
			otherHeight: scansY - topY,
			topY,
		};
	});

	return {
		width,
		height,
		margin,
		yMax,
		baselineY,
		gridlines: ticks(yMax, step).map((value) => ({ value, y: y(value) })),
		bars,
	};
}

/* ------------------------------------------------------------------ */
/* Horizontal bars (TokensChart)                                       */
/* ------------------------------------------------------------------ */

export type TokenKind = "scan" | "work";
export type TokenProfile = [name: string, millions: number, kind: TokenKind];

export interface HBarRow {
	name: string;
	value: number;
	kind: TokenKind;
	y: number;
	cy: number;
	barHeight: number;
	barWidth: number;
	/** x where the value label starts */
	valueX: number;
}

export interface HBarLayout {
	width: number;
	height: number;
	margin: Margin;
	xMax: number;
	plotLeft: number;
	plotRight: number;
	gridlines: { value: number; x: number }[];
	rows: HBarRow[];
}

export function horizontalBarLayout(
	profiles: TokenProfile[],
	{
		width = 640,
		rowHeight = 32,
		margin = { top: 8, right: 48, bottom: 28, left: 132 },
		step = 5,
		minMax = 20,
		barRatio = 0.6,
		labelGap = 6,
	}: {
		width?: number;
		rowHeight?: number;
		margin?: Margin;
		step?: number;
		minMax?: number;
		barRatio?: number;
		labelGap?: number;
	} = {},
): HBarLayout {
	const maxValue = Math.max(0, ...profiles.map((p) => p[1]));
	const xMax = niceMax(maxValue, step, minMax);
	const plotLeft = margin.left;
	const plotRight = width - margin.right;
	const x = linearScale(xMax, plotLeft, plotRight);
	const barHeight = rowHeight * barRatio;
	const height = margin.top + profiles.length * rowHeight + margin.bottom;

	const rows = profiles.map(([name, value, kind], i) => {
		const y = margin.top + i * rowHeight + (rowHeight - barHeight) / 2;
		const barWidth = x(value) - plotLeft;
		return {
			name,
			value,
			kind,
			y,
			cy: y + barHeight / 2,
			barHeight,
			barWidth,
			valueX: plotLeft + barWidth + labelGap,
		};
	});

	return {
		width,
		height,
		margin,
		xMax,
		plotLeft,
		plotRight,
		gridlines: ticks(xMax, step).map((value) => ({ value, x: x(value) })),
		rows,
	};
}

/* ------------------------------------------------------------------ */
/* 100 % stacked bar (FaultBuckets)                                    */
/* ------------------------------------------------------------------ */

export interface Share<T> {
	item: T;
	/** percentage of total, unrounded */
	percent: number;
	/** cumulative offset (percent) of the segment start */
	offset: number;
}

export function shares<T extends { count: number }>(
	items: T[],
	total = items.reduce((sum, i) => sum + i.count, 0),
): Share<T>[] {
	if (total <= 0) return items.map((item) => ({ item, percent: 0, offset: 0 }));
	let offset = 0;
	return items.map((item) => {
		const percent = (item.count / total) * 100;
		const share = { item, percent, offset };
		offset += percent;
		return share;
	});
}
