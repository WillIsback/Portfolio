import { describe, expect, it } from "vitest";
import { INITIAL_TRAINING } from "./initial-training";

describe("INITIAL_TRAINING", () => {
	it("affectation validée par Will (2026-10-10)", () => {
		const of = (t: string) =>
			Object.entries(INITIAL_TRAINING)
				.filter(([, v]) => v === t)
				.map(([k]) => Number(k));
		expect(of("FullstackAI")).toEqual([
			1, 6, 7, 8, 9, 10, 11, 12, 16, 17, 18, 19, 26,
		]);
		expect(of("AIEngineer")).toEqual([27, 28]);
		expect(INITIAL_TRAINING[5]).toBeUndefined();
	});
});
