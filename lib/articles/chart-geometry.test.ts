import { describe, expect, it } from "vitest";
import {
	horizontalBarLayout,
	linearScale,
	niceMax,
	shares,
	stackedBarLayout,
	type TaskDay,
	type TokenProfile,
	ticks,
} from "./chart-geometry";
import { formatNumberFr, formatPercentFr } from "./format";

const DAYS: TaskDay[] = [
	["28/09", 4, 0],
	["29/09", 2, 0],
	["30/09", 5, 0],
	["01/10", 16, 0],
	["02/10", 6, 0],
	["03/10", 24, 12],
	["04/10", 114, 98],
	["05/10", 106, 86],
	["06/10", 141, 128],
];

const PROFILES: TokenProfile[] = [
	["sre-conductor", 19.4, "scan"],
	["sre-monitor", 16.6, "scan"],
	["sre-diag", 6.5, "work"],
	["auto-eval", 4.8, "work"],
	["sre-reporter", 1.4, "work"],
	["sre-hygiene", 0.6, "work"],
	["sre-dev", 0.4, "work"],
	["sre-doctor", 0.2, "work"],
];

describe("scale helpers", () => {
	it("linearScale maps domain ends onto range ends", () => {
		const y = linearScale(150, 268, 28);
		expect(y(0)).toBe(268);
		expect(y(150)).toBe(28);
		expect(y(75)).toBe(148);
	});

	it("niceMax rounds up to the step with a floor", () => {
		expect(niceMax(141, 50, 150)).toBe(150);
		expect(niceMax(151, 50, 150)).toBe(200);
		expect(niceMax(19.4, 5, 20)).toBe(20);
	});

	it("ticks enumerates every step", () => {
		expect(ticks(150, 50)).toEqual([0, 50, 100, 150]);
		expect(ticks(20, 5)).toEqual([0, 5, 10, 15, 20]);
	});
});

describe("stackedBarLayout", () => {
	const layout = stackedBarLayout(DAYS);
	const plotHeight = layout.baselineY - layout.margin.top;
	const pxPerTask = plotHeight / layout.yMax;

	it("uses gridlines at 0/50/100/150", () => {
		expect(layout.yMax).toBe(150);
		expect(layout.gridlines.map((g) => g.value)).toEqual([0, 50, 100, 150]);
		expect(layout.gridlines[0].y).toBe(layout.baselineY);
		expect(layout.gridlines[3].y).toBe(layout.margin.top);
	});

	it("draws every segment to the same scale as the gridlines", () => {
		for (const bar of layout.bars) {
			expect(bar.scansHeight).toBeCloseTo(bar.scans * pxPerTask, 6);
			expect(bar.otherHeight).toBeCloseTo(
				(bar.total - bar.scans) * pxPerTask,
				6,
			);
			expect(bar.scansY + bar.scansHeight).toBeCloseTo(layout.baselineY, 6);
			// segments are contiguous: other sits right on top of scans
			expect(bar.otherY + bar.otherHeight).toBeCloseTo(bar.scansY, 6);
			// the bar top lines up with the gridline of the same value
			const y = linearScale(layout.yMax, layout.baselineY, layout.margin.top);
			expect(bar.topY).toBeCloseTo(y(bar.total), 6);
		}
	});

	it("keeps heights proportional between bars", () => {
		const a = layout.bars.find((b) => b.label === "06/10");
		const b = layout.bars.find((b) => b.label === "03/10");
		const hA = (a?.scansHeight ?? 0) + (a?.otherHeight ?? 0);
		const hB = (b?.scansHeight ?? 0) + (b?.otherHeight ?? 0);
		expect(hA / hB).toBeCloseTo(141 / 24, 6);
	});

	it("exposes the values used for labels", () => {
		expect(
			layout.bars.map((b) => [b.label, b.total, b.scans, b.other]),
		).toEqual(DAYS.map(([l, t, s]) => [l, t, s, t - s]));
	});

	it("lays bars out left to right inside the plot", () => {
		const xs = layout.bars.map((b) => b.x);
		expect([...xs].sort((p, q) => p - q)).toEqual(xs);
		expect(xs[0]).toBeGreaterThanOrEqual(layout.margin.left);
		const last = layout.bars[layout.bars.length - 1];
		expect(last.x + last.width).toBeLessThanOrEqual(
			layout.width - layout.margin.right,
		);
	});

	it("rejects scans greater than total", () => {
		expect(() => stackedBarLayout([["x", 1, 2]])).toThrow();
	});
});

describe("horizontalBarLayout", () => {
	const layout = horizontalBarLayout(PROFILES);
	const pxPerMillion = (layout.plotRight - layout.plotLeft) / layout.xMax;

	it("uses a 0–20 M axis with gridlines every 5", () => {
		expect(layout.xMax).toBe(20);
		expect(layout.gridlines.map((g) => g.value)).toEqual([0, 5, 10, 15, 20]);
		expect(layout.gridlines[0].x).toBe(layout.plotLeft);
		expect(layout.gridlines[4].x).toBe(layout.plotRight);
	});

	it("draws bar widths proportional to values on the axis scale", () => {
		for (const row of layout.rows) {
			expect(row.barWidth).toBeCloseTo(row.value * pxPerMillion, 6);
			expect(row.valueX).toBeGreaterThan(layout.plotLeft + row.barWidth);
		}
		const [conductor, , diag] = layout.rows;
		expect(conductor.barWidth / diag.barWidth).toBeCloseTo(19.4 / 6.5, 6);
	});

	it("keeps rows ordered and non-overlapping", () => {
		for (let i = 1; i < layout.rows.length; i++) {
			const prev = layout.rows[i - 1];
			expect(layout.rows[i].y).toBeGreaterThanOrEqual(prev.y + prev.barHeight);
		}
	});

	it("formats values French-style", () => {
		expect(formatNumberFr(19.4)).toBe("19,4");
		expect(formatNumberFr(0.2)).toBe("0,2");
		expect(formatNumberFr(24537)).toMatch(/^24\s537$/u);
	});
});

describe("compact (mobile) variants", () => {
	it("keep the same proportions at a smaller size", () => {
		const s = stackedBarLayout(DAYS, {
			width: 340,
			height: 230,
			margin: { top: 22, right: 2, bottom: 26, left: 28 },
		});
		const px = (s.baselineY - s.margin.top) / s.yMax;
		for (const b of s.bars) {
			expect(b.scansHeight + b.otherHeight).toBeCloseTo(b.total * px, 6);
		}
		const h = horizontalBarLayout(PROFILES, {
			width: 340,
			margin: { top: 4, right: 34, bottom: 22, left: 98 },
		});
		expect(h.rows[0].barWidth / h.rows[2].barWidth).toBeCloseTo(19.4 / 6.5, 6);
		expect(h.rows[0].valueX).toBeLessThan(h.width);
	});
});

describe("shares", () => {
	const items = [
		{ id: "capacity", count: 199 },
		{ id: "reasoning", count: 128 },
		{ id: "garbage", count: 100 },
		{ id: "unclassifiable", count: 1 },
	];

	it("computes proportional, contiguous segments summing to 100 %", () => {
		const s = shares(items, 428);
		expect(s.reduce((sum, x) => sum + x.percent, 0)).toBeCloseTo(100, 9);
		expect(s[0].percent).toBeCloseTo((199 / 428) * 100, 9);
		for (let i = 1; i < s.length; i++) {
			expect(s[i].offset).toBeCloseTo(s[i - 1].offset + s[i - 1].percent, 9);
		}
	});

	it("defaults total to the sum of counts", () => {
		expect(shares(items)[1].percent).toBeCloseTo((128 / 428) * 100, 9);
	});

	it("rounds percentages in French format", () => {
		expect(formatPercentFr(199, 428)).toBe("46 %");
		expect(formatPercentFr(128, 428)).toBe("30 %");
		expect(formatPercentFr(100, 428)).toBe("23 %");
		expect(formatPercentFr(1, 428)).toBe("< 1 %");
	});
});
